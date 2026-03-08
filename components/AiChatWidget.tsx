'use client';

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSWRConfig } from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { useAddExpense, useCategories } from '@/hooks/useData';
import { aiApi } from '@/lib/api/ai.api';
import { webRealtimeClient } from '@/lib/realtime/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AiChatActionPayload, AiChatHistoryItem, AiChatMessage, AiChatResponse } from '@/types/ai';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';
const INITIAL_ASSISTANT_MESSAGE: AiChatMessage = {
  id: 'assistant-welcome',
  role: 'assistant',
  content: 'Hi! I am your AI financial assistant. How can I help you today?',
  createdAt: 0,
};

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateViewportState = () => setIsMobile(mediaQueryList.matches);
    updateViewportState();

    mediaQueryList.addEventListener('change', updateViewportState);
    return () => mediaQueryList.removeEventListener('change', updateViewportState);
  }, []);

  return isMobile;
}

const createRequestId = () =>
  `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createMessageId = (role: 'user' | 'assistant') =>
  `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getStreamingMessageId = (requestId: string) => `assistant-stream-${requestId}`;

export function AiChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoadedForUid, setHistoryLoadedForUid] = useState<string | null>(null);
  const isMobile = useIsMobileViewport();
  const { trigger: addExpense } = useAddExpense();
  const { categories } = useCategories();
  const { mutate } = useSWRConfig();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingRequestIdsRef = useRef(new Set<string>());
  const streamedRequestIdsRef = useRef(new Set<string>());
  const completedRequestIdsRef = useRef(new Set<string>());

  const formatAssistantContent = useCallback((content: string) => {
    if (!content) return content;
    return content.replace(/\s(?=\*\*[^*]+:\*\*)/g, '\n');
  }, []);

  const resolveCategoryId = useCallback(
    (categoryId: string | null, categoryName: string | null) => {
      if (categoryId) return categoryId;
      if (!categoryName) return '';
      return (
        categories.find((cat) => cat.name.trim().toLowerCase() === categoryName.trim().toLowerCase())?.id || ''
      );
    },
    [categories]
  );

  const resolvePayloadNote = useCallback((payload: AiChatActionPayload) => {
    const legacyNoteSummary = (payload as { note_summary?: string | null }).note_summary;
    return payload.noteSummary || legacyNoteSummary || payload.note || payload.merchant || 'Expense';
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const connectRealtimeIfAvailable = useCallback(async () => {
    try {
      await webRealtimeClient.connect();
    } catch (error) {
      console.warn('AI realtime unavailable in web chat. Falling back to HTTP chat.', error);
      webRealtimeClient.disconnect();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, isStreaming, messages, scrollToBottom]);

  useEffect(() => {
    if (!user) {
      pendingRequestIdsRef.current.clear();
      streamedRequestIdsRef.current.clear();
      completedRequestIdsRef.current.clear();
      webRealtimeClient.disconnect();
    }
  }, [user]);

  const upsertAssistantMessage = useCallback((content: string, requestId?: string) => {
    const trimmedContent = formatAssistantContent(content.trim());
    if (!trimmedContent && !requestId) {
      return;
    }

    setMessages((currentMessages) => {
      const messageId = requestId ? getStreamingMessageId(requestId) : null;
      if (messageId) {
        const existingIndex = currentMessages.findIndex((message) => message.id === messageId);
        if (existingIndex >= 0) {
          const nextMessages = [...currentMessages];
          nextMessages[existingIndex] = {
            ...nextMessages[existingIndex],
            content: trimmedContent || nextMessages[existingIndex].content,
          };
          return nextMessages;
        }
      }

      if (!trimmedContent) {
        return currentMessages;
      }

      return [
        ...currentMessages,
        {
          id: messageId ?? createMessageId('assistant'),
          role: 'assistant',
          content: trimmedContent,
          createdAt: Date.now(),
        },
      ];
    });
  }, [formatAssistantContent]);

  const applyChatResponse = useCallback(async (response: AiChatResponse, requestId?: string) => {
    let assistantContent = formatAssistantContent(response.answer || '');

    if (response.intent === 'add_expense' && response.silent_action && response.payload?.amount) {
      const categoryId = resolveCategoryId(response.payload.categoryId, response.payload.category);
      if (categoryId) {
        const expenseDate = response.payload.date ? new Date(response.payload.date) : new Date();
        const note = resolvePayloadNote(response.payload);

        await addExpense({
          amount: response.payload.amount,
          transaction_type: 'expense',
          currency: 'USD',
          notes: note,
          date: expenseDate.toISOString(),
          category_id: categoryId,
          merchant: response.payload.merchant || undefined,
        });

        await Promise.all([
          mutate('expenses'),
          mutate((key) => Array.isArray(key) && key[0] === 'finance-summary', undefined, {
            revalidate: true,
          }),
          mutate('/api/ai/nudges'),
        ]);

        if (!assistantContent.trim()) {
          assistantContent = `Added expense: **$${response.payload.amount.toFixed(2)}**`;
        }
      } else if (!assistantContent.trim()) {
        assistantContent = 'I found the amount, but I still need a valid category before saving.';
      }
    }

    if (assistantContent.trim()) {
      upsertAssistantMessage(assistantContent, requestId);
    }

    if (requestId) {
      pendingRequestIdsRef.current.delete(requestId);
      streamedRequestIdsRef.current.delete(requestId);
      completedRequestIdsRef.current.add(requestId);
    }

    setIsStreaming(false);
  }, [addExpense, formatAssistantContent, mutate, resolveCategoryId, resolvePayloadNote, upsertAssistantMessage]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void connectRealtimeIfAvailable();
    const unsubscribeDelta = webRealtimeClient.subscribe('ai.chat.delta', (payload) => {
      if (!pendingRequestIdsRef.current.has(payload.requestId)) {
        return;
      }
      streamedRequestIdsRef.current.add(payload.requestId);
      upsertAssistantMessage(payload.delta, payload.requestId);
    });

    const unsubscribeComplete = webRealtimeClient.subscribe('ai.chat.complete', (payload) => {
      if (!pendingRequestIdsRef.current.has(payload.requestId)) {
        return;
      }
      void applyChatResponse(payload.response as unknown as AiChatResponse, payload.requestId);
    });

    return () => {
      unsubscribeDelta();
      unsubscribeComplete();
    };
  }, [applyChatResponse, connectRealtimeIfAvailable, upsertAssistantMessage, user]);

  useEffect(() => {
    if (!isOpen || !user || historyLoadedForUid === user.uid) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await aiApi.getChatHistory(40);
        if (cancelled) {
          return;
        }
        const hydratedMessages = response.messages.map<AiChatMessage>((message) => ({
          id: message.id,
          role: message.role,
          content: formatAssistantContent(message.content),
          createdAt: Date.parse(message.created_at),
        }));
        setMessages(hydratedMessages.length > 0 ? hydratedMessages : [INITIAL_ASSISTANT_MESSAGE]);
        setHistoryLoadedForUid(user.uid);
      } catch {
        if (!cancelled) {
          setMessages([INITIAL_ASSISTANT_MESSAGE]);
          setHistoryLoadedForUid(user.uid);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formatAssistantContent, historyLoadedForUid, isOpen, user]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    const requestId = createRequestId();
    const userMessage: AiChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: trimmedInput,
      createdAt: Date.now(),
    };
    const nextHistory: AiChatHistoryItem[] = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    pendingRequestIdsRef.current.add(requestId);
    streamedRequestIdsRef.current.delete(requestId);
    completedRequestIdsRef.current.delete(requestId);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      await connectRealtimeIfAvailable();
      const response = await aiApi.streamChat({
        question: trimmedInput,
        history: nextHistory.slice(-12),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        local_now_iso: new Date().toISOString(),
        requestId,
      });

      if (!streamedRequestIdsRef.current.has(requestId) && !completedRequestIdsRef.current.has(requestId)) {
        await applyChatResponse(response, requestId);
      }
    } catch {
      pendingRequestIdsRef.current.delete(requestId);
      streamedRequestIdsRef.current.delete(requestId);
      completedRequestIdsRef.current.delete(requestId);
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        { id: createMessageId('assistant'), role: 'assistant', content: "Sorry, I'm having trouble connecting right now.", createdAt: Date.now() },
      ]);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSendMessage();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const submitDisabled = !input.trim() || isStreaming;

  const renderedMessages = useMemo(() => {
    if (!user) {
      return [INITIAL_ASSISTANT_MESSAGE];
    }
    return historyLoadedForUid === user.uid ? messages : [INITIAL_ASSISTANT_MESSAGE];
  }, [historyLoadedForUid, messages, user]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon"
          className={cn(
            'fixed bottom-6 right-4 z-40 h-14 w-14 rounded-full shadow-xl md:bottom-8 md:right-8',
            'bg-primary text-primary-foreground hover:scale-[1.03] hover:shadow-2xl',
            'focus-visible:ring-2 focus-visible:ring-primary/50',
            isOpen && 'pointer-events-none opacity-0'
          )}
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'z-50 flex h-[86vh] w-full max-w-none flex-col overflow-hidden border-border p-0 sm:h-full',
          isMobile ? 'rounded-t-2xl' : 'w-[min(100vw,28rem)]'
        )}
      >
        <SheetHeader className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
            AI Financial Assistant
          </SheetTitle>
          <SheetDescription>Ask spending questions or quickly add transactions with natural language.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-muted/20 px-4 py-4">
          <div role="log" aria-live="polite" aria-label="AI chat messages" className="space-y-4 pr-2">
            {renderedMessages.map((message) => (
              <div
                key={message.id}
                className={cn('flex gap-2.5', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {message.role === 'assistant' && (
                  <span
                    className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <Bot className="h-4 w-4" />
                  </span>
                )}

                <div
                  className={cn(
                    'max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                    message.role === 'user'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm border border-border bg-background text-foreground'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none break-words text-foreground prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <Bot className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Thinking...</span>
                </div>
                <span className="sr-only">Assistant is generating a response</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-background px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <label htmlFor="ai-assistant-message" className="sr-only">
              Ask AI assistant
            </label>
            <input
              id="ai-assistant-message"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask about your finances..."
              autoComplete="off"
              aria-label="Message AI assistant"
              disabled={isStreaming}
              className={cn(
                'h-11 flex-1 rounded-xl border border-border bg-muted/30 px-3.5 text-sm text-foreground',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70'
              )}
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 rounded-xl"
              aria-label="Send message"
              disabled={submitDisabled}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
