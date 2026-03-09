'use client';

import { aiApi } from '@/lib/api/ai.api';
import { auth } from '@/lib/firebase';
import { io, Socket } from 'socket.io-client';

type RealtimeEventMap = {
  'ai.chat.start': { requestId: string };
  'ai.chat.delta': { requestId: string; delta: string };
  'ai.chat.complete': { requestId: string; response: Record<string, unknown> };
  'sync.updated': { reason?: string; entities?: string[] };
};

type RealtimeEventName = keyof RealtimeEventMap;
type RealtimeHandler<T extends RealtimeEventName> = (payload: RealtimeEventMap[T]) => void;

class WebRealtimeClient {
  private static readonly CONNECT_TIMEOUT_MS = 10_000;
  private static readonly RETRY_COOLDOWN_MS = 30_000;
  private socket: Socket | null = null;
  private activeUid: string | null = null;
  private listeners = new Map<RealtimeEventName, Set<(payload: unknown) => void>>();
  private connectPromise: Promise<void> | null = null;
  private disabledUntil = 0;

  async connect(): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      this.disconnect();
      return;
    }

    if (this.socket && this.activeUid === uid && this.socket.connected) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (this.disabledUntil > Date.now()) {
      return;
    }

    this.connectPromise = (async () => {
      const session = await aiApi.getRealtimeSession();
      if (!session.socket_url) {
        this.disabledUntil = Date.now() + WebRealtimeClient.RETRY_COOLDOWN_MS;
        return;
      }

      this.socket?.disconnect();
      const socket = io(session.socket_url, {
        transports: ['websocket'],
        auth: {
          token: session.token,
        },
        autoConnect: false,
        reconnection: true,
      });

      this.socket = socket;
      this.activeUid = uid;
      this.bindSocket(socket);
      socket.connect();
      await this.awaitSocketConnection(socket);
      this.disabledUntil = 0;
    })();

    try {
      await this.connectPromise;
    } catch (error) {
      this.disabledUntil = Date.now() + WebRealtimeClient.RETRY_COOLDOWN_MS;
      this.disconnect();
      throw error;
    } finally {
      this.connectPromise = null;
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.activeUid = null;
    this.connectPromise = null;
  }

  subscribe<T extends RealtimeEventName>(eventName: T, handler: RealtimeHandler<T>): () => void {
    const handlers = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    handlers.add(handler as (payload: unknown) => void);
    this.listeners.set(eventName, handlers);

    return () => {
      const currentHandlers = this.listeners.get(eventName);
      if (!currentHandlers) {
        return;
      }
      currentHandlers.delete(handler as (payload: unknown) => void);
      if (currentHandlers.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  private bindSocket(socket: Socket): void {
    const events: RealtimeEventName[] = [
      'ai.chat.start',
      'ai.chat.delta',
      'ai.chat.complete',
      'sync.updated',
    ];

    events.forEach((eventName) => {
      socket.on(eventName, (payload: unknown) => {
        const handlers = this.listeners.get(eventName);
        if (!handlers) {
          return;
        }
        handlers.forEach((handler) => handler(payload));
      });
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        void this.connect().catch((error) => {
          console.warn('Realtime reconnect failed in web client.', error);
        });
      }
    });
  }

  private awaitSocketConnection(socket: Socket): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(new Error('Realtime connection timed out.'));
      }, WebRealtimeClient.CONNECT_TIMEOUT_MS);

      const handleConnect = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };

      const handleConnectError = (error: Error) => {
        if (settled) {
          return;
        }
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
