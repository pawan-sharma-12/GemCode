import React, { useRef, useState, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import {
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Download,
  Play,
  Settings2,
  Code2,
  Zap,
  Terminal,
  Sun,
  Moon,
  Palette,
  Info,
  Layers,
  FileCode,
  X,
} from 'lucide-react';
import { EditorSettings, EditorTheme, ExecutionResult } from '../types/dsa';
import { defineCustomThemes } from '../utils/monacoThemes';
import { registerCppAutocomplete } from '../utils/cppAutocomplete';
import { formatCppCode } from '../utils/cppFormatter';

interface EditorPaneProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  settings: EditorSettings;
  onChangeSettings: (newSettings: Partial<EditorSettings>) => void;
  onResetCode: () => void;
  onRunCode: () => void;
  isRunning: boolean;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onOpenSnippets: () => void;
  executionResult: ExecutionResult | null;
  onOpenGemini?: () => void;
  themeMode?: 'dark' | 'light';
  isConsolePaneCollapsed?: boolean;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  code,
  onChangeCode,
  settings,
  onChangeSettings,
  onResetCode,
  onRunCode,
  isRunning,
  isFullScreen,
  onToggleFullScreen,
  onOpenSnippets,
  executionResult,
  onOpenGemini,
  themeMode = 'dark',
  isConsolePaneCollapsed = false,
}) => {
  const isLight = themeMode === 'light';
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showQuickOutputInFull, setShowQuickOutputInFull] = useState(false);
  const [showEnvironmentModal, setShowEnvironmentModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => {
        editorRef.current.layout();
      }, 50);
    }
  }, [isConsolePaneCollapsed]);
  // Handle Monaco mounting
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define 20-30% brighter custom themes
    defineCustomThemes(monaco);

    // Register smart dynamic C++ autocomplete
    registerCppAutocomplete(monaco);

    // Focus editor
    editor.focus();
  };

  // Format code action
  const handleFormat = () => {
    if (!code) return;
    const formatted = formatCppCode(code);
    onChangeCode(formatted);
  };

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .cpp file
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'solution.cpp';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Quick insert snippet pill
  const handleQuickInsert = (text: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      editorRef.current.executeEdits('quick-insert', [
        {
          range: selection,
          text: text,
          forceMoveMarkers: true,
        },
      ]);
      editorRef.current.focus();
    } else {
      onChangeCode(code + '\n' + text);
    }
  };

  // Themes list
  const themes: { id: EditorTheme; name: string; isDark: boolean; badge: string }[] = [
    { id: 'ultra-bright-dark', name: 'Ultra Bright Dark+ (Recommended)', isDark: true, badge: '25% Brighter' },
    { id: 'cyberpunk-neon', name: 'Cyberpunk Neon Glow', isDark: true, badge: 'Vivid Neon' },
    { id: 'monokai-vivid', name: 'Monokai Vivid Pro', isDark: true, badge: 'High Contrast' },
    { id: 'one-dark-vivid', name: 'One Dark Vivid', isDark: true, badge: 'Crisp' },
    { id: 'clean-bright-light', name: 'Clean Bright Light', isDark: false, badge: 'Daytime' },
  ];

  return (
    <div
      className={`flex flex-col transition-all ${
        isLight ? 'bg-slate-100' : 'bg-[#0b0f17]'
      } ${
        isFullScreen
          ? 'fixed inset-0 z-50 w-screen h-screen m-0 p-0 rounded-none shadow-none'
          : 'flex-1 h-full min-w-0 min-h-0'
      }`}
    >
      {/* Editor Main Toolbar */}
      <div
        className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 shrink-0 select-none ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0e1422] border-slate-800'
        }`}
      >
        {/* Left: Language & Status & Fullscreen badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={settings.language || 'cpp'}
                onChange={(e) => {
                  const newLang = e.target.value as any;
                  onChangeSettings({ language: newLang });
                }}
                className={`rounded-md px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:ring-1 transition-colors border ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-blue-700 focus:ring-blue-500 hover:border-blue-400'
                    : 'bg-slate-900 border-slate-700 hover:border-cyan-500/50 text-cyan-300 focus:ring-cyan-500'
                }`}
                title="Select Programming Language"
              >
                <option value="cpp">C++ (C++20)</option>
                <option value="python">Python 3</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
              </select>
            </div>
            <span
              className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
            >
              {settings.language === 'python'
                ? 'solution.py'
                : settings.language === 'java'
                ? 'Solution.java'
                : settings.language === 'javascript'
                ? 'solution.js'
                : settings.language === 'typescript'
                ? 'solution.ts'
                : settings.language === 'go'
                ? 'solution.go'
                : 'solution.cpp'}
            </span>

            {/* Hidden Headers / Pre-included Environment Info Badge */}
            <button
              onClick={() => setShowEnvironmentModal(true)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all border ${
                isLight
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/50 hover:border-cyan-600'
              }`}
              title="View pre-included standard headers, namespaces, and runtime environment (like LeetCode)"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Pre-included Headers (Auto)</span>
            </button>
          </div>

          {isFullScreen && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              <Maximize2 className="w-3 h-3" />
              Full Screen Mode Active (Press Esc to exit)
            </span>
          )}
        </div>

        {/* Right: Actions (Theme, Format, Snippets, Run, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Quick Snippets Button */}
          <button
            onClick={onOpenSnippets}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Browse & Insert C++ DSA Templates & Snippets"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            <span className="hidden md:inline">DSA Snippets</span>
          </button>

          {/* Format Code */}
          <button
            onClick={handleFormat}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Format C++ Code (Ctrl + Shift + F)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden md:inline">Format</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-colors border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded-lg transition-colors border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Download .cpp file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Reset Starter */}
          <button
            onClick={onResetCode}
            className={`p-1.5 rounded-lg transition-colors border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Reset Starter Code"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </button>

          {/* Settings / Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className={`p-1.5 rounded-lg transition-colors border shadow-sm ${
                showSettingsDropdown
                  ? 'bg-blue-600 text-white border-blue-500'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Editor Settings & Themes"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl z-50 p-4 space-y-4 text-xs text-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-400" />
                    Editor Customization
                  </span>
                  <button
                    onClick={() => setShowSettingsDropdown(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Theme selection */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Color Theme (20-30% Brighter):
                  </label>
                  <div className="space-y-1">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onChangeSettings({ theme: t.id });
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                          settings.theme === t.id
                            ? 'bg-blue-600 text-white font-bold shadow'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900/60 font-mono text-cyan-300">
                          {t.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-300 font-medium">Font Size</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onChangeSettings({ fontSize: Math.max(12, settings.fontSize - 1) })
                      }
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-white w-6 text-center">
                      {settings.fontSize}
                    </span>
                    <button
                      onClick={() =>
                        onChangeSettings({ fontSize: Math.min(26, settings.fontSize + 1) })
                      }
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Tab Size */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Tab Size</span>
                  <div className="flex items-center gap-1.5">
                    {[2, 4].map((size) => (
                      <button
                        key={size}
                        onClick={() => onChangeSettings({ tabSize: size })}
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          settings.tabSize === size
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {size} spaces
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minimap toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Minimap</span>
                  <button
                    onClick={() => onChangeSettings({ minimap: !settings.minimap })}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      settings.minimap
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {settings.minimap ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* In Fullscreen mode: Quick output toggle button */}
          {isFullScreen && (
            <button
              onClick={() => setShowQuickOutputInFull(!showQuickOutputInFull)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-sm ${
                showQuickOutputInFull
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle Output Drawer in Fullscreen"
            >
              <Terminal className="w-3.5 h-3.5 text-yellow-400" />
              <span>{showQuickOutputInFull ? 'Hide Output' : 'View Output'}</span>
            </button>
          )}

          {/* ASK GEMCODE AI BUTTON */}
          {onOpenGemini && (
            <button
              onClick={onOpenGemini}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/30"
              title="Ask GemCode AI Copilot for Code Suggestions, Bug Fixes & Hints"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>Ask GemCode</span>
            </button>
          )}

          {/* PRIMARY RUN CODE BUTTON */}
          <button
            onClick={onRunCode}
            disabled={isRunning}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50"
            title="Compile & Run Code against Testcases (Ctrl + Enter)"
          >
            {isRunning ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Code</span>
              </>
            )}
          </button>

          {/* FULL SCREEN TOGGLE BUTTON - PROMINENT */}
          <button
            onClick={onToggleFullScreen}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isFullScreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 shadow-indigo-900/40'
            }`}
            title={
              isFullScreen
                ? 'Exit Full Screen (Esc or Alt + Z)'
                : 'Full Screen Code Editor (Captures whole tab area) [Alt + Z / F11]'
            }
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div ref={containerRef} className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
        <Editor
          height="100%"
          width="100%"
          language={settings.language || 'cpp'}
          value={code}
          theme={settings.theme}
          onChange={(val) => onChangeCode(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: settings.fontSize,
            tabSize: settings.tabSize,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
            fontLigatures: true,
            lineNumbers: settings.lineNumbers,
            minimap: { enabled: settings.minimap },
            wordWrap: settings.wordWrap,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderLineHighlight: 'all',
            // Selection highlighting configuration for max contrast & brightness
            selectionHighlight: true,
            occurrencesHighlight: 'singleFile',
            matchBrackets: 'always',
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 44 },
            suggest: {
              showWords: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
              showModules: true,
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
          }}
        />

        {/* Submerged / Floating Editor STL Quick Insert Bar */}
        <div className="absolute bottom-2 left-3 right-3 z-20 bg-[#0d131f]/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300 select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mr-1 shrink-0">
              Quick Insert:
            </span>
            <button
              onClick={() => handleQuickInsert('vector<int> ')}
              className="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-blue-600 hover:text-white text-slate-200 font-mono transition-colors shrink-0 border border-slate-700"
            >
              vector&lt;int&gt;
            </button>
            <button
              onClick={() => handleQuickInsert('unordered_map<int, int> ')}
              className="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-blue-600 hover:text-white text-slate-200 font-mono transition-colors shrink-0 border border-slate-700"
            >
              unordered_map
            </button>
            <button
              onClick={() => handleQuickInsert('priority_queue<int> ')}
              className="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-blue-600 hover:text-white text-slate-200 font-mono transition-colors shrink-0 border border-slate-700"
            >
              priority_queue
            </button>
            <button
              onClick={() => handleQuickInsert('sort(nums.begin(), nums.end());')}
              className="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-blue-600 hover:text-white text-slate-200 font-mono transition-colors shrink-0 border border-slate-700"
            >
              std::sort
            </button>
            <button
              onClick={() =>
                handleQuickInsert('ios_base::sync_with_stdio(false); cin.tie(NULL);')
              }
              className="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-blue-600 hover:text-white text-slate-200 font-mono transition-colors shrink-0 border border-slate-700"
            >
              fast_io
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-3 text-slate-400">
            <span>
              Lines: <strong className="text-white">{code.split('\n').length}</strong>
            </span>
            <span className="hidden sm:inline">UTF-8</span>
          </div>
        </div>

        {/* In-Fullscreen Quick Output Drawer */}
        {isFullScreen && showQuickOutputInFull && (
          <div className="absolute bottom-0 left-0 right-0 max-h-72 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-700 shadow-2xl p-4 overflow-y-auto text-xs font-mono text-slate-200 z-30 animate-in slide-in-from-bottom duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white font-sans">Execution Results</span>
                {executionResult && (
                  <span className="text-[11px] text-slate-400">
                    ({executionResult.executionTimeMs} ms, {(executionResult.memoryKb / 1024).toFixed(1)} MB)
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowQuickOutputInFull(false)}
                className="text-slate-400 hover:text-white px-2 py-0.5 bg-slate-800 rounded font-sans"
              >
                Close Drawer
              </button>
            </div>

            {executionResult ? (
              <div className="space-y-2">
                {executionResult.stderr && (
                  <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/80 text-rose-300 whitespace-pre-wrap">
                    {executionResult.stderr}
                  </div>
                )}
                {executionResult.stdout && (
                  <div className="p-2.5 rounded bg-[#050811] border border-slate-800 text-emerald-300 whitespace-pre-wrap">
                    {executionResult.stdout}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 py-4 text-center">
                Press "Run Code" above to execute your solution.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pre-included Headers & Environment Modal (LeetCode / GFG Style) */}
      {showEnvironmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f172a] border-slate-700 text-slate-100'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Pre-Included Runtime Headers &amp; Environment</h3>
                  <p className="text-xs text-slate-400">
                    Just like LeetCode &amp; GeeksforGeeks, standard headers are auto-linked behind the scenes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEnvironmentModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isLight ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-blue-950/30 border-blue-800/40 text-blue-200'
              }`}>
                💡 <strong>Why are headers hidden?</strong> In online coding platforms, you only write the algorithm solution class (<code className="font-mono font-bold">class Solution</code>). All necessary standard libraries, data structures, and namespaces are automatically included in the compilation wrapper!
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Background C++ Environment (Pre-Compiled):
                </h4>
                <div className={`p-3.5 rounded-xl font-mono text-xs overflow-x-auto border ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#060a12] border-slate-800 text-cyan-300'
                }`}>
                  <pre className="whitespace-pre">{`#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <deque>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <climits>
#include <utility>

using namespace std;

// Your Solution Class is executed directly here!`}</pre>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Supported Standard Types &amp; STL Utilities:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border font-mono ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'}`}>
                    <code>std::vector&lt;T&gt;</code>
                  </div>
                  <div className={`p-2 rounded-lg border font-mono ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'}`}>
                    <code>std::unordered_map</code>
                  </div>
                  <div className={`p-2 rounded-lg border font-mono ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'}`}>
                    <code>std::priority_queue</code>
                  </div>
                  <div className={`p-2 rounded-lg border font-mono ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'}`}>
                    <code>std::stack / queue</code>
                  </div>
                  <div className={`p-2 rounded-lg border font-mono ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'}`}>
                    <code>std::sort / reverse</code>
                  </div>
                  <div className={`p-2 rounded-lg border font-mono ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'}`}>
                    <code>std::cin / cout</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`px-5 py-3.5 border-t flex items-center justify-end ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <button
                onClick={() => setShowEnvironmentModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow"
              >
                Got It, Keep Editor Clean
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
