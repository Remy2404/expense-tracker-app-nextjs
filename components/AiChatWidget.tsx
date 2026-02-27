'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSWRConfig } from 'swr';
import { useAiChat } from '@/hooks/useAi';
import { AiChatActionPayload, AiChatHistoryItem } from '@/types/ai';
import { useAddExpense, useCategories } from '@/hooks/useData';
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

const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';
const INITIAL_ASSISTANT_MESSAGE: AiChatHistoryItem = {
  role: 'assistant',
  content: 'Hi! I am your AI financial assistant. How can I help you today?',
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

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatHistoryItem[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const isMobile = useIsMobileViewport();
  const { trigger: sendChat, isMutating: isLoading } = useAiChat();
  const { trigger: addExpense } = useAddExpense();
  const { categories } = useCategories();
  const { mutate } = useSWRConfig();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatAssistantContent = (content: string) => {
    if (!content) return content;
    // Improve readability when backend returns compact markdown fragments in one line.
    return content.replace(/\s(?=\*\*[^*]+:\*\*)/g, '\n');
  };

  const resolveCategoryId = (categoryId: string | null, categoryName: string | null) => {
    if (categoryId) return categoryId;
    if (!categoryName) return '';
    return (
      categories.find((cat) => cat.name.trim().toLowerCase() === categoryName.trim().toLowerCase())?.id || ''
    );
  };

  const resolvePayloadNote = (payload: AiChatActionPayload) => {
    const legacyNoteSummary = (payload as { note_summary?: string | null }).note_summary;
    return payload.noteSummary || legacyNoteSummary || payload.note || payload.merchant || 'Expense';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: AiChatHistoryItem = { role: 'user', content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const historyWithUser = [...messages, userMessage];
      const response = await sendChat({
        question: userMessage.content,
        history: historyWithUser,
      });

      let assistantContent = formatAssistantContent(response.answer || '');

      // Keep AI chat behavior aligned with "New Expense" flow:
      // when AI returns a silent add_expense payload, persist it and refresh dashboard data.
      if (response.intent === 'add_expense' && response.silent_action && response.payload?.amount) {
        const categoryId = resolveCategoryId(response.payload.categoryId, response.payload.category);
        if (categoryId) {
          const expenseDate = response.payload.date ? new Date(response.payload.date) : new Date();
          const note = resolvePayloadNote(response.payload);

          await addExpense({
            amount: response.payload.amount,
            currency: 'USD',
            notes: note,
            date: expenseDate.toISOString(),
            category_id: categoryId,
            merchant: response.payload.merchant || undefined,
          });

          await Promise.all([mutate('expenses'), mutate('/api/ai/nudges')]);

          if (!assistantContent.trim()) {
            assistantContent = `Added expense: **$${response.payload.amount.toFixed(2)}**`;
          }
        } else if (!assistantContent.trim()) {
          assistantContent = 'I found the amount, but I still need a valid category before saving.';
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." },
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

  const submitDisabled = !input.trim() || isLoading;

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
          <SheetDescription>Ask spending questions or quickly add expenses with natural language.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-muted/20 px-4 py-4">
          <div
            role="log"
            aria-live="polite"
            aria-label="AI chat messages"
            className="space-y-4 pr-2"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
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

            {isLoading && (
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
              disabled={isLoading}
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
