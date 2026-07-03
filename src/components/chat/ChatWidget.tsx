"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  content: string;
  navigateTo?: string;
}

const GREETING_MESSAGE: Message = {
  role: "model",
  content:
    "Hey! I'm **Ankit's AI Assistant**, ask me anything about his work, experience, or skills. How can I help?",
};

function parseNavigateDirective(text: string): { clean: string; path: string | null } {
  const match = text.match(/\{\{navigate:(\/[^\}]+)\}\}/);
  if (match) {
    return { clean: text.replace(match[0], "").trim(), path: match[1] };
  }
  return { clean: text, path: null };
}

export function ChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visitorName, setVisitorName] = useState<string | null>(null);
  const [visitorEmail, setVisitorEmail] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessageDirect = useCallback(
    async (userMessage: string, skipNameCapture = false) => {
      if (!userMessage.trim() || loading) return;

      let currentVisitorName = visitorName;
      if (!visitorName && !skipNameCapture) {
        currentVisitorName = userMessage.trim();
        setVisitorName(userMessage.trim());
      }

      const newMessages: Message[] = [
        ...messages,
        { role: "user", content: userMessage.trim() },
      ];
      setMessages(newMessages);
      setLoading(true);

      try {
        const apiMessages = newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const chatApiUrl =
          process.env.NEXT_PUBLIC_CHAT_API_URL || "/api/chat";

        const res = await fetch(chatApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            visitorName: currentVisitorName || null,
            visitorEmail: visitorEmail || null,
          }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        const { clean, path } = parseNavigateDirective(data.message);
        setMessages((prev) => [
          ...prev,
          { role: "model", content: clean, navigateTo: path || undefined },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content:
              "I'm having trouble connecting right now. Please try again in a moment, or reach out directly at **ankit.singh101@gmail.com**.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, visitorName, visitorEmail]
  );

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    sendMessageDirect(text);
  };

  const handleQuickAction = (prompt: string) => {
    sendMessageDirect(prompt, true);
  };

  const openWithPrompt = useCallback(
    (prompt?: string) => {
      setIsOpen(true);
      if (prompt) {
        if (!visitorName) {
          setVisitorName("there");
        }
        setTimeout(() => sendMessageDirect(prompt, true), 350);
      }
    },
    [sendMessageDirect, visitorName]
  );

  useEffect(() => {
    (window as any).__openChat = openWithPrompt;
    return () => {
      delete (window as any).__openChat;
    };
  }, [openWithPrompt]);

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const renderMarkdown = (content: string) => (
    <ReactMarkdown
      components={{
        a: ({ href, children }) => {
          if (href && href.startsWith("/")) {
            return (
              <button
                onClick={(e) => { e.stopPropagation(); handleNavigate(href); }}
                className="text-primary underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
              >
                {children}
              </button>
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-surface-container-highest text-on-surface rotate-45"
            : "cta-gradient text-white hover:scale-110"
        }`}
        aria-label={isOpen ? "Close chat" : "Open AI Assistant"}
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? "close" : "auto_awesome"}
        </span>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-50 w-[min(400px,calc(100vw-1.5rem))] transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl shadow-primary/10 flex flex-col h-[min(520px,75vh)] overflow-hidden ghost-border">
          {/* Header */}
          <div className="cta-gradient px-5 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                fluid
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm font-[family-name:var(--font-headline)]">
                Ankit&apos;s AI Assistant
              </h3>
              <p className="text-white/70 text-xs">
                Ask anything about Ankit
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                aria-label="Minimize chat"
                title="Minimize"
              >
                <span className="material-symbols-outlined text-white text-base">remove</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setMessages([GREETING_MESSAGE]);
                  setVisitorName(null);
                  setVisitorEmail(null);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close chat"
                title="Close and reset"
              >
                <span className="material-symbols-outlined text-white text-base">close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-on-primary rounded-br-md"
                        : "bg-surface-container-low text-on-surface rounded-bl-md"
                    }`}
                  >
                    {msg.role === "model" ? (
                      <div className="chat-markdown prose prose-sm max-w-none [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:text-inherit [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1">
                        {renderMarkdown(msg.content)}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
                {msg.navigateTo && (
                  <div className="flex justify-start mt-1.5 ml-1">
                    <button
                      onClick={() => handleNavigate(msg.navigateTo!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Go to page
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-container-low px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {[
                "Tell me about Ankit's experience",
                "What projects has he worked on?",
                "What are his top skills?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickAction(q)}
                  className="text-xs bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-full hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Email capture (for calendar invites) */}
          {!visitorEmail && (
            <div className="px-3 pt-3 flex gap-2 border-t border-outline-variant/10 flex-shrink-0">
              <input
                type="email"
                value={visitorEmail || ""}
                onChange={(e) => setVisitorEmail(e.target.value.trim() || null)}
                placeholder="Email (for 1:1 calendar invite)"
                className="flex-1 bg-surface-container-low rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-on-surface-variant/50"
                disabled={loading}
                autoComplete="email"
                inputMode="email"
              />
            </div>
          )}

          {/* Input */}
          <form
            id="chat-form"
            onSubmit={handleFormSubmit}
            className="px-3 py-3 flex gap-2 border-t border-outline-variant/10 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Ankit..."
              className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-on-surface-variant/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary text-on-primary p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
