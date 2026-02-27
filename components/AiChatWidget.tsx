'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { useAiChat } from '@/hooks/useAi';
import { AiChatHistoryItem } from '@/types/ai';
import { useAddExpense, useCategories } from '@/hooks/useData';
import { useSWRConfig } from 'swr';
import ReactMarkdown from 'react-markdown';

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatHistoryItem[]>([{ role: 'assistant', content: 'Hi! I am your AI financial assistant. How can I help you today?' }]);
  const [input, setInput] = useState('');
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AiChatHistoryItem = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
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
          const note =
            response.payload.noteSummary ||
            response.payload.note ||
            response.payload.merchant ||
            'Expense';

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
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all z-50 flex items-center justify-center"
          aria-label="Open AI Assistant"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[600px] h-[80vh] md:h-auto">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-medium">AI Financial Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-card border border-border text-card-foreground rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-card border border-border text-card-foreground rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your finances..."
                className="flex-1 bg-muted border-none rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 text-primary p-1.5 rounded-full hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
