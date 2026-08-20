import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  BookOpen,
  Terminal,
  Maximize2,
  Minimize2,
  Keyboard,
  Zap,
  ChevronDown,
  Sparkles,
  Layers,
  Search,
  Link2,
  RotateCcw,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DSAProblem, Difficulty, ProblemList, SheetProblem } from '../types/dsa';

interface NavbarProps {
  selectedProblem: DSAProblem;
  onSelectProblem: (problem: SheetProblem | DSAProblem) => void;
  allProblems: SheetProblem[];
  lists: ProblemList[];
  activeListId: string;
  onSelectList: (listId: string) => void;
  onOpenDirectory: () => void;
  onOpenCreateList: () => void;
  onOpenImportModal: () => void;
  isProblemPaneCollapsed: boolean;
  onToggleProblemPane: () => void;
  isConsolePaneCollapsed: boolean;
  onToggleConsolePane: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onOpenShortcuts: () => void;
  onOpenCheatSheet: () => void;
  onOpenSnippets: () => void;
  onResetCode: () => void;
  onQuickLoadUrl: (urlOrSlug: string) => void;
  currentView: 'home' | 'ide';
  onToggleView: (view: 'home' | 'ide') => void;
  currentUser: User | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  onOpenGemini?: () => void;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedProblem,
  onSelectProblem,
  allProblems,
  lists,
  activeListId,
  onSelectList,
  onOpenDirectory,
  onOpenCreateList,
  onOpenImportModal,
  isProblemPaneCollapsed,
  onToggleProblemPane,
  isConsolePaneCollapsed,
  onToggleConsolePane,
  isFullScreen,
  onToggleFullScreen,
  onOpenShortcuts,
  onOpenCheatSheet,
  onOpenSnippets,
  onResetCode,
  onQuickLoadUrl,
  currentView,
  onToggleView,
  currentUser,
  onLoginGoogle,
  onLogoutGoogle,
  onOpenGemini,
  themeMode = 'dark',
  onToggleThemeMode,
}) => {
  const [showProblemDropdown, setShowProblemDropdown] = useState(false);
  const [searchProblem, setSearchProblem] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('All');
  const [quickUrlInput, setQuickUrlInput] = useState('');
  const [showQuickUrlModal, setShowQuickUrlModal] = useState(false);

  const problemDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownActiveItemRef = useRef<HTMLButtonElement>(null);
  const dropdownScrollContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        problemDropdownRef.current &&
        !problemDropdownRef.current.contains(e.target as Node)
      ) {
        setShowProblemDropdown(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProblemDropdown(false);
        setShowQuickUrlModal(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Safe active list
  const activeList = React.useMemo(() => {
    return lists.find((l) => l.id === activeListId) || lists[0] || {
      id: 'list-master-sheet',
      name: 'Master SDE Sheet',
      problemIds: [],
    };
  }, [lists, activeListId]);

  // Problems in active list
  const currentListProblems = React.useMemo(() => {
    if (!activeList || activeList.id === 'list-master-sheet') return allProblems;
    const pIds = Array.isArray(activeList.problemIds) ? activeList.problemIds : [];
    const pIdSet = new Set(pIds);
    return allProblems.filter((p) => p && pIdSet.has(p.id));
  }, [activeList, allProblems]);

  // Unique topics in current list
  const listTopics = React.useMemo(() => {
    const set = new Set<string>();
    currentListProblems.forEach((p) => {
      if (p && p.category) set.add(p.category.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [currentListProblems]);

  // Filtered dropdown problems
  const filteredProblems = React.useMemo(() => {
    const q = searchProblem.trim().toLowerCase();
    return currentListProblems.filter((p) => {
      if (!p || !p.id) return false;
      const matchesSearch =
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.topic && p.topic.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.slug && p.slug.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q));

      const matchesTopic =
        selectedTopicFilter === 'All' ||
        p.category === selectedTopicFilter ||
        (p.topic && p.topic.toLowerCase().includes(selectedTopicFilter.toLowerCase()));

      return matchesSearch && matchesTopic;
    });
  }, [currentListProblems, searchProblem, selectedTopicFilter]);

  const selectedProblemIndex = React.useMemo(() => {
    return filteredProblems.findIndex((p) => p && p.id === selectedProblem.id);
  }, [filteredProblems, selectedProblem.id]);

  // Auto-scroll dropdown to selected problem when opened
  useEffect(() => {
    if (showProblemDropdown && selectedProblemIndex >= 0) {
      const timer = setTimeout(() => {
        if (dropdownActiveItemRef.current) {
          dropdownActiveItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showProblemDropdown, selectedProblemIndex]);

  const getDifficultyBadge = (diff?: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Hard':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  const handleQuickUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickUrlInput.trim()) {
      onQuickLoadUrl(quickUrlInput.trim());
      setQuickUrlInput('');
      setShowQuickUrlModal(false);
    }
  };

  return (
    <nav
      className={`h-14 px-3 flex items-center justify-between z-30 shrink-0 select-none shadow-md transition-colors border-b ${
        themeMode === 'light'
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0a0e17] border-slate-800 text-slate-100'
      }`}
    >
      {/* Left: Brand & View Toggles & Directory */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Brand */}
        <button
          onClick={() => onToggleView('home')}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity text-left group"
          title="Go to GemCode Dashboard"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-cyan-100" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-black text-sm tracking-tight ${
                  themeMode === 'light'
                    ? 'text-slate-900 font-extrabold'
                    : 'bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent'
                }`}
              >
                GemCode
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold hidden sm:inline ${
                  themeMode === 'light'
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-300'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                }`}
              >
                DSA
              </span>
            </div>
          </div>
        </button>

        {/* View Switcher: Home / IDE */}
        <div
          className={`flex items-center p-0.5 rounded-lg text-xs font-semibold border transition-colors ${
            themeMode === 'light'
              ? 'bg-slate-100 border-slate-200'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <button
            onClick={() => onToggleView('home')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              currentView === 'home'
                ? 'bg-blue-600 text-white shadow-sm'
                : themeMode === 'light'
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Open GemCode Dashboard & Roadmaps"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
          <button
            onClick={() => onToggleView('ide')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              currentView === 'ide'
                ? 'bg-cyan-600 text-white shadow-sm'
                : themeMode === 'light'
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Open GemCode Studio Workspace"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>IDE</span>
          </button>
        </div>

        {/* Sheet & Problem Directory Modal Button */}
        <button
          onClick={onOpenDirectory}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-sm ${
            themeMode === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-[#111827] hover:bg-slate-800 text-slate-200 border-slate-700'
          }`}
          title="Open SDE Sheets Directory & Custom Lists (Ctrl + K)"
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">{activeList.name}</span>
          <span className="md:hidden">Sheets</span>
        </button>

        {/* Question Selector Quick Dropdown */}
        <div className="relative" ref={problemDropdownRef}>
          <button
            onClick={() => setShowProblemDropdown(!showProblemDropdown)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all max-w-[200px] sm:max-w-xs truncate shadow-sm ${
              themeMode === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-[#111827] hover:bg-slate-800 text-white border-slate-700'
            }`}
            title="Quick switch problem in active list"
          >
            <span className="truncate">{selectedProblem.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {showProblemDropdown && (
            <div
              className={`absolute left-0 top-10 w-80 sm:w-96 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-2 animate-in fade-in border ${
                themeMode === 'light'
                  ? 'bg-white border-slate-200 text-slate-800 shadow-xl'
                  : 'bg-[#0e1626] border-slate-700 text-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-between px-1 pb-1 border-b ${
                  themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <div
                  className={`font-bold text-xs flex items-center gap-1.5 ${
                    themeMode === 'light' ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                  <span>
                    {activeList.name} ({currentListProblems.length} Qs)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowProblemDropdown(false);
                    onOpenDirectory();
                  }}
                  className="text-[11px] text-cyan-600 hover:underline font-semibold"
                >
                  Full Directory →
                </button>
              </div>

              {/* Search & Topic filter in dropdown */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchProblem}
                    onChange={(e) => setSearchProblem(e.target.value)}
                    placeholder="Filter questions..."
                    className={`w-full pl-7 pr-2 py-1.5 rounded-lg text-xs border focus:outline-none focus:border-cyan-500 ${
                      themeMode === 'light'
                        ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    }`}
                    autoFocus
                  />
                </div>
                <select
                  value={selectedTopicFilter}
                  onChange={(e) => setSelectedTopicFilter(e.target.value)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] border focus:outline-none max-w-[110px] truncate ${
                    themeMode === 'light'
                      ? 'bg-slate-50 border-slate-300 text-slate-700 focus:border-cyan-500'
                      : 'bg-slate-900 border-slate-700 text-slate-300 focus:border-cyan-500'
                  }`}
                >
                  {listTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Problem List */}
              <div
                ref={dropdownScrollContainerRef}
                className={`max-h-64 overflow-y-auto space-y-1 divide-y ${
                  themeMode === 'light' ? 'divide-slate-100' : 'divide-slate-800/40'
                }`}
              >
                {filteredProblems.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 space-y-2">
                    <p className="text-xs">No questions match your search.</p>
                    <button
                      onClick={() => {
                        setSearchProblem('');
                        setSelectedTopicFilter('All');
                      }}
                      className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded text-xs"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  filteredProblems.slice(0, Math.max(60, selectedProblemIndex + 30)).map((p, idx) => {
                    const isSelected = selectedProblem.id === p.id;
                    return (
                      <button
                        key={p.id}
                        ref={isSelected ? dropdownActiveItemRef : undefined}
                        onClick={() => {
                          onSelectProblem(p);
                          setShowProblemDropdown(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                          isSelected
                            ? themeMode === 'light'
                              ? 'bg-blue-50 border border-blue-400 text-blue-900 font-semibold'
                              : 'bg-blue-900/30 border border-cyan-400/50 text-white ring-1 ring-cyan-500/20'
                            : themeMode === 'light'
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate mr-2 min-w-0 flex-1">
                          <span
                            className={`font-mono text-[10px] font-bold px-1 py-0.5 rounded border shrink-0 ${
                              themeMode === 'light'
                                ? 'bg-slate-100 border-slate-200 text-slate-600'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div className="truncate min-w-0 flex-1">
                            <span className="font-medium truncate block">{p.title}</span>
                            <span
                              className={`text-[10px] font-mono ${
                                themeMode === 'light' ? 'text-slate-500' : 'text-slate-500'
                              }`}
                            >
                              {p.topic}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                themeMode === 'light'
                                  ? 'text-blue-700 bg-blue-100 border-blue-300'
                                  : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                              }`}
                            >
                              Active
                            </span>
                          )}
                          {p.difficulty && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border font-semibold shrink-0 ${getDifficultyBadge(
                                p.difficulty
                              )}`}
                            >
                              {p.difficulty}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick LeetCode URL Import */}
        <button
          onClick={() => setShowQuickUrlModal(true)}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
            themeMode === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-[#111827] hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Paste any LeetCode URL to load directly into the IDE"
        >
          <Link2 className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick URL</span>
        </button>
      </div>

      {/* Right: Gemini AI, Pane Toggles, Cheatsheet, Shortcuts, Google Auth & Fullscreen */}
      <div className="flex items-center gap-2">
        {/* Ask GemCode AI Header Action */}
        {onOpenGemini && (
          <button
            onClick={onOpenGemini}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              themeMode === 'light'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/10'
                : 'bg-gradient-to-r from-emerald-950/80 via-cyan-950/80 to-blue-950/80 hover:from-emerald-900 hover:to-cyan-900 text-cyan-300 border border-cyan-700/60'
            }`}
            title="Ask GemCode AI for Code Suggestions & Debugging"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>GemCode AI</span>
          </button>
        )}

        {/* Pane Collapse Toggles */}
        <div
          className={`hidden lg:flex items-center gap-1 p-1 rounded-lg border transition-colors ${
            themeMode === 'light'
              ? 'bg-slate-100 border-slate-200'
              : 'bg-[#111827] border-slate-800'
          }`}
        >
          <button
            onClick={onToggleProblemPane}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              !isProblemPaneCollapsed
                ? themeMode === 'light'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'bg-slate-800 text-white shadow'
                : themeMode === 'light'
                ? 'text-slate-500 hover:text-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Problem Statement Panel (Alt + P)"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Problem</span>
          </button>
          <button
            onClick={onToggleConsolePane}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              !isConsolePaneCollapsed
                ? themeMode === 'light'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'bg-slate-800 text-white shadow'
                : themeMode === 'light'
                ? 'text-slate-500 hover:text-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Console Panel (Alt + C)"
          >
            <Terminal className="w-3.5 h-3.5 text-yellow-500" />
            <span>Console</span>
          </button>
        </div>

        {/* Big-O Complexity Cheat Sheet */}
        <button
          onClick={onOpenCheatSheet}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
            themeMode === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-[#111827] hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Big-O Complexity Cheat Sheet"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-500" />
          <span>Big-O</span>
        </button>

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className={`p-1.5 rounded-lg border transition-colors shadow-sm ${
            themeMode === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-[#111827] hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4 text-purple-400" />
        </button>

        {/* DARK / LIGHT THEME TOGGLE BUTTON */}
        {onToggleThemeMode && (
          <button
            onClick={onToggleThemeMode}
            className={`p-1.5 rounded-lg border transition-all shadow-sm flex items-center justify-center ${
              themeMode === 'light'
                ? 'bg-amber-100/80 hover:bg-amber-200 text-amber-800 border-amber-300'
                : 'bg-[#111827] hover:bg-slate-800 text-yellow-300 border-slate-700'
            }`}
            title={
              themeMode === 'light'
                ? 'Switch to Dark Mode'
                : 'Switch to Light Mode'
            }
          >
            {themeMode === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Google Authentication */}
        {currentUser ? (
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
              themeMode === 'light'
                ? 'bg-slate-100 border-slate-300'
                : 'bg-slate-900 border-slate-700'
            }`}
          >
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-5 h-5 rounded-full ring-1 ring-emerald-500 shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {currentUser.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <span
              className={`text-xs font-medium hidden xl:inline max-w-[80px] truncate ${
                themeMode === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}
            >
              {currentUser.displayName || currentUser.email}
            </span>
            <button
              onClick={onLogoutGoogle}
              className="text-slate-400 hover:text-rose-400 transition-colors p-0.5"
              title="Sign out"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginGoogle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold transition-all shadow-sm border border-slate-200"
            title="Sign in with Google to sync progress to cloud"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="hidden sm:inline">Google Login</span>
            <span className="sm:hidden">Login</span>
          </button>
        )}

        {/* FULL SCREEN TOGGLE BUTTON */}
        <button
          onClick={onToggleFullScreen}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
            isFullScreen
              ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 shadow-indigo-900/30'
          }`}
          title="Full Screen Mode [Alt + Z]"
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

      {/* Quick URL Modal */}
      {showQuickUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1626] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Load LeetCode Problem by URL</h3>
              </div>
              <button
                onClick={() => setShowQuickUrlModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickUrlSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Paste LeetCode Problem URL or Slug
                </label>
                <input
                  type="text"
                  value={quickUrlInput}
                  onChange={(e) => setQuickUrlInput(e.target.value)}
                  placeholder="https://leetcode.com/problems/trapping-rain-water/ or 'trapping-rain-water'"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickUrlModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow"
                >
                  Load into Studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};
