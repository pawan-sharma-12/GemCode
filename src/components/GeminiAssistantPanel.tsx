import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Wand2,
  Bug,
  Lightbulb,
  Clock,
  FlaskConical,
  Copy,
  Check,
  ArrowRightCircle,
  RefreshCw,
  Code2,
  Bot,
  User,
  Zap,
  ListOrdered,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { DSAProblem, ExecutionResult } from '../types/dsa';
import {
  askGeminiDSAAssistant,
  GeminiAssistantMode,
} from '../utils/geminiAssistant';

interface GeminiAssistantPanelProps {
  problem: DSAProblem;
  currentCode: string;
  language?: string;
  executionResult?: ExecutionResult | null;
  onApplyCodeToEditor: (codeToApply: string) => void;
  themeMode?: 'dark' | 'light';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: GeminiAssistantMode;
  isError?: boolean;
  retryPayload?: {
    mode: GeminiAssistantMode;
    label: string;
    query?: string;
  };
}

export const GeminiAssistantPanel: React.FC<GeminiAssistantPanelProps> = ({
  problem,
  currentCode,
  language = 'cpp',
  executionResult,
  onApplyCodeToEditor,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am **GemCode AI**, your intelligent algorithms and problem-solving mentor.\n\nI can analyze your solution for **${problem.title}**, optimize your algorithmic patterns (DP, Two Pointers, Graphs, Binary Search), debug edge cases, or guide you through step-by-step intuition.\n\nChoose an algorithmic action below or ask me any question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle Quick Action trigger
  const handleQuickAction = async (mode: GeminiAssistantMode, label: string) => {
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await askGeminiDSAAssistant({
        mode,
        problem,
        currentCode,
        language,
        executionResult,
        history: messages.filter((m) => !m.isError).map((m) => ({ role: m.role, text: m.text })),
      });

      const assistantMsg: ChatMessage = {
        id: `gemcode-${Date.now()}`,
        role: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const rawError = err.message || 'Could not fetch response. Please try again.';
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: rawError,
        isError: true,
        retryPayload: { mode, label },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Chat Submit
  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputQuery.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askGeminiDSAAssistant({
        mode: 'chat',
        problem,
        currentCode,
        language,
        userPrompt: query,
        executionResult,
        history: messages.filter((m) => !m.isError).map((m) => ({ role: m.role, text: m.text })),
      });

      const assistantMsg: ChatMessage = {
        id: `gemcode-${Date.now()}`,
        role: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const rawError = err.message || 'Could not generate response.';
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: rawError,
        isError: true,
        retryPayload: { mode: 'chat', label: 'Retry Chat Query', query },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Retry
  const handleRetry = (msg: ChatMessage) => {
    if (isLoading || !msg.retryPayload) return;
    if (msg.retryPayload.mode === 'chat' && msg.retryPayload.query) {
      setInputQuery(msg.retryPayload.query);
      setTimeout(() => {
        handleQuickAction('chat', msg.retryPayload?.query || 'Retry Query');
      }, 50);
    } else {
      handleQuickAction(msg.retryPayload.mode, msg.retryPayload.label);
    }
  };

  // Copy code from AI response
  const handleCopyCode = (snippet: string, snippetId: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCodeId(snippetId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Parse markdown code blocks in message
  const renderMessageContent = (content: string, msgId: string, msgObj?: ChatMessage) => {
    if (msgObj?.isError) {
      return (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="font-semibold text-rose-300">GemCode AI Server Notice</div>
              <div className="text-[11px] leading-relaxed text-rose-200/90 font-mono break-words">
                {content}
              </div>
            </div>
          </div>
          {msgObj.retryPayload && (
            <button
              onClick={() => handleRetry(msgObj)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow shadow-cyan-900/30 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Retry Request Now</span>
            </button>
          )}
        </div>
      );
    }

    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let blockCount = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
          key: `txt-${lastIndex}`,
        });
      }

      const lang = match[1] || 'code';
      const codeText = match[2].trim();
      const codeId = `${msgId}-code-${blockCount++}`;

      parts.push({
        type: 'code',
        lang,
        content: codeText,
        id: codeId,
        key: codeId,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
        key: `txt-${lastIndex}`,
      });
    }

    return (
      <div className="space-y-3 text-xs leading-relaxed">
        {parts.map((part) => {
          if (part.type === 'code' && part.id) {
            return (
              <div
                key={part.key}
                className="my-2 rounded-xl overflow-hidden border border-cyan-800/60 bg-[#060b13] shadow-lg"
              >
                {/* Code Header Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1726] border-b border-cyan-900/40 text-[11px]">
                  <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    {part.lang || 'code'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Apply directly to Editor button */}
                    <button
                      onClick={() => onApplyCodeToEditor(part.content)}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md font-semibold text-[10px] flex items-center gap-1 transition-all shadow-sm shadow-cyan-900/30"
                      title="Apply this solution directly to your editor"
                    >
                      <ArrowRightCircle className="w-3 h-3 text-white" />
                      <span>Apply to Editor</span>
                    </button>

                    {/* Copy code button */}
                    <button
                      onClick={() => handleCopyCode(part.content, part.id!)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                      title="Copy code"
                    >
                      {copiedCodeId === part.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Body */}
                <pre className="p-3 overflow-x-auto font-mono text-[11px] text-emerald-300 leading-snug bg-black/40 selection:bg-cyan-900 selection:text-white">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          }

          // Format basic markdown (bold, lists)
          const formatted = part.content
            .split('\n')
            .map((line, lIdx) => {
              if (line.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="font-bold text-sm text-cyan-400 dark:text-cyan-300 mt-2 mb-1">
                    {line.replace('### ', '')}
                  </h4>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h3
                    key={lIdx}
                    className={`font-bold text-sm mt-2.5 mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}
                  >
                    {line.replace('## ', '')}
                  </h3>
                );
              }
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <li
                    key={lIdx}
                    className={`ml-4 list-disc my-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: line
                          .substring(2)
                          .replace(
                            /\*\*(.*?)\*\*/g,
                            `<strong class="${isLight ? 'text-slate-900 font-bold' : 'text-white font-bold'}">$1</strong>`
                          )
                          .replace(
                            /`([^`]+)`/g,
                            `<code class="px-1 py-0.5 rounded ${
                              isLight ? 'bg-slate-200 text-blue-800' : 'bg-slate-800 text-cyan-300'
                            } font-mono text-[11px]">$1</code>`
                          ),
                      }}
                    />
                  </li>
                );
              }
              if (line.trim() === '') {
                return <div key={lIdx} className="h-1.5" />;
              }
              return (
                <p
                  key={lIdx}
                  className={isLight ? 'text-slate-700' : 'text-slate-300'}
                  dangerouslySetInnerHTML={{
                    __html: line
                      .replace(
                        /\*\*(.*?)\*\*/g,
                        `<strong class="${isLight ? 'text-slate-900 font-bold' : 'text-white font-bold'}">$1</strong>`
                      )
                      .replace(
                        /`([^`]+)`/g,
                        `<code class="px-1 py-0.5 rounded ${
                          isLight ? 'bg-slate-200 text-blue-800' : 'bg-slate-800 text-cyan-300'
                        } font-mono text-[11px]">$1</code>`
                      ),
                  }}
                />
              );
            });

          return <div key={part.key}>{formatted}</div>;
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full select-text overflow-hidden transition-colors ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#080d18] text-slate-200'
      }`}
    >
      {/* Header with Quick Action Buttons */}
      <div
        className={`p-3 border-b space-y-2.5 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0a1120] border-slate-800/90'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3
                className={`font-bold text-xs flex items-center gap-1.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <span>GemCode AI</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                  }`}
                >
                  Algorithm Copilot
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={() =>
              setMessages([
                {
                  id: `welcome-${Date.now()}`,
                  role: 'assistant',
                  text: `Chat cleared. Ready for next prompt on **${problem.title}**!`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            className={`p-1 rounded transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Clear Chat History"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <button
            onClick={() => handleQuickAction('suggest', '💡 Suggest Optimal Algorithm & Code')}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all text-left truncate disabled:opacity-50 border ${
              isLight
                ? 'bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 border-blue-200 shadow-sm'
                : 'bg-[#111c30] hover:bg-blue-900/40 border-slate-700 text-cyan-300 hover:border-cyan-500/50'
            }`}
          >
            <Wand2 className="w-3 h-3 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span className="truncate">Suggest & Optimize</span>
          </button>

          <button
            onClick={() => handleQuickAction('debug', '🐛 Find Bug in My Solution')}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all text-left truncate disabled:opacity-50 border ${
              isLight
                ? 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 border-rose-200 shadow-sm'
                : 'bg-[#111c30] hover:bg-rose-900/30 border-slate-700 text-rose-300 hover:border-rose-500/50'
            }`}
          >
            <Bug className="w-3 h-3 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="truncate">Debug & Fix Logic</span>
          </button>

          <button
            onClick={() => handleQuickAction('hints', '🧩 Give Progressive Hints')}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all text-left truncate disabled:opacity-50 border ${
              isLight
                ? 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-800 border-amber-200 shadow-sm'
                : 'bg-[#111c30] hover:bg-amber-900/30 border-slate-700 text-amber-300 hover:border-amber-500/50'
            }`}
          >
            <Lightbulb className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate">Progressive Hints</span>
          </button>

          <button
            onClick={() => handleQuickAction('dry_run', '🔍 Visual Dry-Run Trace')}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all text-left truncate disabled:opacity-50 border ${
              isLight
                ? 'bg-teal-50/70 hover:bg-teal-100/80 text-teal-800 border-teal-200 shadow-sm'
                : 'bg-[#111c30] hover:bg-teal-900/30 border-slate-700 text-teal-300 hover:border-teal-500/50'
            }`}
          >
            <ListOrdered className="w-3 h-3 shrink-0 text-teal-600 dark:text-teal-400" />
            <span className="truncate">Dry-Run Trace</span>
          </button>

          <button
            onClick={() => handleQuickAction('complexity', '⏳ Analyze Big-O Complexity')}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all text-left truncate disabled:opacity-50 border ${
              isLight
                ? 'bg-purple-50/70 hover:bg-purple-100/80 text-purple-800 border-purple-200 shadow-sm'
                : 'bg-[#111c30] hover:bg-purple-900/30 border-slate-700 text-purple-300 hover:border-purple-500/50'
            }`}
          >
            <Clock className="w-3 h-3 shrink-0 text-purple-600 dark:text-purple-400" />
            <span className="truncate">Time & Space Big-O</span>
          </button>

          <button
            onClick={() => handleQuickAction('edge_cases', '🧪 Generate Edge Test Cases')}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all text-left truncate disabled:opacity-50 border ${
              isLight
                ? 'bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 border-emerald-200 shadow-sm'
                : 'bg-[#111c30] hover:bg-emerald-900/30 border-slate-700 text-emerald-300 hover:border-emerald-500/50'
            }`}
          >
            <FlaskConical className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">Edge Test Cases</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div
        ref={chatScrollRef}
        className={`flex-1 overflow-y-auto p-3 space-y-3.5 scroll-smooth divide-y ${
          isLight ? 'divide-slate-200' : 'divide-slate-800/40'
        }`}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`pt-3 first:pt-0 flex gap-2.5 ${
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-sm'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Message Card */}
            <div
              className={`max-w-[88%] rounded-xl p-3 shadow-md border ${
                m.role === 'user'
                  ? isLight
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                    : 'bg-blue-950/80 border-blue-800 text-blue-100 rounded-tr-none'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-800 rounded-tl-none shadow-slate-200'
                  : 'bg-[#0f172a] border-slate-800 rounded-tl-none text-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-between gap-2 mb-1.5 border-b pb-1 ${
                  m.role === 'user'
                    ? 'border-blue-400/40 text-blue-100'
                    : isLight
                    ? 'border-slate-200 text-cyan-700'
                    : 'border-slate-800/60 text-cyan-400'
                }`}
              >
                <span className="font-semibold text-[11px]">
                  {m.role === 'user' ? 'You' : 'GemCode AI'}
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    m.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>

              {renderMessageContent(m.text, m.id, m)}
            </div>
          </div>
        ))}

        {/* Streaming / Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2.5 pt-2 text-cyan-600 dark:text-cyan-400 animate-pulse">
            <div className="w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div
              className={`p-3 rounded-xl rounded-tl-none text-xs flex items-center gap-2 border ${
                isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0f172a] border-slate-800 text-slate-300'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span>GemCode AI is analyzing algorithms & code...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Chat Input */}
      <form
        onSubmit={handleSendPrompt}
        className={`p-3 border-t flex items-center gap-2 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0a1120] border-slate-800'
        }`}
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask GemCode: e.g. 'How to optimize with Two Pointers?', 'Explain DP transition'..."
            disabled={isLoading}
            className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs disabled:opacity-50 transition-all border focus:outline-none focus:ring-1 ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-cyan-600 focus:ring-cyan-600/30'
                : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send query to GemCode AI (Enter)"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
};
