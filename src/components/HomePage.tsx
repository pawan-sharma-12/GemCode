import React, { useState, useMemo } from 'react';
import {
  Code2,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  Star,
  RotateCcw,
  Zap,
  Play,
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  Flame,
  Brain,
  FolderPlus,
  Terminal,
  Clock,
  ShieldCheck,
  ChevronRight,
  Check,
  User as UserIcon,
  LogIn,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DSAProblem, Difficulty, ProblemList, SheetProblem, UserProblemState } from '../types/dsa';

interface HomePageProps {
  allProblems: SheetProblem[];
  lists: ProblemList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  activeProblem: DSAProblem;
  onSelectProblem: (p: SheetProblem | DSAProblem) => void;
  onOpenIDE: () => void;
  userProblemStates: Record<string, UserProblemState>;
  onToggleSolved: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleRevision: (id: string) => void;
  onOpenDirectory: () => void;
  onOpenCreateList: () => void;
  onOpenImportModal: () => void;
  onOpenCheatSheet: () => void;
  currentUser: User | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  onAskGeminiPrompt?: (promptText: string) => void;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  allProblems,
  lists,
  activeListId,
  onSelectList,
  activeProblem,
  onSelectProblem,
  onOpenIDE,
  userProblemStates,
  onToggleSolved,
  onToggleStar,
  onToggleRevision,
  onOpenDirectory,
  onOpenCreateList,
  onOpenImportModal,
  onOpenCheatSheet,
  currentUser,
  onLoginGoogle,
  onLogoutGoogle,
  onAskGeminiPrompt,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [geminiInput, setGeminiInput] = useState('');

  // Statistics calculation
  const totalCount = allProblems.length;
  const solvedCount = useMemo(() => {
    return Object.values(userProblemStates).filter((s) => s?.isSolved).length;
  }, [userProblemStates]);

  const starredCount = useMemo(() => {
    return Object.values(userProblemStates).filter((s) => s?.isStarred).length;
  }, [userProblemStates]);

  const revisionCount = useMemo(() => {
    return Object.values(userProblemStates).filter((s) => s?.isRevision).length;
  }, [userProblemStates]);

  const solvedPercentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // Topic Categories
  const topicStats = useMemo(() => {
    const map = new Map<string, { total: number; solved: number }>();
    allProblems.forEach((p) => {
      const category = p.category || p.topic || 'General';
      const existing = map.get(category) || { total: 0, solved: 0 };
      existing.total += 1;
      if (userProblemStates[p.id]?.isSolved) {
        existing.solved += 1;
      }
      map.set(category, existing);
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      solved: data.solved,
      percentage: Math.round((data.solved / data.total) * 100) || 0,
    }));
  }, [allProblems, userProblemStates]);

  // Filtered problems list on the home page table
  const filteredProblems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allProblems.filter((p) => {
      if (!p || !p.id) return false;
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.topic && p.topic.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.slug && p.slug.toLowerCase().includes(q));

      const matchesTopic =
        selectedTopic === 'All' ||
        p.category === selectedTopic ||
        p.topic === selectedTopic;

      const matchesDiff =
        selectedDifficulty === 'All' ||
        (p.difficulty && p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());

      return matchesSearch && matchesTopic && matchesDiff;
    });
  }, [allProblems, searchQuery, selectedTopic, selectedDifficulty]);

  const handleLaunchProblem = (p: SheetProblem | DSAProblem) => {
    onSelectProblem(p);
    onOpenIDE();
  };

  const handleAskGeminiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiInput.trim()) return;
    if (onAskGeminiPrompt) {
      onAskGeminiPrompt(geminiInput.trim());
    }
    onOpenIDE();
  };

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

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white overflow-y-auto transition-colors ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#070b13] text-slate-100'
      }`}
    >
      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Hero Section */}
        <div
          className={`relative rounded-3xl p-6 sm:p-10 overflow-hidden shadow-2xl transition-colors border ${
            isLight
              ? 'bg-gradient-to-br from-white via-cyan-50/40 to-blue-50/50 border-slate-200 shadow-slate-200'
              : 'bg-gradient-to-br from-[#0e172a] via-[#091122] to-[#060a14] border-slate-800'
          }`}
        >
          {/* Subtle glow background */}
          <div
            className={`absolute -right-20 -top-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
              isLight ? 'bg-cyan-400/15' : 'bg-cyan-500/10'
            }`}
          />
          <div
            className={`absolute -left-20 -bottom-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
              isLight ? 'bg-blue-400/15' : 'bg-blue-600/10'
            }`}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Headings & Continue Button */}
            <div className="lg:col-span-7 space-y-5">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Powered by GemCode AI Copilot & Algorithmic Pattern Intelligence</span>
              </div>

              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Master Algorithms & Data Structures with{' '}
                <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  GemCode
                </span>
              </h1>

              <p
                className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                  isLight ? 'text-slate-600 font-normal' : 'text-slate-400'
                }`}
              >
                Practice curated algorithmic problems across Striver SDE, NeetCode 150, Blind 75, and top interview sheets.
                Code in C++, Python, Java or JS, analyze Big-O complexity, test with custom edge cases, and get real-time algorithmic mentorship from GemCode AI.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleLaunchProblem(activeProblem)}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all shadow-xl shadow-cyan-500/25 hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume: {activeProblem.title}</span>
                </button>

                <button
                  onClick={onOpenDirectory}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all border ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Explore Problems</span>
                </button>
              </div>

              {/* GemCode AI Quick Bar */}
              <form onSubmit={handleAskGeminiSubmit} className="pt-2">
                <div className="relative max-w-xl">
                  <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={geminiInput}
                    onChange={(e) => setGeminiInput(e.target.value)}
                    placeholder="Ask GemCode AI: 'Explain DP state transitions', 'Two Pointers vs Sliding Window', 'Dry run Kadane'..."
                    className={`w-full pl-10 pr-28 py-2.5 rounded-xl text-xs sm:text-sm transition-all border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-sm'
                        : 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                    }`}
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                  >
                    <span>Ask GemCode</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Col: Stats Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
              {/* Solved Card */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-2 shadow-lg transition-colors ${
                  isLight
                    ? 'bg-white border-emerald-200/80 shadow-emerald-900/5'
                    : 'bg-gradient-to-br from-[#101b30] to-[#0c1322] border-cyan-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Total Solved
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isLight
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-700'
                        : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {solvedCount}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ {totalCount}</span>
                </div>
                <div
                  className={`w-full rounded-full h-1.5 overflow-hidden ${
                    isLight ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${solvedPercentage}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] font-semibold block ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  {solvedPercentage}% master sheet solved
                </span>
              </div>

              {/* Starred Questions */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-2 shadow-lg transition-colors ${
                  isLight
                    ? 'bg-white border-amber-200/80 shadow-amber-900/5'
                    : 'bg-gradient-to-br from-[#101b30] to-[#0c1322] border-amber-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Bookmarked
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isLight
                        ? 'bg-amber-100 border border-amber-300 text-amber-700'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {starredCount}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">questions</span>
                </div>
                <p className={`text-[11px] leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  High-priority interview questions saved for review
                </p>
              </div>

              {/* Revision Queue */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-2 shadow-lg transition-colors ${
                  isLight
                    ? 'bg-white border-purple-200/80 shadow-purple-900/5'
                    : 'bg-gradient-to-br from-[#101b30] to-[#0c1322] border-purple-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Revision Queue
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isLight
                        ? 'bg-purple-100 border border-purple-300 text-purple-700'
                        : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {revisionCount}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">to revise</span>
                </div>
                <p className={`text-[11px] leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Spaced repetition queue before technical rounds
                </p>
              </div>

              {/* Cloud Sync / Profile Status */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-2 shadow-lg transition-colors ${
                  isLight
                    ? 'bg-white border-blue-200/80 shadow-blue-900/5'
                    : 'bg-gradient-to-br from-[#101b30] to-[#0c1322] border-blue-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Cloud Sync
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isLight
                        ? 'bg-blue-100 border border-blue-300 text-blue-700'
                        : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className={`font-mono text-sm font-bold truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {currentUser ? 'Active & Synced' : 'Local Storage'}
                </div>
                <p className={`text-[11px] leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {currentUser ? 'Saved to Google account' : 'Sign in to sync across devices'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Curated SDE Sheets Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Curated SDE Sheets & Roadmaps
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCreateList}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-cyan-700 border-slate-300 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Custom List</span>
              </button>
              <button
                onClick={onOpenImportModal}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <span>Import CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => {
              const pCount =
                list.id === 'list-master-sheet' ? allProblems.length : (list.problemIds || []).length;
              const isActive = activeListId === list.id;

              return (
                <div
                  key={list.id}
                  onClick={() => {
                    onSelectList(list.id);
                    onOpenDirectory();
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    isActive
                      ? isLight
                        ? 'bg-blue-50/70 border-blue-400/80 shadow-md shadow-blue-500/10'
                        : 'bg-gradient-to-br from-[#101e38] to-[#0b1424] border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:border-slate-300'
                      : 'bg-[#0a101d] hover:bg-[#0e1628] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                        {list.isBuiltIn ? 'Curated Sheet' : 'Custom Collection'}
                      </span>
                      <h3
                        className={`font-bold text-base transition-colors ${
                          isLight
                            ? 'text-slate-900 group-hover:text-blue-600'
                            : 'text-white group-hover:text-cyan-300'
                        }`}
                      >
                        {list.name}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 border ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {pCount} Qs
                    </span>
                  </div>

                  <p className={`text-xs line-clamp-2 mb-4 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {list.description || 'Comprehensive data structures & algorithms challenge questions.'}
                  </p>

                  <div
                    className={`flex items-center justify-between pt-3 border-t text-xs font-semibold ${
                      isLight ? 'border-slate-200 text-cyan-700' : 'border-slate-800/80 text-cyan-400'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span>Explore Sheet</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    {isActive && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          isLight
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                        }`}
                      >
                        Active In IDE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Topic Breakdown Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Topic-Wise Roadmaps
              </h2>
            </div>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {topicStats.length} Core DSA Patterns
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {topicStats.slice(0, 18).map((topic) => (
              <button
                key={topic.name}
                onClick={() => {
                  setSelectedTopic(topic.name);
                  // Scroll to problem table
                  const tableElem = document.getElementById('problem-explorer-section');
                  if (tableElem) {
                    tableElem.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`p-3.5 rounded-xl text-left transition-all group space-y-1.5 border ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-500 shadow-sm'
                    : 'bg-[#0a101d] hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold text-xs truncate ${
                      isLight
                        ? 'text-slate-800 group-hover:text-cyan-700'
                        : 'text-slate-200 group-hover:text-cyan-300'
                    }`}
                  >
                    {topic.name}
                  </span>
                </div>
                <div
                  className={`flex items-baseline justify-between text-[11px] font-mono ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <span>
                    {topic.solved}/{topic.total}
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{topic.percentage}%</span>
                </div>
                <div
                  className={`w-full rounded-full h-1 overflow-hidden ${
                    isLight ? 'bg-slate-200' : 'bg-slate-800/80'
                  }`}
                >
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Interactive Problem Explorer Table */}
        <section id="problem-explorer-section" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2
                className={`text-xl font-bold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>All Problems Explorer</span>
                <span
                  className={`text-xs font-mono font-normal ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  ({filteredProblems.length} available)
                </span>
              </h2>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problem, pattern or slug..."
                  className={`pl-8 pr-3 py-1.5 rounded-lg text-xs w-48 sm:w-64 border focus:outline-none focus:border-cyan-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Topic Filter */}
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none focus:border-cyan-500 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                <option value="All">All Topics</option>
                {topicStats.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.total})
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none focus:border-cyan-500 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              {(searchQuery || selectedTopic !== 'All' || selectedDifficulty !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTopic('All');
                    setSelectedDifficulty('All');
                  }}
                  className="px-2 py-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xl ${
              isLight ? 'bg-white border-slate-200 shadow-slate-200' : 'bg-[#090f1c] border-slate-800'
            }`}
          >
            <div
              className={`max-h-[600px] overflow-y-auto divide-y ${
                isLight ? 'divide-slate-200' : 'divide-slate-800/60'
              }`}
            >
              {filteredProblems.slice(0, 100).map((prob, idx) => {
                const state = userProblemStates[prob.id] || {
                  isSolved: false,
                  isStarred: false,
                  isRevision: false,
                };
                const isCurrent = activeProblem.id === prob.id;

                return (
                  <div
                    key={prob.id}
                    className={`p-3 sm:px-5 flex items-center justify-between gap-4 transition-colors ${
                      isCurrent
                        ? isLight
                          ? 'bg-blue-50/80 border-l-4 border-cyan-500'
                          : 'bg-blue-950/20 border-l-4 border-cyan-400'
                        : isLight
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Status Checkbox & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleSolved(prob.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 border ${
                          state.isSolved
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : isLight
                            ? 'border-slate-300 bg-white hover:border-slate-400 text-transparent'
                            : 'border-slate-700 bg-slate-900 hover:border-slate-500 text-transparent'
                        }`}
                        title={state.isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <span
                        className={`font-mono text-xs w-8 shrink-0 ${
                          isLight ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        #{idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLaunchProblem(prob)}
                            className={`font-semibold text-xs sm:text-sm transition-colors truncate text-left ${
                              isLight
                                ? 'text-slate-800 hover:text-cyan-700'
                                : 'text-slate-200 hover:text-cyan-400'
                            }`}
                          >
                            {prob.title}
                          </button>
                          {prob.leetcodeUrl && (
                            <a
                              href={prob.leetcodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
                              title="Open on LeetCode"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-mono ${
                            isLight ? 'text-slate-500' : 'text-slate-500'
                          }`}
                        >
                          {prob.topic || prob.category || 'General DSA'}
                        </span>
                      </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {prob.difficulty && (
                        <span
                          className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getDifficultyBadge(
                            prob.difficulty
                          )}`}
                        >
                          {prob.difficulty}
                        </span>
                      )}

                      {/* Star Bookmark */}
                      <button
                        onClick={() => onToggleStar(prob.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          state.isStarred
                            ? 'text-amber-500 bg-amber-500/10'
                            : isLight
                            ? 'text-slate-400 hover:text-slate-600'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={state.isStarred ? 'Starred' : 'Star this question'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${state.isStarred ? 'fill-amber-500' : ''}`}
                        />
                      </button>

                      {/* Solve CTA */}
                      <button
                        onClick={() => handleLaunchProblem(prob)}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Solve</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer summary */}
            <div
              className={`p-3 border-t flex items-center justify-between text-xs ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-[#080d18] border-slate-800 text-slate-400'
              }`}
            >
              <span>
                Showing first {Math.min(100, filteredProblems.length)} of {filteredProblems.length} questions
              </span>
              <button
                onClick={onOpenDirectory}
                className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
              >
                Open Full Directory Modal →
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
