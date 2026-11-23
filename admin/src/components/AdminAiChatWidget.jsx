import React, { useState, useEffect, useRef } from "react";
import Axios from "../axios/axios.config.js";
import {
  Sparkles,
  Send,
  X,
  Minus,
  Maximize2,
  Copy,
  Check,
  Bot,
  User,
  MessageSquare,
} from "lucide-react";

// Formatter to render Markdown nicely with bold, bullet points, headers, and callouts
function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith("### ")) {
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-bold text-gray-900 dark:text-white pt-1.5 pb-0.5 border-b border-gray-100 dark:border-slate-800"
            >
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("#### ")) {
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-bold text-pink-600 dark:text-rose-400 pt-1"
            >
              {line.replace("#### ", "")}
            </h4>
          );
        }

        // Blockquotes
        if (line.startsWith("> ")) {
          return (
            <div
              key={idx}
              className="p-2.5 my-1.5 rounded-xl bg-pink-50/70 dark:bg-rose-950/30 border-l-3 border-pink-600 text-xs text-gray-700 dark:text-rose-200 font-medium"
            >
              {line.replace("> ", "")}
            </div>
          );
        }

        // Bullet points
        if (line.trim().startsWith("- ") || line.trim().startsWith("• ") || line.trim().startsWith("* ")) {
          const clean = line.trim().replace(/^[-•*]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5">
              <span className="text-pink-600 font-black shrink-0 text-xs">•</span>
              <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(clean) }} />
            </div>
          );
        }

        // Numbered list items
        if (/^\d+\.\s/.test(line.trim())) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5">
              <span className="text-gray-400 font-bold shrink-0 text-xs">{line.trim().split(".")[0]}.</span>
              <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(line.trim().replace(/^\d+\.\s*/, "")) }} />
            </div>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={idx} className="h-1" />;
        }

        // Normal paragraph
        return (
          <p
            key={idx}
            dangerouslySetInnerHTML={{ __html: formatInline(line) }}
          />
        );
      })}
    </div>
  );
}

// Inline formatting helper for **bold** and `code` tags
function formatInline(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-gray-900 dark:text-white'>$1</strong>")
    .replace(/`(.*?)`/g, "<code class='px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[11px] font-mono text-pink-600 dark:text-rose-300 font-bold'>$1</code>")
    .replace(/\$(.*?)\$/g, "<em>$1</em>");
}

function AdminAiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `👋 **Hi! I am your DS Style AI Partner, powered by Google Gemini.**\n\nI am right here with you on every page of the admin dashboard. Ask me anything about your products, stock, orders, marketing, or business strategy in your own words!`,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to latest response
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const prompt = inputPrompt.trim();
    if (!prompt || loading) return;

    const userMessage = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setLoading(true);

    try {
      const res = await Axios.post("/api/ai/chat", {
        messages: [...messages, userMessage],
        prompt,
      });

      if (res.data?.success && res.data?.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.data.response,
            provider: res.data.provider,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ I could not process that request right now. Please check that your backend is reachable.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${error.response?.data?.message || error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <>
      {/* Floating Trigger Pill & Icon (When Closed) */}
      {!isOpen && (
        <aside
          aria-label="AI Business Partner Copilot"
          className="fixed z-40 bottom-5 right-5 select-none"
        >
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 transition-all duration-300 cursor-pointer active:scale-95"
            title="Chat with DS Style AI Business Partner"
          >
            {/* Pill Label */}
            <span className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-xs font-bold py-2 px-3.5 rounded-full shadow-lg border border-gray-200/90 dark:border-slate-800 group-hover:border-pink-300 dark:group-hover:border-rose-900 group-hover:shadow-xl transition-all duration-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-gray-900 dark:text-white">AI Partner</span>
            </span>

            {/* Glowing Action Bubble */}
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 to-pink-500 text-white flex items-center justify-center shadow-lg group-hover:shadow-pink-500/30 group-hover:scale-105 transition-all duration-300 shrink-0">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full shadow-2xs" />
            </div>
          </button>
        </aside>
      )}

      {/* Expanded Floating Chat Panel (When Open) */}
      {isOpen && (
        <div className="fixed z-50 bottom-5 right-3 sm:right-5 w-[94vw] sm:w-[420px] md:w-[460px] h-[600px] max-h-[86vh] bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50 via-pink-50/20 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-pink-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>AI Business Partner</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-600 font-bold border border-pink-500/20">
                    Gemini
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-400">
                  Live store assistant across all pages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-gray-400">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition cursor-pointer dark:text-gray-400"
                title="Minimize chat"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition cursor-pointer dark:text-gray-400"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 sm:p-4 relative group ${
                      isUser
                        ? "bg-pink-600 text-white rounded-br-xs shadow-xs"
                        : "bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-bl-xs"
                    }`}
                  >
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="absolute top-2 right-2 p-1 rounded-md bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-400 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Copy"
                      >
                        {copiedIdx === idx ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    {isUser ? (
                      <p className="text-xs sm:text-sm font-medium">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-600 to-pink-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span>Gemini is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask about this page, stock, restock, pricing..."
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-600 transition"
              />
              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="p-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:bg-gray-200 dark:disabled:bg-slate-800 text-white disabled:text-gray-400 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminAiChatWidget;

