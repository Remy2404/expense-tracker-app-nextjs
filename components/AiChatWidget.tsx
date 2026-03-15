'use client';

import {
  FormEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Bot, GripVertical, Loader2, Send, Sparkles, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSWRConfig } from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAddBudget,
  useAddCategory,
  useAddExpense,
  useAddGoal,
  useAddRecurringExpense,
  useCategories,
} from '@/hooks/useData';
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
} from '@/components/ui/sheet';
import {
  AiChatActionPayload,
  AiChatHistoryItem,
  AiChatMessage,
  AiChatResponse,
  AiChatSuggestedAction,
} from '@/types/ai';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';
const INITIAL_ASSISTANT_MESSAGE: AiChatMessage = {
  id: 'assistant-welcome',
  role: 'assistant',
  content: 'Hi! I am your AI financial assistant. How can I help you today?',
  createdAt: 0,
};
const MAX_TEXTAREA_HEIGHT = 220;
const DESKTOP_MIN_PANEL_WIDTH = 320;
const DESKTOP_MAX_PANEL_WIDTH = 600;
const DESKTOP_DEFAULT_PANEL_WIDTH = 420;
const PANEL_WIDTH_STORAGE_KEY = 'expense-tracker-ai-chat-width';

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

const parseNumberedQuickReplies = (content: string): string[] => {
  const matches = [...content.matchAll(/(?:^|\n)\s*\d+\.\s+([^\n]+)/g)]
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));
  return matches.length >= 2 && matches.length <= 6 ? matches : [];
};

const clampPanelWidth = (width: number) =>
  Math.max(DESKTOP_MIN_PANEL_WIDTH, Math.min(width, DESKTOP_MAX_PANEL_WIDTH));

const getChatActionErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message).trim();
    if (message) {
      return message;
    }
  }
  return "I couldn't complete that request right now.";
};

export function AiChatWidget() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [suggestedActions, setSuggestedActions] = useState<AiChatSuggestedAction[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const [historyLoadedForUid, setHistoryLoadedForUid] = useState<string | null>(null);
  const [desktopPanelWidth, setDesktopPanelWidth] = useState(DESKTOP_DEFAULT_PANEL_WIDTH);
  const isMobile = useIsMobileViewport();
  const { trigger: addExpense } = useAddExpense();
  const { trigger: addBudget } = useAddBudget();
  const { trigger: addGoal } = useAddGoal();
  const { trigger: addCategory } = useAddCategory();
  const { trigger: addRecurringExpense } = useAddRecurringExpense();
  const { categories } = useCategories();
  const { mutate } = useSWRConfig();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        categories.find(
          (cat) => cat.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
        )?.id || ''
      );
    },
    [categories]
  );

  const resolvePayloadNote = useCallback((payload: AiChatActionPayload) => {
    const legacyNoteSummary = (payload as { note_summary?: string | null }).note_summary;
    return payload.noteSummary || legacyNoteSummary || payload.note || payload.merchant || 'Expense';
  }, []);

  const normalizePayloadType = useCallback(
    (payload: AiChatActionPayload) => (payload.type === 'income' ? 'income' : 'expense'),
    []
  );

  const normalizeCategoryType = useCallback(
    (payload: AiChatActionPayload) => (payload.categoryType === 'income' ? 'income' : 'expense'),
    []
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedWidth = window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
    if (!storedWidth) {
      return;
    }
    const parsedWidth = Number(storedWidth);
    if (Number.isFinite(parsedWidth)) {
      setDesktopPanelWidth(clampPanelWidth(parsedWidth));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(desktopPanelWidth));
  }, [desktopPanelWidth]);

  const handleResizeStart = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (typeof window === 'undefined') {
        return;
      }

      setIsResizingPanel(true);

      const handlePointerMove = (moveEvent: globalThis.MouseEvent) => {
        const nextWidth = clampPanelWidth(window.innerWidth - moveEvent.clientX);
        setDesktopPanelWidth(nextWidth);
      };

      const handlePointerUp = () => {
        setIsResizingPanel(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
    },
    []
  );

  const handleResetPanelWidth = useCallback(() => {
    setDesktopPanelWidth(DESKTOP_DEFAULT_PANEL_WIDTH);
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

  useLayoutEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    if (!uid) {
      pendingRequestIdsRef.current.clear();
      streamedRequestIdsRef.current.clear();
      completedRequestIdsRef.current.clear();
      webRealtimeClient.disconnect();
      setSuggestedActions([]);
    }
  }, [uid]);

  const upsertAssistantMessage = useCallback(
    (content: string, requestId?: string) => {
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
    },
    [formatAssistantContent]
  );

  const applyChatResponse = useCallback(
    async (response: AiChatResponse, requestId?: string) => {
      let assistantContent = formatAssistantContent(response.answer || '');

      const transactions =
        response.transactions && response.transactions.length > 0
          ? response.transactions
          : response.payload
            ? [response.payload]
            : [];

      if (
        response.intent === 'add_transaction' &&
        response.silent_action &&
        transactions.length > 0
      ) {
        const saveableTransactions = transactions.filter(
          (transaction) => typeof transaction.amount === 'number'
        );
        const unresolvedTransaction = saveableTransactions.find(
          (transaction) => !resolveCategoryId(transaction.categoryId, transaction.category)
        );

        if (!unresolvedTransaction) {
          for (const transaction of saveableTransactions) {
            const categoryId = resolveCategoryId(transaction.categoryId, transaction.category);
            if (!categoryId || transaction.amount == null) {
              continue;
            }

            const expenseDate = transaction.date ? new Date(transaction.date) : new Date();
            const note = resolvePayloadNote(transaction);

            await addExpense({
              amount: transaction.amount,
              transaction_type: normalizePayloadType(transaction),
              currency: transaction.currency || 'USD',
              notes: note,
              date: expenseDate.toISOString(),
              category_id: categoryId,
              merchant: transaction.merchant || undefined,
            });
          }

          await Promise.all([
            mutate('expenses'),
            mutate((key) => Array.isArray(key) && key[0] === 'finance-summary', undefined, {
              revalidate: true,
            }),
            mutate('/api/ai/nudges'),
          ]);

          if (!assistantContent.trim()) {
            assistantContent =
              saveableTransactions.length === 1
                ? `Added ${normalizePayloadType(saveableTransactions[0])}: **$${saveableTransactions[0].amount!.toFixed(2)}**`
                : `Added ${saveableTransactions.length} transactions from your message.`;
          }
        } else if (!assistantContent.trim()) {
          assistantContent =
            'I found the amounts, but I still need a valid category before saving.';
        }
      }

      if (response.intent === 'add_budget' && response.silent_action && response.payload) {
        const month = response.payload.month;
        const totalAmount = response.payload.totalAmount;
        if (month && typeof totalAmount === 'number' && totalAmount > 0) {
          const result = await addBudget({ month, total_amount: totalAmount });
          await Promise.all([mutate('budgets'), mutate('/api/ai/nudges')]);
          if (!assistantContent.trim()) {
            assistantContent =
              result.action === 'updated'
                ? `Updated your existing budget for **${month}** to **$${totalAmount.toFixed(2)}**.`
                : `Created budget: **$${totalAmount.toFixed(2)}** for ${month}.`;
          }
        }
      }

      if (response.intent === 'add_goal' && response.silent_action && response.payload) {
        const { name, targetAmount, currentAmount, deadline, color, icon } = response.payload;
        if (name && typeof targetAmount === 'number' && targetAmount > 0 && deadline) {
          await addGoal({
            name,
            target_amount: targetAmount,
            current_amount: currentAmount ?? 0,
            deadline: new Date(deadline).toISOString(),
            color: color || '#10B981',
            icon: icon || 'target',
          });
          await Promise.all([mutate('savings_goals'), mutate('/api/ai/nudges')]);
          if (!assistantContent.trim()) {
            assistantContent = `Created goal: **${name}** with target **$${targetAmount.toFixed(2)}**.`;
          }
        }
      }

      if (response.intent === 'add_category' && response.silent_action && response.payload) {
        const { name, icon, color } = response.payload;
        if (name) {
          await addCategory({
            name,
            icon: icon || 'tag',
            color: color || '#6366F1',
            type: normalizeCategoryType(response.payload),
            is_default: false,
          });
          await Promise.all([mutate('categories'), mutate('/api/ai/nudges')]);
          if (!assistantContent.trim()) {
            assistantContent = `Created category: **${name}**.`;
          }
        }
      }

      if (
        response.intent === 'add_recurring_expense' &&
        response.silent_action &&
        response.payload
      ) {
        const payload = response.payload;
        const categoryId = resolveCategoryId(payload.categoryId, payload.category);
        if (
          categoryId &&
          typeof payload.amount === 'number' &&
          payload.amount > 0 &&
          payload.frequency &&
          payload.startDate
        ) {
          await addRecurringExpense({
            amount: payload.amount,
            category_id: categoryId,
            frequency: payload.frequency,
            start_date: new Date(payload.startDate).toISOString(),
            end_date: payload.endDate ? new Date(payload.endDate).toISOString() : undefined,
            notes: payload.note || undefined,
            notification_enabled: payload.notificationEnabled ?? true,
            notification_days_before: payload.notificationDaysBefore ?? 1,
            next_due_date: new Date(payload.startDate).toISOString(),
            is_active: true,
            currency: payload.currency || 'USD',
          });
          await Promise.all([mutate('recurring_expenses'), mutate('/api/ai/nudges')]);
          if (!assistantContent.trim()) {
            assistantContent = `Created recurring expense: **$${payload.amount.toFixed(2)}** ${payload.frequency}.`;
          }
        }
      }

      if (assistantContent.trim()) {
        upsertAssistantMessage(assistantContent, requestId);
      }
      setSuggestedActions(response.suggested_actions ?? []);

      if (requestId) {
        pendingRequestIdsRef.current.delete(requestId);
        streamedRequestIdsRef.current.delete(requestId);
        completedRequestIdsRef.current.add(requestId);
      }

      setIsStreaming(false);
    },
    [
      addBudget,
      addCategory,
      addExpense,
      addGoal,
      addRecurringExpense,
      formatAssistantContent,
      mutate,
      normalizeCategoryType,
      normalizePayloadType,
      resolveCategoryId,
      resolvePayloadNote,
      upsertAssistantMessage,
    ]
  );

  useEffect(() => {
    if (!uid) {
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
  }, [applyChatResponse, connectRealtimeIfAvailable, uid, upsertAssistantMessage]);

  useEffect(() => {
    if (!isOpen || !uid || historyLoadedForUid === uid) {
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
        setSuggestedActions([]);
        setHistoryLoadedForUid(uid);
      } catch {
        if (!cancelled) {
          setMessages([INITIAL_ASSISTANT_MESSAGE]);
          setSuggestedActions([]);
          setHistoryLoadedForUid(uid);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formatAssistantContent, historyLoadedForUid, isOpen, uid]);

  const handleSendMessage = useCallback(
    async (draftOverride?: string) => {
      const trimmedInput = (draftOverride ?? input).trim();
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

        if (
          !streamedRequestIdsRef.current.has(requestId) &&
          !completedRequestIdsRef.current.has(requestId)
        ) {
          await applyChatResponse(response, requestId);
        }
      } catch (error) {
        pendingRequestIdsRef.current.delete(requestId);
        streamedRequestIdsRef.current.delete(requestId);
        completedRequestIdsRef.current.delete(requestId);
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId('assistant'),
            role: 'assistant',
            content: getChatActionErrorMessage(error),
            createdAt: Date.now(),
          },
        ]);
      }
    },
    [applyChatResponse, connectRealtimeIfAvailable, input, isStreaming, messages]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSendMessage();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const handleResetConversation = useCallback(async () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Clear this conversation from the chat window?')
    ) {
      return;
    }
    try {
      setIsResetting(true);
      if (uid) {
        await aiApi.clearChatHistory();
      }
      pendingRequestIdsRef.current.clear();
      streamedRequestIdsRef.current.clear();
      completedRequestIdsRef.current.clear();
      setMessages([INITIAL_ASSISTANT_MESSAGE]);
      setSuggestedActions([]);
      setInput('');
      setIsStreaming(false);
      setHistoryLoadedForUid(uid);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to clear chat history right now.';
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } finally {
      setIsResetting(false);
    }
  }, [uid]);

  const handleQuickReply = useCallback(
    async (reply: string) => {
      if (isStreaming) {
        return;
      }
      setInput(reply);
      void handleSendMessage(reply);
    },
    [handleSendMessage, isStreaming]
  );

  const handleSuggestedAction = useCallback(
    async (prompt: string) => {
      if (isStreaming) {
        return;
      }
      setInput(prompt);
      void handleSendMessage(prompt);
    },
    [handleSendMessage, isStreaming]
  );

  const submitDisabled = !input.trim() || isStreaming;

  const renderedMessages = useMemo(() => {
    if (!uid) {
      return [INITIAL_ASSISTANT_MESSAGE];
    }
    return historyLoadedForUid === uid ? messages : [INITIAL_ASSISTANT_MESSAGE];
  }, [historyLoadedForUid, messages, uid]);

  const panelContent = (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Bot className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">AI Financial Assistant</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ask spending questions or quickly add transactions with natural language.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              aria-label="Reset conversation"
              onClick={() => void handleResetConversation()}
              disabled={isResetting}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              aria-label="Close AI assistant"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-muted/20 px-4 py-4">
        <div role="log" aria-live="polite" aria-label="AI chat messages" className="space-y-4 pr-2">
          {renderedMessages.map((message) => {
            const quickReplies =
              message.role === 'assistant' ? parseNumberedQuickReplies(message.content) : [];
            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2.5',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <span
                    className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <Bot className="h-4 w-4" />
                  </span>
                )}

                <div className="max-w-[86%] space-y-2">
                  <div
                    className={cn(
                      'rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                      message.role === 'user'
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md border border-border bg-background text-foreground'
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
                  {message.role === 'assistant' && quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {quickReplies.map((reply) => (
                        <Button
                          key={`${message.id}-${reply}`}
                          type="button"
                          variant="outline"
                          className="h-auto rounded-full px-3 py-2 text-xs font-medium"
                          onClick={() => void handleQuickReply(reply)}
                          disabled={isStreaming}
                        >
                          {reply}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex items-start gap-2.5">
              <span
                className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <Bot className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-2 rounded-3xl rounded-bl-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {uid && historyLoadedForUid === uid && suggestedActions.length > 0 && (
        <div className="border-t border-border/80 bg-background/95 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Suggested next steps
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedActions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant="outline"
                className="h-auto rounded-full px-3 py-2 text-xs font-medium"
                onClick={() => void handleSuggestedAction(action.prompt)}
                disabled={isStreaming}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border bg-background px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <label htmlFor="ai-assistant-message" className="sr-only">
            Ask AI assistant
          </label>
          <textarea
            id="ai-assistant-message"
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onInput={resizeTextarea}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask about your finances..."
            autoComplete="off"
            aria-label="Message AI assistant"
            disabled={isStreaming}
            rows={1}
            className={cn(
              'min-h-[2.75rem] max-h-[13.75rem] flex-1 resize-none rounded-2xl border border-border bg-muted/30 px-3.5 py-3 text-sm text-foreground',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70'
            )}
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-2xl"
            aria-label="Send message"
            disabled={submitDisabled}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {!isOpen && (
        <Button
          type="button"
          size="icon"
          className={cn(
            'fixed bottom-6 right-4 z-40 h-14 w-14 rounded-full shadow-xl md:bottom-8 md:right-8',
            'bg-primary text-primary-foreground hover:scale-[1.03] hover:shadow-2xl',
            'focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
          aria-label="Open AI assistant"
          onClick={() => setIsOpen(true)}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </Button>
      )}

      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="bottom"
            hideClose
            className="z-50 flex h-[86vh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl border-border p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>AI Financial Assistant</SheetTitle>
              <SheetDescription>Chat with your financial assistant.</SheetDescription>
            </SheetHeader>
            {panelContent}
          </SheetContent>
        </Sheet>
      ) : isOpen ? (
        <aside
          className="relative z-30 hidden h-dvh shrink-0 border-l border-border bg-background shadow-2xl md:flex"
          style={{ width: desktopPanelWidth }}
          aria-label="AI assistant panel"
        >
          <button
            type="button"
            aria-label="Resize AI assistant panel"
            title="Drag to resize. Double-click to reset width."
            onMouseDown={handleResizeStart}
            onDoubleClick={handleResetPanelWidth}
            className="group absolute inset-y-0 -left-5 hidden w-10 cursor-col-resize items-center justify-center md:flex"
          >
            <span
              className={cn(
                'flex h-24 w-4 items-center justify-center rounded-full border bg-background/95 shadow-sm transition-all duration-150',
                'group-hover:h-28 group-hover:w-5 group-hover:border-primary/40 group-hover:text-foreground group-hover:shadow-md',
                isResizingPanel
                  ? 'h-28 w-5 border-primary/50 text-primary shadow-md shadow-primary/10'
                  : 'border-border/80 text-muted-foreground'
              )}
            >
              <GripVertical className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
          {panelContent}
        </aside>
      ) : null}
    </>
  );
}
