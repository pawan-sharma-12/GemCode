import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Circle,
  Star,
  RotateCcw,
  ExternalLink,
  FolderPlus,
  Download,
  Code2,
  Trash2,
  Layers,
  Bookmark,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { ProblemList, SheetProblem, UserProblemState, Difficulty } from '../types/dsa';

interface ProblemDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProblems?: SheetProblem[];
  activeProblemId?: string;
  onSelectProblem: (problem: SheetProblem) => void;
  lists?: ProblemList[];
  activeListId?: string;
  onSelectList: (listId: string) => void;
  onCreateListClick: () => void;
  onImportListClick: () => void;
  onDeleteCustomList: (listId: string) => void;
  userProblemStates?: Record<string, UserProblemState>;
  onToggleSolved: (problemId: string) => void;
  onToggleStar: (problemId: string) => void;
  onToggleRevision: (problemId: string) => void;
  onToggleProblemInList: (listId: string, problemId: string) => void;
}

const INITIAL_RENDER_COUNT = 80;
const LOAD_MORE_STEP = 80;

export const ProblemDirectoryModal: React.FC<ProblemDirectoryModalProps> = ({
  isOpen,
  onClose,
  allProblems = [],
  activeProblemId = '',
  onSelectProblem,
  lists = [],
  activeListId = 'list-master-sheet',
  onSelectList,
  onCreateListClick,
  onImportListClick,
  onDeleteCustomList,
  userProblemStates = {},
  onToggleSolved,
  onToggleStar,
  onToggleRevision,
  onToggleProblemInList,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Unsolved' | 'Starred' | 'Revision'>('All');
  const [openAddToListMenuId, setOpenAddToListMenuId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count when any filter changes
  useEffect(() => {
    setVisibleCount(INITIAL_RENDER_COUNT);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, selectedTopic, selectedDifficulty, statusFilter, activeListId]);

  // Close list add menu on click outside / esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openAddToListMenuId) {
          setOpenAddToListMenuId(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openAddToListMenuId, onClose]);

  // Safe active list resolution
  const safeLists = useMemo(() => {
    return Array.isArray(lists) ? lists.filter((l): l is ProblemList => Boolean(l && l.id && l.name)) : [];
  }, [lists]);

  const currentList = useMemo(() => {
    const found = safeLists.find((l) => l.id === activeListId);
    if (found) return found;
    if (safeLists.length > 0) return safeLists[0];
    return {
      id: 'list-master-sheet',
      name: 'Master SDE Sheet',
      description: 'Master SDE Sheet Questions',
      isBuiltIn: true,
      problemIds: [],
    };
  }, [safeLists, activeListId]);

  // Safe problems in current list
  const currentListProblems = useMemo(() => {
    const safeAll = Array.isArray(allProblems) ? allProblems.filter((p): p is SheetProblem => Boolean(p && p.id && p.title)) : [];
    if (!currentList || currentList.id === 'list-master-sheet') return safeAll;
    const pIds = Array.isArray(currentList.problemIds) ? currentList.problemIds : [];
    const pIdSet = new Set(pIds);
    return safeAll.filter((p) => pIdSet.has(p.id));
  }, [currentList, allProblems]);

  // Extract unique topics
  const uniqueTopics = useMemo(() => {
    const set = new Set<string>();
    currentListProblems.forEach((p) => {
      if (p && typeof p.category === 'string' && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [currentListProblems]);

  // Filtered problems with defensive null-checks
  const filteredProblems = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const states = userProblemStates || {};
    const topicFilter = (selectedTopic || 'All').toLowerCase();

    return currentListProblems.filter((p) => {
      if (!p || !p.id) return false;

      const state = states[p.id] || {
        isSolved: typeof p.sheetStatus === 'string' && p.sheetStatus.toLowerCase() === 'solved',
        isStarred: false,
        isRevision: false,
      };

      // Search match
      const pTitle = typeof p.title === 'string' ? p.title.toLowerCase() : '';
      const pTopic = typeof p.topic === 'string' ? p.topic.toLowerCase() : '';
      const pCategory = typeof p.category === 'string' ? p.category.toLowerCase() : '';
      const pNotes = typeof p.notes === 'string' ? p.notes.toLowerCase() : '';
      const pSlug = typeof p.slug === 'string' ? p.slug.toLowerCase() : '';
      const pId = typeof p.id === 'string' ? p.id.toLowerCase() : '';

      const matchesSearch =
        !q ||
        pTitle.includes(q) ||
        pTopic.includes(q) ||
        pCategory.includes(q) ||
        pNotes.includes(q) ||
        pSlug.includes(q) ||
        pId.includes(q);

      // Topic match
      let matchesTopic = true;
      if (selectedTopic !== 'All') {
        matchesTopic =
          (p.category && p.category === selectedTopic) ||
          (p.topic && p.topic.toLowerCase().includes(topicFilter)) ||
          false;
      }

      // Difficulty match
      const matchesDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;

      // Status match
      let matchesStatus = true;
      if (statusFilter === 'Solved') matchesStatus = !!state.isSolved;
      else if (statusFilter === 'Unsolved') matchesStatus = !state.isSolved;
      else if (statusFilter === 'Starred') matchesStatus = !!state.isStarred;
      else if (statusFilter === 'Revision') matchesStatus = !!state.isRevision;

      return matchesSearch && matchesTopic && matchesDiff && matchesStatus;
    });
  }, [
    currentListProblems,
    searchQuery,
    selectedTopic,
    selectedDifficulty,
    statusFilter,
    userProblemStates,
  ]);

  // Infinite scroll trigger via IntersectionObserver (highly reliable for any scrolling speed/direction)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setVisibleCount((prev) => {
            if (prev < filteredProblems.length) {
              return Math.min(filteredProblems.length, prev + LOAD_MORE_STEP);
            }
            return prev;
          });
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '450px',
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, filteredProblems.length]);

  // Infinite scroll fallback trigger: load more automatically when scrolling near bottom
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollTop + clientHeight >= scrollHeight - 600) {
        setVisibleCount((prev) => {
          if (prev < filteredProblems.length) {
            return Math.min(filteredProblems.length, prev + LOAD_MORE_STEP);
          }
          return prev;
        });
      }
    },
    [filteredProblems.length]
  );

  // Find index of current active problem in filtered problems
  const activeProblemIndex = useMemo(() => {
    if (!activeProblemId) return -1;
    return filteredProblems.findIndex((p) => p && p.id === activeProblemId);
  }, [filteredProblems, activeProblemId]);

  // Jump/scroll to active problem
  const scrollToActiveProblem = useCallback(() => {
    if (activeProblemIndex >= 0) {
      setVisibleCount((prev) => Math.max(prev, activeProblemIndex + 40));
      setTimeout(() => {
        if (activeItemRef.current) {
          activeItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 100);
    }
  }, [activeProblemIndex]);

  // When modal is opened, automatically expand visible count to include the active problem and scroll to it
  useEffect(() => {
    if (isOpen && activeProblemIndex >= 0) {
      setVisibleCount((prev) => Math.max(prev, activeProblemIndex + 40));
      const timer = setTimeout(() => {
        if (activeItemRef.current) {
          activeItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeProblemIndex]);

  // Slice visible problems for smooth infinite rendering
  const visibleProblems = useMemo(() => {
    return filteredProblems.slice(0, visibleCount);
  }, [filteredProblems, visibleCount]);

  // Solved count
  const solvedCountInCurrentList = useMemo(() => {
    const states = userProblemStates || {};
    return currentListProblems.filter((p) => {
      if (!p || !p.id) return false;
      const state = states[p.id];
      return state ? !!state.isSolved : typeof p.sheetStatus === 'string' && p.sheetStatus.toLowerCase() === 'solved';
    }).length;
  }, [currentListProblems, userProblemStates]);

  const totalCount = currentListProblems.length;
  const progressPercent = totalCount > 0
    ? Math.round((solvedCountInCurrentList / totalCount) * 100)
    : 0;

  const getDifficultyBadge = (diff?: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'Hard':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0b101c] border border-slate-700 rounded-2xl w-full max-w-6xl h-[92vh] shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#080c16] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  DSA Problem Explorer & Curated Sheets
                </h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-blue-500/20 text-cyan-300 rounded border border-blue-500/30">
                  {allProblems.length} Problems
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Master curated SDE Sheet questions, company packs, and custom lists with auto-scroll & instant runner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateListClick}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Create a new custom list"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ New List</span>
            </button>
            <button
              onClick={onImportListClick}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Import Google Sheet or LeetCode URLs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Left Sidebar (Lists) + Right Main (Problems Table) */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Sidebar: Problem Lists */}
          <div className="w-64 md:w-72 bg-[#090e18] border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto p-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Problem Collections
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{safeLists.length} lists</span>
            </div>

            <div className="space-y-1">
              {safeLists.map((list) => {
                if (!list || !list.id) return null;
                const isActive = list.id === activeListId;
                const pCount =
                  list.id === 'list-master-sheet'
                    ? allProblems.length
                    : Array.isArray(list.problemIds)
                    ? list.problemIds.length
                    : 0;

                const isDeleting = deletingListId === list.id;

                return (
                  <div
                    key={list.id}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-blue-600/15 border border-blue-500/40 text-white shadow-sm'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                    onClick={() => onSelectList(list.id)}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: list.color || '#3B82F6' }}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-xs truncate block">{list.name || 'Untitled List'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {pCount} problems
                        </span>
                      </div>
                    </div>

                    {!list.isBuiltIn && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isDeleting ? (
                          <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-rose-500/50">
                            <span className="text-[10px] text-rose-300">Del?</span>
                            <button
                              onClick={() => {
                                onDeleteCustomList(list.id);
                                setDeletingListId(null);
                              }}
                              className="text-rose-400 hover:text-rose-300 text-xs font-bold px-1"
                              title="Confirm delete"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setDeletingListId(null)}
                              className="text-slate-400 hover:text-slate-200 text-xs px-1"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingListId(list.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity rounded"
                            title="Delete custom list"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Area: Filters + Infinite Scroll Table */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0b101c] overflow-hidden">
            {/* List Header & Progress */}
            <div className="p-4 border-b border-slate-800 bg-[#0c1220] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{currentList?.name || 'Problem List'}</span>
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">
                    ({filteredProblems.length} questions {filteredProblems.length !== currentListProblems.length ? `filtered from ${currentListProblems.length}` : ''})
                  </span>
                </div>
                {currentList?.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{currentList.description}</p>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    {solvedCountInCurrentList} / {currentListProblems.length} Solved
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{progressPercent}% complete</div>
                </div>
                <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="p-3 border-b border-slate-800/80 bg-[#0a0f1b] flex flex-wrap items-center gap-2 shrink-0">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search problem title, topic, notes, or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category / Topic Dropdown */}
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 max-w-[150px] truncate"
              >
                {uniqueTopics.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? 'All Topics' : t}
                  </option>
                ))}
              </select>

              {/* Difficulty Dropdown */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              {/* Status Pill Filters */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                {(['All', 'Solved', 'Unsolved', 'Starred', 'Revision'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded transition-colors ${
                      statusFilter === st
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Jump to Active Problem Button */}
              {activeProblemIndex >= 0 && (
                <button
                  type="button"
                  onClick={scrollToActiveProblem}
                  className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 text-cyan-300 border border-blue-800/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                  title="Jump directly to the currently active problem in editor"
                >
                  <span>📍 Active: #{activeProblemIndex + 1}</span>
                </button>
              )}

              {(searchQuery || selectedTopic !== 'All' || selectedDifficulty !== 'All' || statusFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTopic('All');
                    setSelectedDifficulty('All');
                    setStatusFilter('All');
                  }}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Problem Table List with Infinite Auto-Scroll */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto divide-y divide-slate-800/60 font-sans"
            >
              {filteredProblems.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <p className="text-sm font-semibold">No problems match your current filters.</p>
                  <p className="text-xs">Try clearing search terms or selecting another category.</p>
                </div>
              ) : (
                <>
                  {visibleProblems.map((prob, index) => {
                    if (!prob || !prob.id) return null;

                    const state = (userProblemStates && userProblemStates[prob.id]) || {
                      isSolved: typeof prob.sheetStatus === 'string' && prob.sheetStatus.toLowerCase() === 'solved',
                      isStarred: false,
                      isRevision: false,
                    };
                    const isCurrentActive = activeProblemId === prob.id;

                    return (
                      <div
                        key={prob.id}
                        ref={isCurrentActive ? activeItemRef : undefined}
                        onClick={() => {
                          onSelectProblem(prob);
                          onClose();
                        }}
                        className={`p-3 sm:px-4 flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                          isCurrentActive
                            ? 'bg-blue-900/30 border-l-4 border-cyan-400 ring-1 ring-cyan-500/20'
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Left: Row Numbering, Checkbox, Star, Revision, Title & Meta */}
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          {/* Prominent Row Numbering */}
                          <div className="w-9 shrink-0 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-400 font-mono text-[11px] font-bold border border-slate-800 group-hover:border-blue-500/40 group-hover:text-cyan-300 transition-colors">
                              #{index + 1}
                            </span>
                          </div>

                          {/* Status Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSolved(prob.id);
                            }}
                            className="shrink-0 p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                            title={state.isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                          >
                            {state.isSolved ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          {/* Star */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStar(prob.id);
                            }}
                            className={`shrink-0 p-1 transition-colors ${
                              state.isStarred
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600 hover:text-amber-400'
                            }`}
                            title="Star as Favorite"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>

                          {/* Revision */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleRevision(prob.id);
                            }}
                            className={`shrink-0 p-1 transition-colors ${
                              state.isRevision
                                ? 'text-purple-400'
                                : 'text-slate-600 hover:text-purple-400'
                            }`}
                            title="Mark for Revision"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Title & Topic info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-semibold group-hover:text-blue-300 transition-colors truncate ${
                                  state.isSolved ? 'line-through text-slate-400' : 'text-slate-100'
                                }`}
                              >
                                {prob.title || 'Untitled Problem'}
                              </span>

                              {prob.questionFrontendId && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  [LC #{prob.questionFrontendId}]
                                </span>
                              )}

                              {prob.difficulty && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${getDifficultyBadge(
                                    prob.difficulty
                                  )}`}
                                >
                                  {prob.difficulty}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                              <span className="text-cyan-400">{prob.topic || prob.category || 'DSA'}</span>
                              {prob.notes && (
                                <span className="text-slate-500 truncate" title={prob.notes}>
                                  • {prob.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Add to List, External Links, Solve Button */}
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Add to Custom List Menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenAddToListMenuId(
                                  openAddToListMenuId === prob.id ? null : prob.id
                                )
                              }
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-colors"
                              title="Add/Remove from Custom Lists"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>

                            {openAddToListMenuId === prob.id && (
                              <div className="absolute right-0 mt-1 w-56 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1.5 animate-in fade-in">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800">
                                  Add to Custom Lists
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-0.5">
                                  {safeLists
                                    .filter((l) => l && !l.isBuiltIn && l.id)
                                    .map((cl) => {
                                      const inList = Array.isArray(cl.problemIds) && cl.problemIds.includes(prob.id);
                                      return (
                                        <button
                                          key={cl.id}
                                          onClick={() => onToggleProblemInList(cl.id, prob.id)}
                                          className="w-full px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-800 text-left transition-colors"
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <div
                                              className="w-2 h-2 rounded-full"
                                              style={{ backgroundColor: cl.color || '#3B82F6' }}
                                            />
                                            <span className="truncate text-xs">{cl.name}</span>
                                          </div>
                                          {inList && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                        </button>
                                      );
                                    })}
                                  {safeLists.filter((l) => l && !l.isBuiltIn).length === 0 && (
                                    <div className="px-2 py-2 text-[11px] text-slate-500 text-center">
                                      No custom lists created yet. Click "+ New List" above!
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* LeetCode External Link */}
                          {prob.leetcodeUrl && (
                            <a
                              href={prob.leetcodeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700 rounded-lg transition-colors"
                              title="Open on LeetCode"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* SOLVE IN IDE BUTTON */}
                          <button
                            onClick={() => {
                              onSelectProblem(prob);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-blue-900/30"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>Solve</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Infinite Scroll Indicator / Sentinel */}
                  <div
                    ref={sentinelRef}
                    className="py-5 px-4 text-center text-xs text-slate-500 bg-[#080d18] border-t border-slate-800/80 space-y-2.5"
                  >
                    {visibleCount < filteredProblems.length ? (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-cyan-400 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                          <span>Showing {visibleProblems.length} of {filteredProblems.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setVisibleCount((prev) =>
                                Math.min(filteredProblems.length, prev + LOAD_MORE_STEP)
                              )
                            }
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-md font-sans text-xs transition-colors font-semibold"
                          >
                            + Load More ({Math.min(LOAD_MORE_STEP, filteredProblems.length - visibleProblems.length)})
                          </button>
                          <button
                            onClick={() => setVisibleCount(filteredProblems.length)}
                            className="px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 rounded-md font-sans text-xs transition-colors font-semibold"
                          >
                            ⚡ Load All ({filteredProblems.length})
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>All {filteredProblems.length} questions loaded</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="px-4 py-2.5 border-t border-slate-800 bg-[#080c16] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-white font-semibold">{visibleProblems.length}</span> of{' '}
                <span className="font-mono text-white font-semibold">{filteredProblems.length}</span> loaded
                {visibleCount < filteredProblems.length && (
                  <button
                    onClick={() => setVisibleCount(filteredProblems.length)}
                    className="ml-2 text-cyan-400 hover:text-cyan-300 font-semibold underline text-[11px]"
                  >
                    Load all {filteredProblems.length}
                  </button>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                Click any row or "Solve" to load problem and solution code into C++ IDE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
