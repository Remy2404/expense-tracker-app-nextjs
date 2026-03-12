import { createServer } from 'node:http';
import crypto from 'node:crypto';
import { Server } from 'socket.io';

const port = Number(process.env.RELAY_PORT || process.env.PORT || 8090);
const relaySecret = process.env.RELAY_SECRET || process.env.REALTIME_RELAY_SECRET || '';
const allowedOrigin = process.env.RELAY_ALLOWED_ORIGIN || '*';

if (!relaySecret) {
  throw new Error('RELAY_SECRET is required to start the realtime relay.');
}

const base64Url = (buffer) => buffer.toString('base64url');

const signPayload = (payload) => {
  const hmac = crypto.createHmac('sha256', relaySecret);
  hmac.update(payload);
  return base64Url(hmac.digest());
};

const timingSafeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const verifyRealtimeToken = (token) => {
  const [firebaseUid, expiresAtRaw, signature] = token.split('.');
  if (!firebaseUid || !expiresAtRaw || !signature) {
    throw new Error('Malformed realtime token.');
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error('Realtime token expired.');
  }

  const payload = `${firebaseUid}.${expiresAtRaw}`;
  const expectedSignature = signPayload(payload);
  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new Error('Invalid realtime token signature.');
  }

  return { firebaseUid, expiresAt };
};

const server = createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/internal/events') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const authorization = req.headers.authorization || '';
  const expectedAuthorization = `Bearer ${relaySecret}`;
  if (authorization !== expectedAuthorization) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  try {
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const { type, firebaseUid, ...eventPayload } = payload;

    if (typeof type !== 'string' || typeof firebaseUid !== 'string' || !firebaseUid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Event payload requires type and firebaseUid.' }));
      return;
    }

    io.to(firebaseUid).emit(type, eventPayload);
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ accepted: true }));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request body.' }));
  }
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) {
      next(new Error('Missing realtime auth token.'));
      return;
    }

    const claims = verifyRealtimeToken(token);
    socket.data.firebaseUid = claims.firebaseUid;
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Realtime authentication failed.'));
  }
});

io.on('connection', (socket) => {
  const firebaseUid = socket.data.firebaseUid;
  if (typeof firebaseUid === 'string' && firebaseUid) {
    socket.join(firebaseUid);
  }
});

server.listen(port, () => {
  console.log(`Realtime relay listening on port ${port}`);
});
