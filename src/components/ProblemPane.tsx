import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  StickyNote,
  Tag,
  ListOrdered,
  RefreshCw,
  ExternalLink,
  Star,
  CheckCircle2,
  Circle,
  RotateCcw,
  Sparkles,
  Bookmark,
  Layers,
  Search,
  ListFilter,
  Check,
  Code2,
} from 'lucide-react';
import { DSAProblem, Difficulty, ExecutionResult, ProblemList, SheetProblem, UserProblemState } from '../types/dsa';
import { fetchLeetCodeProblem } from '../utils/problemFetcher';
import { GeminiAssistantPanel } from './GeminiAssistantPanel';

interface ProblemPaneProps {
  problem: DSAProblem;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userProblemState?: UserProblemState;
  userProblemStates?: Record<string, UserProblemState>;
  onToggleSolved: (problemId: string) => void;
  onToggleStar: (problemId: string) => void;
  onToggleRevision: (problemId: string) => void;
  lists: ProblemList[];
  activeListId: string;
  onSelectList: (listId: string) => void;
  onToggleProblemInList: (listId: string, problemId: string) => void;
  allProblems?: SheetProblem[];
  onSelectProblem: (problem: SheetProblem) => void;
  onUpdateProblemDetails?: (updatedDetails: Partial<DSAProblem>) => void;
  currentCode?: string;
  language?: string;
  executionResult?: ExecutionResult | null;
  onApplyCodeToEditor?: (code: string) => void;
  onUpdateNotes?: (problemId: string, notes: string) => void;
  activeTabOverride?: 'description' | 'gemini' | 'list' | 'hints' | 'notes';
  onTabChange?: (tab: 'description' | 'gemini' | 'list' | 'hints' | 'notes') => void;
  themeMode?: 'dark' | 'light';
}

export const ProblemPane: React.FC<ProblemPaneProps> = ({
  problem,
  isCollapsed,
  onToggleCollapse,
  userProblemState,
  userProblemStates = {},
  onToggleSolved,
  onToggleStar,
  onToggleRevision,
  lists = [],
  activeListId = 'list-master-sheet',
  onSelectList,
  onToggleProblemInList,
  allProblems = [],
  onSelectProblem,
  onUpdateProblemDetails,
  currentCode = '',
  language = 'cpp',
  executionResult = null,
  onApplyCodeToEditor = () => {},
  onUpdateNotes,
  activeTabOverride,
  onTabChange,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [activeTab, setActiveTab] = useState<'description' | 'gemini' | 'list' | 'hints' | 'notes'>(() => {
    return activeTabOverride || 'description';
  });

  const handleTabClick = (tab: 'description' | 'gemini' | 'list' | 'hints' | 'notes') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [noteContent, setNoteContent] = useState<string>(() => {
    return userProblemState?.notes || localStorage.getItem(`dsa_note_${problem.id}`) || '';
  });
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  // Sync note content when problem or userProblemState changes (e.g. on login/logout)
  useEffect(() => {
    const currentNote =
      userProblemState?.notes !== undefined
        ? userProblemState.notes
        : localStorage.getItem(`dsa_note_${problem.id}`) || '';
    setNoteContent(currentNote);
  }, [problem.id, userProblemState?.notes]);

  useEffect(() => {
    if (activeTabOverride) {
      setActiveTab(activeTabOverride);
    }
  }, [activeTabOverride]);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');
  const [showAddToList, setShowAddToList] = useState<boolean>(false);

  // In-pane List Drawer Filters
  const [listSearchQuery, setListSearchQuery] = useState<string>('');
  const [listTopicFilter, setListTopicFilter] = useState<string>('All');
  const [listVisibleCount, setListVisibleCount] = useState<number>(60);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const listSentinelRef = useRef<HTMLDivElement | null>(null);
  const listActiveItemRef = useRef<HTMLDivElement | null>(null);

  // Safe active list
  const activeList = useMemo(() => {
    return lists.find((l) => l.id === activeListId) || lists[0] || {
      id: 'list-master-sheet',
      name: 'Master SDE Sheet',
      problemIds: [],
    };
  }, [lists, activeListId]);

  // Problems in active list
  const currentListProblems = useMemo(() => {
    if (!activeList || activeList.id === 'list-master-sheet') return allProblems;
    const pIds = Array.isArray(activeList.problemIds) ? activeList.problemIds : [];
    const pIdSet = new Set(pIds);
    return allProblems.filter((p) => p && pIdSet.has(p.id));
  }, [activeList, allProblems]);

  // Unique topics in current list
  const listTopics = useMemo(() => {
    const set = new Set<string>();
    currentListProblems.forEach((p) => {
      if (p && p.category) set.add(p.category.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [currentListProblems]);

  // Filtered problems for in-editor drawer
  const filteredListProblems = useMemo(() => {
    const q = listSearchQuery.trim().toLowerCase();
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
        listTopicFilter === 'All' ||
        p.category === listTopicFilter ||
        (p.topic && p.topic.toLowerCase().includes(listTopicFilter.toLowerCase()));

      return matchesSearch && matchesTopic;
    });
  }, [currentListProblems, listSearchQuery, listTopicFilter]);

  // Find index of current active problem in filtered list
  const activeInFilteredIndex = useMemo(() => {
    return filteredListProblems.findIndex((p) => p && p.id === problem.id);
  }, [filteredListProblems, problem.id]);

  // Jump to active problem in list drawer
  const scrollToListActiveProblem = useCallback(() => {
    if (activeInFilteredIndex >= 0) {
      setListVisibleCount((prev) => Math.max(prev, activeInFilteredIndex + 30));
      setTimeout(() => {
        if (listActiveItemRef.current) {
          listActiveItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 100);
    }
  }, [activeInFilteredIndex]);

  // When switching to the 'list' tab, ensure listVisibleCount covers the current problem and scroll to it
  useEffect(() => {
    if (activeTab === 'list' && activeInFilteredIndex >= 0) {
      setListVisibleCount((prev) => Math.max(prev, activeInFilteredIndex + 30));
      const timer = setTimeout(() => {
        if (listActiveItemRef.current) {
          listActiveItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [activeTab, activeInFilteredIndex]);

  // In-pane drawer IntersectionObserver
  useEffect(() => {
    if (activeTab !== 'list') return;
    const sentinel = listSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setListVisibleCount((prev) => {
            if (prev < filteredListProblems.length) {
              return Math.min(filteredListProblems.length, prev + 50);
            }
            return prev;
          });
        }
      },
      {
        root: listScrollRef.current,
        rootMargin: '300px',
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, filteredListProblems.length]);

  // Find index of current problem in active list
  const currentProblemIndex = useMemo(() => {
    return currentListProblems.findIndex((p) => p && p.id === problem.id);
  }, [currentListProblems, problem.id]);

  // Handle next / prev problem navigation
  const handlePrevProblem = () => {
    if (currentProblemIndex > 0) {
      const prev = currentListProblems[currentProblemIndex - 1];
      if (prev) onSelectProblem(prev);
    }
  };

  const handleNextProblem = () => {
    if (currentProblemIndex >= 0 && currentProblemIndex < currentListProblems.length - 1) {
      const next = currentListProblems[currentProblemIndex + 1];
      if (next) onSelectProblem(next);
    }
  };

  // Infinite scroll inside in-pane drawer
  const handleListScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - 150) {
        setListVisibleCount((prev) => {
          if (prev < filteredListProblems.length) {
            return Math.min(filteredListProblems.length, prev + 40);
          }
          return prev;
        });
      }
    },
    [filteredListProblems.length]
  );

  // Fetch live LeetCode details if description is basic starter or on demand
  const handleFetchLiveDetails = async (force: boolean = false) => {
    if (!problem.slug && !problem.leetcodeUrl) return;
    setIsFetchingLive(true);
    setFetchError('');

    try {
      const slug = problem.slug || problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const data = await fetchLeetCodeProblem(slug);
      if (data && data.success) {
        if (onUpdateProblemDetails) {
          onUpdateProblemDetails({
            title: data.title || problem.title,
            difficulty: data.difficulty || problem.difficulty,
            descriptionHtml: data.contentHtml,
            tags: data.topicTags || [],
            hints: data.hints || [],
            questionFrontendId: data.questionFrontendId,
          });
        }
      } else {
        setFetchError('Could not fetch live details from LeetCode for this slug.');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch problem data');
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSaveNote = () => {
    localStorage.setItem(`dsa_note_${problem.id}`, noteContent);
    if (onUpdateNotes) {
      onUpdateNotes(problem.id, noteContent);
    }
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const toggleHint = (index: number) => {
    if (revealedHints.includes(index)) {
      setRevealedHints(revealedHints.filter((h) => h !== index));
    } else {
      setRevealedHints([...revealedHints, index]);
    }
  };

  const getDifficultyBadge = (diff?: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const isSolved = userProblemState?.isSolved || false;
  const isStarred = userProblemState?.isStarred || false;
  const isRevision = userProblemState?.isRevision || false;

  // Extract GFG url from notes if present
  let gfgUrl = '';
  if (problem.notes && problem.notes.includes('http')) {
    const match = problem.notes.match(/https?:\/\/[^\s\)]+/);
    if (match) gfgUrl = match[0];
  }

  if (isCollapsed) {
    return (
      <div
        className={`w-10 border-r flex flex-col items-center py-4 shrink-0 transition-all ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0d131f] border-slate-800'
        }`}
      >
        <button
          onClick={onToggleCollapse}
          title="Expand Problem Description (Alt + P)"
          className={`p-2 rounded-lg transition-colors mb-6 shadow ${
            isLight ? 'bg-white hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          className={`writing-mode-vertical text-xs font-semibold tracking-wider uppercase rotate-180 flex items-center gap-2 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 rotate-90" />
          <span>{problem.title.replace(/^\d+\.\s*/, '')}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-80 md:w-96 lg:w-[450px] border-r flex flex-col shrink-0 h-full overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0d131f] border-slate-800'
      }`}
    >
      {/* Pane Header: Title, Next/Prev Quick Switcher, Live Sync, Collapse */}
      <div
        className={`px-3.5 py-2.5 border-b flex items-center justify-between shrink-0 gap-2 ${
          isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-[#0a0e17] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <div className="p-1.5 bg-blue-500/20 text-blue-500 dark:text-blue-400 rounded-lg shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="truncate flex-1">
            <div className="flex items-center gap-1.5 truncate">
              {currentProblemIndex >= 0 && (
                <span
                  className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                    isLight
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-blue-500/20 text-cyan-300 border-blue-500/30'
                  }`}
                >
                  #{currentProblemIndex + 1}
                </span>
              )}
              <h2
                className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}
                title={problem.title}
              >
                {problem.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Prev / Next Navigator */}
          <button
            onClick={handlePrevProblem}
            disabled={currentProblemIndex <= 0}
            className={`p-1 disabled:opacity-30 rounded border transition-colors ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Previous Problem in List"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextProblem}
            disabled={currentProblemIndex < 0 || currentProblemIndex >= currentListProblems.length - 1}
            className={`p-1 disabled:opacity-30 rounded border transition-colors ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Next Problem in List"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Live sync button */}
          <button
            onClick={() => handleFetchLiveDetails(true)}
            disabled={isFetchingLive}
            title="Fetch/Sync Live Details from LeetCode"
            className={`p-1 rounded transition-colors disabled:opacity-50 ${
              isLight
                ? 'text-slate-500 hover:text-cyan-700 hover:bg-slate-200'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin text-cyan-500' : ''}`}
            />
          </button>

          <button
            onClick={onToggleCollapse}
            title="Collapse Panel (Alt + P)"
            className={`p-1 rounded transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Toolbar (Solved, Star, Revision, Add to List, LeetCode, GFG) */}
      <div
        className={`px-3 py-1.5 border-b flex items-center justify-between gap-1 shrink-0 text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d16] border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-1">
          {/* Solved Toggle */}
          <button
            onClick={() => onToggleSolved(problem.id)}
            className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 transition-colors ${
              isSolved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Solved Status"
          >
            {isSolved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
            <span className="text-[10px]">{isSolved ? 'Solved' : 'Unsolved'}</span>
          </button>

          {/* Star Toggle */}
          <button
            onClick={() => onToggleStar(problem.id)}
            className={`p-1 rounded-md transition-colors ${
              isStarred
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
            }`}
            title="Star as Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
          </button>

          {/* Revision Toggle */}
          <button
            onClick={() => onToggleRevision(problem.id)}
            className={`p-1 rounded-md transition-colors ${
              isRevision
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'text-slate-400 hover:text-purple-400 hover:bg-slate-800'
            }`}
            title="Mark for Revision"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 relative">
          {/* Add to Custom List Menu */}
          <button
            onClick={() => setShowAddToList(!showAddToList)}
            className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] font-medium flex items-center gap-1 border border-slate-700 transition-colors"
            title="Add to Custom List"
          >
            <Bookmark className="w-3 h-3 text-cyan-400" />
            <span>List</span>
          </button>

          {showAddToList && (
            <div className="absolute right-0 top-7 w-52 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1 animate-in fade-in">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800">
                Add to Custom Lists
              </div>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {(lists || [])
                  .filter((l) => l && !l.isBuiltIn)
                  .map((cl) => {
                    const inList = Array.isArray(cl.problemIds) && cl.problemIds.includes(problem.id);
                    return (
                      <button
                        key={cl.id}
                        onClick={() => onToggleProblemInList(cl.id, problem.id)}
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
                {lists.filter((l) => !l.isBuiltIn).length === 0 && (
                  <div className="px-2 py-2 text-[11px] text-slate-500 text-center">
                    No custom lists. Create one from Explorer!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Direct LeetCode Link */}
          {problem.leetcodeUrl && (
            <a
              href={problem.leetcodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 bg-slate-800/80 hover:bg-amber-600/20 text-slate-400 hover:text-amber-300 rounded-md border border-slate-700 transition-colors"
              title="Open on LeetCode"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* GFG Link */}
          {gfgUrl && (
            <a
              href={gfgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-1.5 py-0.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 rounded-md text-[10px] font-bold border border-emerald-700/50 transition-colors"
              title="Open GeeksforGeeks Reference"
            >
              GFG
            </a>
          )}
        </div>
      </div>

      {/* Primary Tabs including Problem List Drawer and Gemini AI */}
      <div
        className={`flex border-b text-xs font-medium shrink-0 overflow-x-auto ${
          isLight ? 'border-slate-200 bg-slate-100' : 'border-slate-800 bg-[#0c111c]'
        }`}
      >
        <button
          onClick={() => handleTabClick('description')}
          className={`py-2 px-2.5 flex items-center justify-center gap-1.5 transition-colors border-b-2 shrink-0 ${
            activeTab === 'description'
              ? isLight
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-blue-500 text-blue-400 bg-blue-500/5 font-bold'
              : isLight
              ? 'border-transparent text-slate-600 hover:text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Description</span>
        </button>

        <button
          onClick={() => handleTabClick('gemini')}
          className={`py-2 px-2.5 flex items-center justify-center gap-1.5 transition-colors border-b-2 shrink-0 ${
            activeTab === 'gemini'
              ? isLight
                ? 'border-cyan-600 text-cyan-800 bg-white font-bold'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10 font-bold'
              : isLight
              ? 'border-transparent text-cyan-700 hover:text-cyan-900'
              : 'border-transparent text-cyan-400/80 hover:text-cyan-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span>GemCode AI ✨</span>
        </button>

        <button
          onClick={() => handleTabClick('list')}
          className={`py-2 px-2.5 flex items-center justify-center gap-1.5 transition-colors border-b-2 shrink-0 ${
            activeTab === 'list'
              ? isLight
                ? 'border-cyan-600 text-cyan-800 bg-white font-bold'
                : 'border-cyan-500 text-cyan-400 bg-cyan-500/5 font-bold'
              : isLight
              ? 'border-transparent text-slate-600 hover:text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>List ({currentListProblems.length})</span>
        </button>

        <button
          onClick={() => handleTabClick('hints')}
          className={`py-2 px-2 flex items-center justify-center gap-1 transition-colors border-b-2 shrink-0 ${
            activeTab === 'hints'
              ? isLight
                ? 'border-amber-500 text-amber-800 bg-white font-bold'
                : 'border-yellow-500 text-yellow-400 bg-yellow-500/5 font-bold'
              : isLight
              ? 'border-transparent text-slate-600 hover:text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Hints</span>
        </button>

        <button
          onClick={() => handleTabClick('notes')}
          className={`py-2 px-2 flex items-center justify-center gap-1 transition-colors border-b-2 shrink-0 ${
            activeTab === 'notes'
              ? isLight
                ? 'border-purple-600 text-purple-800 bg-white font-bold'
                : 'border-purple-500 text-purple-400 bg-purple-500/5 font-bold'
              : isLight
              ? 'border-transparent text-slate-600 hover:text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5" />
          <span>Notes</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div
        className={`flex-1 overflow-y-auto text-xs ${
          isLight ? 'bg-white text-slate-800' : 'bg-[#0d131f] text-slate-300'
        } ${activeTab === 'gemini' ? 'p-0 flex flex-col' : 'p-3'}`}
      >
        {/* TAB 0: GEMCODE AI COPILOT */}
        {activeTab === 'gemini' && (
          <GeminiAssistantPanel
            problem={problem}
            currentCode={currentCode}
            language={language}
            executionResult={executionResult}
            onApplyCodeToEditor={onApplyCodeToEditor}
            themeMode={themeMode}
          />
        )}

        {/* TAB 1: DESCRIPTION */}
        {activeTab === 'description' && (
          <div className="space-y-4">
            {/* Tags & Meta Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getDifficultyBadge(
                  problem.difficulty
                )}`}
              >
                {problem.difficulty}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-cyan-300 border border-slate-700">
                <Tag className="w-3 h-3" />
                {problem.topic}
              </span>
              {problem.tags &&
                problem.tags.slice(0, 3).map((tg) => (
                  <span
                    key={tg}
                    className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {tg}
                  </span>
                ))}
            </div>

            {/* If live HTML is present, render it cleanly with markdown/code styles */}
            {problem.descriptionHtml ? (
              <div
                className="problem-html-content space-y-3 text-slate-200 leading-relaxed font-sans prose prose-invert max-w-none text-xs"
                dangerouslySetInnerHTML={{ __html: problem.descriptionHtml }}
              />
            ) : (
              /* Fallback to text description */
              <div className="space-y-3 text-slate-200 leading-relaxed whitespace-pre-line">
                {problem.description || (
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-center space-y-3">
                    <p className="text-slate-400">
                      Problem: <strong className="text-white">{problem.title}</strong>
                    </p>
                    <button
                      onClick={() => handleFetchLiveDetails(true)}
                      disabled={isFetchingLive}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isFetchingLive ? 'Fetching LeetCode Details...' : 'Fetch Live Description & Starter'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Structured Examples if available */}
            {problem.examples && problem.examples.length > 0 && !problem.descriptionHtml && (
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
                  <span>Examples</span>
                </h3>
                {problem.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="bg-[#080d16] border border-slate-800/90 rounded-lg p-3 space-y-1.5 font-mono text-[11px]"
                  >
                    <div className="text-slate-400">
                      <span className="text-blue-400 font-semibold">Example {idx + 1}:</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans font-semibold">Input: </span>
                      <span className="text-amber-300">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans font-semibold">Output: </span>
                      <span className="text-emerald-400 font-bold">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="font-sans text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                        <span className="font-semibold text-slate-300">Explanation: </span>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && !problem.descriptionHtml && (
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-white text-xs">Constraints:</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px] bg-[#080d16] p-3 rounded-lg border border-slate-800/90">
                  {problem.constraints.map((c, idx) => (
                    <li key={idx}>
                      <span className="text-slate-300">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: IN-EDITOR PROBLEM LIST SWITCHER WITH ROW NUMBERING */}
        {activeTab === 'list' && (
          <div className="flex flex-col h-full space-y-2.5">
            {/* Sheet Selector */}
            <div className="flex items-center gap-2">
              <select
                value={activeListId}
                onChange={(e) => onSelectList(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#080d16] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.id === 'list-master-sheet' ? allProblems.length : l.problemIds?.length || 0} questions)
                  </option>
                ))}
              </select>
            </div>

            {/* In-drawer Search & Topic Filter */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick search questions..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-6 py-1 bg-slate-900 border border-slate-700 rounded-md text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {listSearchQuery && (
                  <button
                    onClick={() => setListSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[10px]"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={listTopicFilter}
                onChange={(e) => setListTopicFilter(e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[110px] truncate"
              >
                {listTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {activeInFilteredIndex >= 0 && (
                <button
                  type="button"
                  onClick={scrollToListActiveProblem}
                  className="px-2 py-1 bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-800/60 rounded-md text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  title="Jump to current active problem in list"
                >
                  <span>📍 #{activeInFilteredIndex + 1}</span>
                </button>
              )}
            </div>

            {/* List Rows with Numbering and 1-Click Load */}
            <div
              ref={listScrollRef}
              onScroll={handleListScroll}
              className="flex-1 overflow-y-auto divide-y divide-slate-800/60 rounded-lg border border-slate-800 bg-[#080d16] max-h-[calc(100vh-280px)]"
            >
              {filteredListProblems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No questions match "{listSearchQuery}".
                </div>
              ) : (
                filteredListProblems.slice(0, listVisibleCount).map((p, idx) => {
                  const isCurrent = p.id === problem.id;
                  const st = userProblemStates[p.id] || {
                    isSolved: (p.sheetStatus || '').toLowerCase() === 'solved',
                    isStarred: false,
                    isRevision: false,
                  };

                  return (
                    <div
                      key={p.id}
                      ref={isCurrent ? listActiveItemRef : undefined}
                      onClick={() => {
                        onSelectProblem(p);
                        setActiveTab('description');
                      }}
                      className={`p-2 sm:px-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-blue-900/30 border-l-4 border-cyan-400 text-white ring-1 ring-cyan-500/20'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Explicit Row Number */}
                        <span className="w-7 text-center font-mono text-[10px] font-bold px-1 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                          #{idx + 1}
                        </span>

                        {/* Solved / Star Icon */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSolved(p.id);
                          }}
                          className="p-0.5 text-slate-500 hover:text-emerald-400 shrink-0"
                        >
                          {st.isSolved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <div className="truncate min-w-0 flex-1">
                          <span
                            className={`text-[11px] font-semibold truncate block ${
                              st.isSolved ? 'line-through text-slate-400' : 'text-slate-200'
                            }`}
                          >
                            {p.title}
                          </span>
                          <span className="text-[9px] text-cyan-400 font-mono">{p.topic || p.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.difficulty && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium border ${getDifficultyBadge(
                              p.difficulty
                            )}`}
                          >
                            {p.difficulty}
                          </span>
                        )}
                        {isCurrent ? (
                          <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            Active
                          </span>
                        ) : (
                          <Code2 className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* In-drawer list sentinel */}
              {filteredListProblems.length > 0 && (
                <div ref={listSentinelRef} className="py-2.5 px-2 text-center text-[11px] bg-[#070b14] border-t border-slate-800/80">
                  {listVisibleCount < filteredListProblems.length ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <button
                        onClick={() =>
                          setListVisibleCount((prev) =>
                            Math.min(filteredListProblems.length, prev + 50)
                          )
                        }
                        className="text-cyan-400 hover:text-cyan-300 font-semibold underline text-[10px]"
                      >
                        + Load next 50 ({filteredListProblems.length - listVisibleCount} remaining)
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-500 font-mono text-[10px]">All {filteredListProblems.length} loaded</span>
                  )}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 text-center font-mono pt-1">
              Showing {Math.min(listVisibleCount, filteredListProblems.length)} of {filteredListProblems.length} questions • Click any row to load into editor
            </div>
          </div>
        )}

        {/* TAB 3: HINTS */}
        {activeTab === 'hints' && (
          <div className="space-y-3">
            {problem.hints && problem.hints.length > 0 ? (
              problem.hints.map((hint, idx) => (
                <div key={idx} className="border border-slate-800 bg-[#080d16] rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleHint(idx)}
                    className="w-full px-3 py-2 text-left bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-xs font-semibold text-yellow-400"
                  >
                    <span>Hint {idx + 1}</span>
                    <span className="text-[11px] text-slate-400">{revealedHints.includes(idx) ? 'Hide' : 'Reveal'}</span>
                  </button>
                  {revealedHints.includes(idx) && (
                    <div className="p-3 text-slate-300 leading-relaxed text-xs border-t border-slate-800">
                      {hint}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
                <p>No hints available for this problem yet.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Personal Solution Notes
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write intuition, edge cases, time/space complexity breakdown..."
                rows={10}
                className="w-full p-3 bg-[#080d16] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                {savedStatus ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{savedStatus ? 'Saved!' : 'Save Notes'}</span>
              </button>
              {savedStatus && <span className="text-[11px] text-emerald-400">Notes persisted to browser storage</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
