import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  MessageCircle,
  X,
  Send,
  Sprout,
  Loader2,
  Globe,
  Bot,
  User,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const SUGGESTED_QUESTIONS = [
  'What is GDD and how does it affect rice?',
  'How do I identify blast disease in wheat?',
  'Best time to apply urea for paddy?',
  'Current MSP for rice in India?',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800/80 border border-white/10 w-fit">
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

function ChatMessage({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
          isBot
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-950/50'
            : 'bg-gradient-to-br from-slate-600 to-slate-800 border border-white/10'
        }`}
      >
        {isBot ? (
          <Sprout className="w-3.5 h-3.5 text-white" />
        ) : (
          <User className="w-3.5 h-3.5 text-slate-300" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-sans whitespace-pre-wrap break-words ${
          isBot
            ? 'bg-slate-800/80 border border-white/10 text-slate-100 rounded-tl-sm'
            : 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-tr-sm shadow-lg shadow-emerald-950/40'
        }`}
      >
        {msg.content}
        {msg.searchUsed && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/10 text-[10px] text-emerald-300 font-mono">
            <Globe className="w-3 h-3" />
            <span>Web search used</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function KrishiBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Namaste! I\'m KrishiBot — your AI agronomist.\n\nAsk me anything about crop stages, fertilizer schedules, pest management, weather advisory, or MSP prices. I can also search the web for real-time data.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasNewMsg(false);
    }
  }, [isOpen]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const resp = await axios.post(
        `${API_URL}/chat`,
        { messages: newMessages.map(({ role, content }) => ({ role, content })) },
        { timeout: 30000 }
      );
      const reply = resp.data.reply || 'Sorry, I could not generate a response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      if (!isOpen) setHasNewMsg(true);
    } catch (err) {
      const errMsg =
        err.response?.data?.error || 'Network error. Please check your connection.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* --------------------------------------------------------- */}
      {/* CHAT PANEL                                                 */}
      {/* --------------------------------------------------------- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-5 z-[9998] w-[370px] sm:w-[400px] flex flex-col"
            style={{
              maxHeight: 'calc(100vh - 130px)',
              height: '580px',
            }}
          >
            <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-emerald-500/25 shadow-2xl shadow-black/60"
              style={{
                background: 'linear-gradient(160deg, #0d1510 0%, #070b09 100%)',
                backdropFilter: 'blur(24px)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                    <Sprout className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display-luxury tracking-tight">
                      KrishiBot
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span>Llama-3.3-70B • Tavily Search</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} msg={msg} />
                ))}

                {loading && (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
                      <Sprout className="w-3.5 h-3.5 text-white" />
                    </div>
                    <TypingIndicator />
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Suggested Questions (show only at start) */}
              {messages.length <= 1 && (
                <div className="px-4 pb-3 shrink-0">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                    Quick Questions
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-left text-xs text-slate-300 hover:text-emerald-300 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-950/30 transition-all font-sans"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="px-4 py-3 border-t border-white/10 bg-slate-950/40 shrink-0">
                <div className="flex items-end gap-2 bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-emerald-500/60 transition-colors">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Auto-resize
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about crops, pests, weather..."
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none focus:outline-none font-sans min-h-[20px] max-h-[100px] leading-snug disabled:opacity-50"
                    style={{ lineHeight: '1.4' }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 transition-all flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 font-mono mt-1.5 text-center">
                  Powered by Groq LLaMA-3.3 • Tavily Search
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------- */}
      {/* FAB TRIGGER BUTTON                                        */}
      {/* --------------------------------------------------------- */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-2xl shadow-emerald-950/60 flex items-center justify-center text-white"
        style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.45)' }}
        aria-label="Open KrishiBot chat"
        id="krishibot-fab"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* New message indicator badge */}
        {hasNewMsg && !isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#070b09] flex items-center justify-center text-[8px] font-bold text-white"
          />
        )}
      </motion.button>
    </>
  );
}
