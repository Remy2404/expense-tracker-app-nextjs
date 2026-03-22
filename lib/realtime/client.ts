'use client';

import { aiApi } from '@/lib/api/ai.api';
import { auth } from '@/lib/firebase';
import { io, Socket } from 'socket.io-client';

type RealtimeEventMap = {
  'ai.chat.user': { requestId: string; message: string };
  'ai.chat.start': { requestId: string };
  'ai.chat.delta': { requestId: string; delta: string };
  'ai.chat.complete': { requestId: string; response: Record<string, unknown> };
  'sync.updated': { reason?: string; entities?: string[] };
};

type RealtimeEventName = keyof RealtimeEventMap;
type RealtimeHandler<T extends RealtimeEventName> = (payload: RealtimeEventMap[T]) => void;

const RECONNECT_BACKOFF_INITIAL_MS = 5_000; 
const RECONNECT_BACKOFF_MAX_MS = 120_000; 
const CONNECT_TIMEOUT_MS = 20_000;

class WebRealtimeClient {
  private socket: Socket | null = null;
  private activeUid: string | null = null;
  private listeners = new Map<RealtimeEventName, Set<(payload: unknown) => void>>();
  private connectPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;

  private get reconnectDelayMs(): number {
    const delay = RECONNECT_BACKOFF_INITIAL_MS * Math.pow(2, this.reconnectAttempts);
    return Math.min(delay, RECONNECT_BACKOFF_MAX_MS);
  }

  async connect(): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      this.disconnect();
      return;
    }

    if (this.reconnectTimerId !== null) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }

    if (this.socket && this.activeUid === uid && this.socket.connected) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = (async () => {
      const session = await aiApi.getRealtimeSession();
      if (!session.socket_url) {
        this.scheduleReconnect();
        return;
      }

      this.socket?.disconnect();
      const socket = io(session.socket_url, {
        transports: ['websocket'],
        auth: { token: session.token },
        autoConnect: false,
        reconnection: false, // Managed manually to refresh the session token on each attempt.
      });

      this.socket = socket;
      this.activeUid = uid;
      this.bindSocket(socket);
      socket.connect();
      await this.awaitSocketConnection(socket);

      // Successful connect — reset backoff.
      this.reconnectAttempts = 0;
    })();

    try {
      await this.connectPromise;
    } catch {
      this.scheduleReconnect();
    } finally {
      this.connectPromise = null;
    }
  }

  disconnect(): void {
    if (this.reconnectTimerId !== null) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    this.socket?.disconnect();
    this.socket = null;
    this.activeUid = null;
    this.connectPromise = null;
    this.reconnectAttempts = 0;
  }

  subscribe<T extends RealtimeEventName>(eventName: T, handler: RealtimeHandler<T>): () => void {
    const handlers = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    handlers.add(handler as (payload: unknown) => void);
    this.listeners.set(eventName, handlers);

    return () => {
      const currentHandlers = this.listeners.get(eventName);
      if (!currentHandlers) return;
      currentHandlers.delete(handler as (payload: unknown) => void);
      if (currentHandlers.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimerId !== null) return;
    const delay = this.reconnectDelayMs;
    this.reconnectAttempts += 1;
    this.reconnectTimerId = setTimeout(() => {
      this.reconnectTimerId = null;
      void this.connect();
    }, delay);
  }

  private bindSocket(socket: Socket): void {
    const events: RealtimeEventName[] = [
      'ai.chat.user',
      'ai.chat.start',
      'ai.chat.delta',
      'ai.chat.complete',
      'sync.updated',
    ];

    events.forEach((eventName) => {
      socket.on(eventName, (payload: unknown) => {
        const handlers = this.listeners.get(eventName);
        if (!handlers) return;
        handlers.forEach((handler) => handler(payload));
      });
    });

    // Reconnect only on unexpected disconnects.
    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
        return;
      }
      this.scheduleReconnect();
    });

    socket.on('connect_error', () => {
      this.scheduleReconnect();
    });
  }

  private awaitSocketConnection(socket: Socket): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Realtime connection timed out.'));
      }, CONNECT_TIMEOUT_MS);

      const handleConnect = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      const handleConnectError = (error: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleConnectError);
      };

      socket.on('connect', handleConnect);
      socket.on('connect_error', handleConnectError);
    });
  }
}

export const webRealtimeClient = new WebRealtimeClient();
