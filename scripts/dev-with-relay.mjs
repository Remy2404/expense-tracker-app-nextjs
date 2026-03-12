import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const childProcesses = [];
let shuttingDown = false;
const relayPort = Number(process.env.RELAY_PORT || process.env.PORT || 8090);

const stopAll = (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  childProcesses.forEach((child) => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });

  setTimeout(() => process.exit(exitCode), 250);
};

const startProcess = (command, label) => {
  const child = spawn(command, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
    shell: true,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }
    if (signal) {
      console.error(`[${label}] exited from signal: ${signal}`);
      stopAll(1);
      return;
    }
    stopAll(code ?? 0);
  });

  childProcesses.push(child);
  return child;
};

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const probe = createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, '0.0.0.0');
  });

startProcess('npm run dev:next', 'next');
if (await isPortAvailable(relayPort)) {
  startProcess('node --env-file=.env.local ./scripts/realtime-relay.mjs', 'relay');
} else {
  console.log(`[relay] Port ${relayPort} already in use. Skipping relay startup.`);
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
