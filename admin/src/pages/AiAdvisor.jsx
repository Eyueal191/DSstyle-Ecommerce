import React, { useState, useEffect, useRef } from "react";
import Axios from "../axios/axios.config.js";
import {
  Sparkles,
  Send,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  Copy,
  Check,
  Bot,
  User,
  ArrowRight,
  Zap,
  BarChart3,
  Calendar,
} from "lucide-react";

// Formatter to render Markdown nicely with bold, bullet points, headers, and callouts
function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith("### ")) {
          return (
            <h3
              key={idx}
              className="text-base sm:text-lg font-bold text-gray-900 dark:text-white pt-2 pb-1 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2"
            >
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("#### ")) {
          return (
            <h4
              key={idx}
              className="text-sm sm:text-base font-bold text-pink-600 dark:text-rose-400 pt-1"
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
              className="p-3 my-2 rounded-xl bg-pink-50/70 dark:bg-rose-950/30 border-l-4 border-pink-600 text-xs sm:text-sm text-gray-700 dark:text-rose-200 font-medium"
            >
              {line.replace("> ", "")}
            </div>
          );
        }

        // Bullet points
        if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
          const clean = line.trim().replace(/^[-•]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-pink-600 font-black shrink-0">•</span>
              <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(clean) }} />
            </div>
          );
        }

        // Numbered list items
        if (/^\d+\.\s/.test(line.trim())) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-gray-400 font-bold shrink-0">{line.trim().split(".")[0]}.</span>
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
    .replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-xs font-mono text-pink-600 dark:text-rose-300 font-bold'>$1</code>")
    .replace(/\$(.*?)\$/g, "<em>$1</em>");
}

function AiAdvisor() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `👋 **Hello! I am your DS Style AI Partner, powered directly by Google Gemini.**\n\nI have real-time visibility into your store's live database—including your 33 products, inventory levels, sales channels, and orders.\n\nYou can talk to me completely naturally in your own English (or Amharic) about anything for your store:
• Ask about which items to restock or how to move stagnant stock
• Brainstorm Telegram promo drops and marketing ideas
• Ask about product pricing, profit margins, or beauty trends
• Review sales performance or discuss customer feedback

What's on your mind today?`,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [overviewMetrics, setOverviewMetrics] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [hasGeminiActive, setHasGeminiActive] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to latest response
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch initial overview metrics & check existing AI setting
  const fetchOverview = async () => {
    try {
      const [res, setRes] = await Promise.all([
        Axios.get("/api/ai/quick-scan/overview"),
        Axios.get("/api/setting").catch(() => null),
      ]);
      if (res.data?.success) {
        setOverviewMetrics(res.data.data);
      }
      if (setRes?.data?.data?.geminiApiKey) {
        setHasGeminiActive(true);
        setGeminiApiKeyInput(setRes.data.data.geminiApiKey);
      }
    } catch (err) {
      console.warn("Failed to load AI overview metrics:", err.message);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSaveGeminiKey = async () => {
    try {
      setIsSavingKey(true);
      await Axios.put("/api/setting", { geminiApiKey: geminiApiKeyInput.trim() });
      setHasGeminiActive(Boolean(geminiApiKeyInput.trim()));
      setShowKeyModal(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: geminiApiKeyInput.trim()
            ? `🎉 **Google Gemini 2.0 Flash is now Active!**\nYour store is now equipped with Google's latest multimodal reasoning intelligence. Ask me any question about your store, customer patterns, or retail strategy in plain English or Amharic!`
            : `ℹ️ Switched back to the built-in **DS Style Autonomous Intelligence Engine**.`,
          provider: geminiApiKeyInput.trim() ? "gemini-2.0-flash" : "dsstyle-ai-engine",
        },
      ]);
    } catch (err) {
      alert("Failed to save API Key: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const prompt = (textToSend || inputPrompt || "").trim();
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
            metadata: res.data.metadata,
          },
        ]);
        fetchOverview();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Sorry, I could not complete the analysis. Please check that your store has active products and orders.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error running AI analysis: ${error.response?.data?.message || error.message}`,
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
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#181124] to-[#250d1e] p-6 sm:p-8 text-white shadow-lg border border-slate-800/80">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>Google Gemini 3.5 Flash • Natural Conversational Partner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight">
              DS Style <span className="text-pink-500 font-sans">AI Business Partner</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Open-ended conversational intelligence. Discuss inventory, customer trends, restocking, marketing ideas, or pricing in your own natural English—just like talking to Gemini!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowKeyModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                hasGeminiActive
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300"
                  : "bg-pink-500 hover:bg-pink-600 text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{hasGeminiActive ? "⚡ Gemini Active" : "🔑 Free Gemini Key"}</span>
            </button>

            <button
              onClick={fetchOverview}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold transition-all cursor-pointer backdrop-blur-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Live Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Store KPI Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
            {overviewMetrics
              ? `${overviewMetrics.totalInventoryValuationETB?.toLocaleString()} ETB`
              : "..."}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Retail worth of in-stock catalog</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
            <span>Critical Restocks</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {overviewMetrics !== null ? overviewMetrics.lowStockCount : "..."} items
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Running low (&lt; 5 units left)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
            <span>Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-pink-600">
            {overviewMetrics
              ? `${overviewMetrics.totalRevenueETB?.toLocaleString()} ETB`
              : "..."}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Counter + Online storefront</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
            <span>Active Catalog</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
            {overviewMetrics !== null ? overviewMetrics.totalProducts : "..."} products
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {overviewMetrics !== null ? overviewMetrics.totalCategories : "..."} categories
          </p>
        </div>
      </div>

      {/* Conversational AI Chat Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col h-[700px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-rose-950/60 text-pink-600 flex items-center justify-center font-black">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Live Retail Intelligence Session
              </h3>
              <p className="text-[11px] text-gray-400">
                Connected to DS Style MongoDB Product & Order Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition cursor-pointer"
          >
            Clear Chat
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-600 to-pink-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 relative group ${
                    isUser
                      ? "bg-pink-600 text-white rounded-br-xs shadow-xs"
                      : "bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-bl-xs"
                  }`}
                >
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer dark:text-gray-400"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {isUser ? (
                    <p className="text-sm font-medium">{msg.content}</p>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}

                  {msg.provider && (
                    <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-slate-700/60 flex items-center gap-2 text-[10px] text-gray-400">
                      <span>Engine: {msg.provider}</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-600 to-pink-700 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2.5">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span>Crunching store orders, inventory velocities, and running forecasting models...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Input Form - Clean Open-Ended Discussion */}
        <div className="p-4 border-t border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about DS Style store, products, restock ideas, marketing, sales..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-50/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-600 transition"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="px-5 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 disabled:bg-gray-200 dark:disabled:bg-slate-800 text-white disabled:text-gray-400 font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Ask Advisor</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Google Gemini Free Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Google Gemini 2.0 Flash AI
                  </h3>
                  <p className="text-xs text-gray-400">100% Free Forever Tier from Google AI Studio</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 text-pink-900 dark:text-pink-200">
                <p className="font-bold mb-1">🎁 How to get your free key in 30 seconds:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-pink-600 font-bold underline">Google AI Studio (Click Here)</a></li>
                  <li>Click <strong>&quot;Create API Key&quot;</strong> (No credit card required).</li>
                  <li>Copy and paste your key below, then click <strong>&quot;Save &amp; Activate&quot;</strong>!</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Gemini API Key:
                </label>
                <input
                  type="password"
                  value={geminiApiKeyInput}
                  onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGeminiKey}
                disabled={isSavingKey}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSavingKey ? "Saving..." : "Save & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiAdvisor;

