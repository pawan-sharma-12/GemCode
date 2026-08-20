import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import { MASTER_SHEET_PROBLEMS } from './data/masterSheetData';
import { BUILT_IN_LISTS } from './data/curatedLists';
import { DSA_PROBLEMS } from './data/dsaProblems';
import {
  DSAProblem,
  EditorSettings,
  EditorTheme,
  ExecutionResult,
  ProblemList,
  SheetProblem,
  TestCase,
  UserProblemState,
} from './types/dsa';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { ProblemPane } from './components/ProblemPane';
import { EditorPane } from './components/EditorPane';
import { ConsolePane } from './components/ConsolePane';
import { ProblemDirectoryModal } from './components/ProblemDirectoryModal';
import { CreateListModal } from './components/CreateListModal';
import { ImportListModal } from './components/ImportListModal';
import { ComplexityCheatSheet } from './components/ComplexityCheatSheet';
import { SnippetsModal } from './components/SnippetsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { executeCppCode } from './utils/cppExecutor';
import {
  fetchLeetCodeProblem,
  extractExamplesFromHtml,
  extractConstraintsFromHtml,
  generateCppStarter,
} from './utils/problemFetcher';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
  syncUserDataToFirestore,
  loadUserDataFromFirestore,
} from './utils/firebase';

export default function App() {
  // Navigation View State: 'home' (Default Homepage) or 'ide' (Studio IDE)
  const [currentView, setCurrentView] = useState<'home' | 'ide'>('home');

  // Firebase User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // All master sheet problems + any newly imported custom problems
  const [allProblems, setAllProblems] = useState<SheetProblem[]>(() => {
    const savedCustom = localStorage.getItem('dsa_custom_problems');
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((p) => p && typeof p === 'object' && p.id && p.title);
          return [...MASTER_SHEET_PROBLEMS, ...valid];
        }
      } catch (e) {
        console.error('Failed to parse custom problems', e);
      }
    }
    return MASTER_SHEET_PROBLEMS;
  });

  // Problem Lists (Built-in + Custom User Lists)
  const [lists, setLists] = useState<ProblemList[]>(() => {
    const savedLists = localStorage.getItem('dsa_custom_lists');
    if (savedLists) {
      try {
        const parsed: ProblemList[] = JSON.parse(savedLists);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((l) => l && typeof l === 'object' && l.id && l.name);
          return [...BUILT_IN_LISTS, ...valid];
        }
      } catch (e) {
        console.error('Failed to parse custom lists', e);
      }
    }
    return BUILT_IN_LISTS;
  });

  const [activeListId, setActiveListId] = useState<string>('list-master-sheet');

  // User problem states: Solved, Starred, Revision, Notes
  const [userProblemStates, setUserProblemStates] = useState<Record<string, UserProblemState>>(() => {
    const saved = localStorage.getItem('dsa_user_states');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse user states', e);
      }
    }
    return {};
  });

  // Active problem in IDE
  const initialProblem = MASTER_SHEET_PROBLEMS[0] || {
    id: 'sheet-1',
    title: 'Two Sum',
    slug: 'two-sum',
    topic: 'Arrays / Hashing',
    category: 'Arrays',
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
    notes: '',
    sheetStatus: 'Unsolved',
  };

  const [activeProblem, setActiveProblem] = useState<DSAProblem>(() => ({
    id: initialProblem.id,
    title: initialProblem.title,
    slug: initialProblem.slug,
    difficulty: initialProblem.difficulty || 'Easy',
    topic: initialProblem.topic,
    category: initialProblem.category,
    leetcodeUrl: initialProblem.leetcodeUrl,
    notes: initialProblem.notes,
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    starterCode: generateCppStarter(
      initialProblem.title,
      `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`
    ),
    hints: ['A really brute force way would be to search for all possible pairs of numbers but that would be slow.'],
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    testCases: [
      {
        id: 'tc-1',
        input: '4 9\n2 7 11 15',
        expectedOutput: '[0, 1]',
      },
    ],
  }));

  const [code, setCode] = useState<string>(() => {
    const initialSaved = localStorage.getItem(`dsa_code_${initialProblem.id}`);
    if (initialSaved) return initialSaved;
    return (
      initialProblem.starterCode ||
      generateCppStarter(
        initialProblem.title,
        `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`
      )
    );
  });

  const codeRef = useRef<string>(code);
  codeRef.current = code;

  const activeProblemRef = useRef<DSAProblem>(activeProblem);
  activeProblemRef.current = activeProblem;

  const [testCases, setTestCases] = useState<TestCase[]>(activeProblem.testCases || []);
  const [customInput, setCustomInput] = useState<string>('4 9\n2 7 11 15');

  // Panes & Tab control
  const [isProblemPaneCollapsed, setIsProblemPaneCollapsed] = useState(false);
  const [isConsolePaneCollapsed, setIsConsolePaneCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [problemPaneTabOverride, setProblemPaneTabOverride] = useState<
    'description' | 'gemini' | 'list' | 'hints' | 'notes' | undefined
  >(undefined);

  // Modals
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isImportListOpen, setIsImportListOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Execution & Settings
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Theme Mode: 'dark' | 'light' (with local persistence)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('gemcode_theme_mode');
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  const [settings, setSettings] = useState<EditorSettings>(() => ({
    theme: (localStorage.getItem('gemcode_theme_mode') === 'light' ? 'clean-bright-light' : 'ultra-bright-dark') as EditorTheme,
    fontSize: 14,
    tabSize: 4,
    autoClosingBrackets: 'always',
    lineNumbers: 'on',
    minimap: false,
    wordWrap: 'on',
    fontLigatures: true,
  }));

  // Sync theme mode with document element & localStorage
  useEffect(() => {
    localStorage.setItem('gemcode_theme_mode', themeMode);
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [themeMode]);

  // Toggle Dark / Light Theme
  const handleToggleThemeMode = () => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setSettings((s) => ({
        ...s,
        theme: next === 'light' ? 'clean-bright-light' : 'ultra-bright-dark',
      }));
      return next;
    });
  };

  const codeSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load user data from Firestore and sync
        try {
          const cloudData = await loadUserDataFromFirestore(user.uid);
          if (cloudData) {
            if (cloudData.userProblemStates) {
              setUserProblemStates((prev) => {
                const merged = { ...prev, ...cloudData.userProblemStates };
                localStorage.setItem('dsa_user_states', JSON.stringify(merged));
                return merged;
              });

              // Populate localStorage notes for each problem
              Object.entries(cloudData.userProblemStates).forEach(([pid, st]) => {
                if (st && st.notes !== undefined) {
                  localStorage.setItem(`dsa_note_${pid}`, st.notes);
                }
              });
            }

            if (cloudData.savedCodes) {
              Object.entries(cloudData.savedCodes).forEach(([pid, savedCode]) => {
                if (savedCode) {
                  localStorage.setItem(`dsa_code_${pid}`, savedCode);
                }
              });
              // If active problem has saved code in cloud, update editor
              const activePid = activeProblemRef.current?.id;
              if (activePid && cloudData.savedCodes[activePid]) {
                setCode(cloudData.savedCodes[activePid]);
                codeRef.current = cloudData.savedCodes[activePid];
              }
            }

            if (cloudData.customLists && cloudData.customLists.length > 0) {
              setLists((prev) => {
                const builtIns = prev.filter((l) => l.isBuiltIn);
                const merged = [...builtIns, ...cloudData.customLists];
                localStorage.setItem('dsa_custom_lists', JSON.stringify(cloudData.customLists));
                return merged;
              });
            }
          }
        } catch (e) {
          console.warn('Could not sync user data from cloud:', e);
        }
      } else {
        // User logged out - reset state to default
        setUserProblemStates({});
        setLists(BUILT_IN_LISTS);
        localStorage.removeItem('dsa_user_states');
        localStorage.removeItem('dsa_custom_lists');
        if (activeProblemRef.current) {
          const defaultStarter =
            activeProblemRef.current.starterCode || generateCppStarter(activeProblemRef.current.title);
          setCode(defaultStarter);
          codeRef.current = defaultStarter;
          localStorage.removeItem(`dsa_code_${activeProblemRef.current.id}`);
          localStorage.removeItem(`dsa_note_${activeProblemRef.current.id}`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save states to localStorage & sync to Firestore if logged in
  const saveUserStates = (newStates: Record<string, UserProblemState>) => {
    setUserProblemStates(newStates);
    localStorage.setItem('dsa_user_states', JSON.stringify(newStates));
    if (currentUser) {
      syncUserDataToFirestore(currentUser.uid, {
        userProblemStates: newStates,
      });
    }
  };

  const handleUpdateNotes = (problemId: string, notesText: string) => {
    const currentState = userProblemStates[problemId] || {
      isSolved: false,
      isStarred: false,
      isRevision: false,
    };
    const updated = {
      ...userProblemStates,
      [problemId]: {
        ...currentState,
        notes: notesText,
      },
    };
    saveUserStates(updated);
    localStorage.setItem(`dsa_note_${problemId}`, notesText);
  };

  const saveCustomLists = (updatedLists: ProblemList[]) => {
    setLists(updatedLists);
    const customOnly = updatedLists.filter((l) => !l.isBuiltIn);
    localStorage.setItem('dsa_custom_lists', JSON.stringify(customOnly));
    if (currentUser) {
      syncUserDataToFirestore(currentUser.uid, {
        customLists: customOnly,
      });
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
    }
  };

  // Google Logout Handler
  const handleGoogleLogout = async () => {
    try {
      await signOutUser();
      setUserProblemStates({});
      setLists(BUILT_IN_LISTS);
      localStorage.removeItem('dsa_user_states');
      localStorage.removeItem('dsa_custom_lists');
      if (activeProblemRef.current) {
        const defaultStarter =
          activeProblemRef.current.starterCode || generateCppStarter(activeProblemRef.current.title);
        setCode(defaultStarter);
        codeRef.current = defaultStarter;
        localStorage.removeItem(`dsa_code_${activeProblemRef.current.id}`);
        localStorage.removeItem(`dsa_note_${activeProblemRef.current.id}`);
      }
    } catch (err: any) {
      console.error('Google Sign Out failed:', err);
    }
  };

  // Select problem and fetch details from LeetCode or cache
  const handleSelectProblem = useCallback(
    async (sheetProb: SheetProblem | DSAProblem) => {
      // 1. Immediately persist code of currently open problem before switching
      if (activeProblemRef.current?.id && codeRef.current) {
        localStorage.setItem(`dsa_code_${activeProblemRef.current.id}`, codeRef.current);
      }

      const slug =
        sheetProb.slug ||
        sheetProb.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const builtInMatch = DSA_PROBLEMS.find(
        (p) =>
          p.id === slug ||
          p.slug === slug ||
          p.id === sheetProb.id ||
          p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
      );

      // 2. Check saved code for the newly selected problem
      const savedCode = localStorage.getItem(`dsa_code_${sheetProb.id}`);

      // Setup initial problem fields with built-in data fallback
      let currentStarter =
        (sheetProb as any).starterCode ||
        builtInMatch?.starterCode ||
        generateCppStarter(sheetProb.title);
      let examples = (sheetProb as any).examples?.length
        ? (sheetProb as any).examples
        : (builtInMatch?.examples || []);
      let constraints = (sheetProb as any).constraints?.length
        ? (sheetProb as any).constraints
        : (builtInMatch?.constraints || []);
      let hints = (sheetProb as any).hints?.length
        ? (sheetProb as any).hints
        : (builtInMatch?.hints || []);
      let descriptionHtml =
        (sheetProb as any).descriptionHtml ||
        (builtInMatch
          ? `<p>${builtInMatch.description.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`
          : undefined);
      let descriptionText =
        (sheetProb as any).description ||
        builtInMatch?.description ||
        `Solve the problem: ${sheetProb.title}`;
      let difficulty = sheetProb.difficulty || builtInMatch?.difficulty || 'Medium';
      let qId = sheetProb.questionFrontendId || builtInMatch?.questionFrontendId;

      const targetInitialCode =
        savedCode !== null && savedCode !== undefined ? savedCode : currentStarter;

      const newActive: DSAProblem = {
        id: sheetProb.id,
        title: builtInMatch?.title || sheetProb.title,
        slug: slug,
        difficulty: difficulty,
        topic: sheetProb.topic || builtInMatch?.topic || 'General',
        category: sheetProb.category || builtInMatch?.category || 'General',
        leetcodeUrl: sheetProb.leetcodeUrl,
        notes: sheetProb.notes,
        description: descriptionText,
        descriptionHtml: descriptionHtml,
        examples: examples,
        constraints: constraints,
        starterCode: currentStarter,
        hints: hints,
        timeComplexity: (sheetProb as any).timeComplexity || builtInMatch?.timeComplexity || 'O(N)',
        spaceComplexity: (sheetProb as any).spaceComplexity || builtInMatch?.spaceComplexity || 'O(1)',
        testCases: (sheetProb as any).testCases || builtInMatch?.testCases || [
          {
            id: `tc-${Date.now()}`,
            input: 'Sample input',
            expectedOutput: 'Sample output',
          },
        ],
        questionFrontendId: qId,
      };

      setActiveProblem(newActive);
      activeProblemRef.current = newActive;
      setCode(targetInitialCode);
      codeRef.current = targetInitialCode;
      setTestCases(newActive.testCases);
      setExecutionResult(null);

      // Asynchronously fetch full live details from LeetCode
      if (slug || sheetProb.leetcodeUrl) {
        try {
          const liveData = await fetchLeetCodeProblem(slug);
          if (liveData && liveData.success) {
            const parsedExamples = extractExamplesFromHtml(liveData.contentHtml);
            const parsedConstraints = extractConstraintsFromHtml(liveData.contentHtml);
            const liveStarter = generateCppStarter(liveData.title, liveData.cppSnippet);

            setActiveProblem((prev) => {
              if (prev.id !== sheetProb.id) return prev;
              const updated = {
                ...prev,
                title: liveData.title,
                difficulty: liveData.difficulty || prev.difficulty,
                descriptionHtml: liveData.contentHtml,
                examples: parsedExamples.length ? parsedExamples : prev.examples,
                constraints: parsedConstraints.length ? parsedConstraints : prev.constraints,
                hints: liveData.hints || prev.hints,
                starterCode: liveStarter,
                tags: liveData.topicTags,
                questionFrontendId: liveData.questionFrontendId,
              };
              activeProblemRef.current = updated;
              return updated;
            });

            // Only set live starter if user has NEVER saved or written custom code for this problem
            const existingSaved = localStorage.getItem(`dsa_code_${sheetProb.id}`);
            if (!existingSaved && liveData.cppSnippet && activeProblemRef.current?.id === sheetProb.id) {
              setCode(liveStarter);
              codeRef.current = liveStarter;
            }
          }
        } catch (err) {
          console.warn('Live fetch background error:', err);
        }
      }
    },
    []
  );

  // Quick load ANY LeetCode URL pasted by user
  const handleQuickLoadUrl = async (urlOrSlug: string) => {
    let slug = urlOrSlug.trim();
    if (slug.includes('leetcode.com/problems/')) {
      const match = slug.match(/problems\/([a-zA-Z0-9_-]+)/);
      if (match) slug = match[1];
    }

    const titleFormatted = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const newProblem: SheetProblem = {
      id: `custom-url-${Date.now()}`,
      title: titleFormatted,
      slug: slug,
      leetcodeUrl: urlOrSlug.startsWith('http')
        ? urlOrSlug
        : `https://leetcode.com/problems/${slug}/`,
      topic: 'Custom',
      category: 'Custom',
      sheetStatus: 'Unsolved',
    };

    setAllProblems((prev) => [newProblem, ...prev]);
    handleSelectProblem(newProblem);
    setCurrentView('ide');
  };

  // Toggle Solved
  const handleToggleSolved = (problemId: string) => {
    const currentState = userProblemStates[problemId] || {
      isSolved: false,
      isStarred: false,
      isRevision: false,
    };
    const nextSolved = !currentState.isSolved;
    const updated = {
      ...userProblemStates,
      [problemId]: {
        ...currentState,
        isSolved: nextSolved,
      },
    };
    saveUserStates(updated);

    if (nextSolved) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#6EE7B7'],
      });
    }
  };

  // Toggle Star
  const handleToggleStar = (problemId: string) => {
    const currentState = userProblemStates[problemId] || {
      isSolved: false,
      isStarred: false,
      isRevision: false,
    };
    const updated = {
      ...userProblemStates,
      [problemId]: {
        ...currentState,
        isStarred: !currentState.isStarred,
      },
    };
    saveUserStates(updated);
  };

  // Toggle Revision
  const handleToggleRevision = (problemId: string) => {
    const currentState = userProblemStates[problemId] || {
      isSolved: false,
      isStarred: false,
      isRevision: false,
    };
    const updated = {
      ...userProblemStates,
      [problemId]: {
        ...currentState,
        isRevision: !currentState.isRevision,
      },
    };
    saveUserStates(updated);
  };

  // Toggle Problem in Custom List
  const handleToggleProblemInList = (listId: string, problemId: string) => {
    const updatedLists = lists.map((l) => {
      if (l.id === listId) {
        const inList = l.problemIds.includes(problemId);
        return {
          ...l,
          problemIds: inList
            ? l.problemIds.filter((id) => id !== problemId)
            : [...l.problemIds, problemId],
        };
      }
      return l;
    });
    saveCustomLists(updatedLists);
  };

  // Create new custom list
  const handleCreateList = (newList: ProblemList) => {
    const updated = [...lists, newList];
    saveCustomLists(updated);
    setActiveListId(newList.id);
  };

  // Delete custom list
  const handleDeleteCustomList = (listId: string) => {
    const updated = lists.filter((l) => l.id !== listId);
    saveCustomLists(updated);
    if (activeListId === listId) {
      setActiveListId('list-master-sheet');
    }
  };

  // Import List (from Google Sheet CSV or LeetCode URLs)
  const handleImportList = (newList: ProblemList, newProblems?: SheetProblem[]) => {
    if (newProblems && newProblems.length > 0) {
      const updatedAll = [...allProblems, ...newProblems];
      setAllProblems(updatedAll);
      const customOnly = updatedAll.filter((p) => p.id.startsWith('custom-'));
      localStorage.setItem('dsa_custom_problems', JSON.stringify(customOnly));
    }
    const updatedLists = [...lists, newList];
    saveCustomLists(updatedLists);
    setActiveListId(newList.id);
  };

  // Code change
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    codeRef.current = newCode;
    const currentPid = activeProblemRef.current?.id;
    if (currentPid) {
      localStorage.setItem(`dsa_code_${currentPid}`, newCode);
      if (currentUser) {
        if (codeSyncTimeoutRef.current) clearTimeout(codeSyncTimeoutRef.current);
        codeSyncTimeoutRef.current = setTimeout(() => {
          syncUserDataToFirestore(currentUser.uid, {
            savedCodes: { [currentPid]: newCode },
          });
        }, 1500);
      }
    }
  };

  // Reset starter code
  const handleResetCode = () => {
    if (window.confirm('Reset code to the original starter template for this problem?')) {
      const original = activeProblem.starterCode;
      setCode(original);
      codeRef.current = original;
      localStorage.removeItem(`dsa_code_${activeProblem.id}`);
      setExecutionResult(null);
    }
  };

  // Apply code from Gemini AI assistant directly to editor
  const handleApplyCodeFromGemini = (codeToApply: string) => {
    setCode(codeToApply);
    codeRef.current = codeToApply;
    if (activeProblemRef.current?.id) {
      localStorage.setItem(`dsa_code_${activeProblemRef.current.id}`, codeToApply);
    }
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.5 },
      colors: ['#38BDF8', '#34D399'],
    });
  };

  // Open Gemini AI in Studio
  const handleOpenGeminiTab = () => {
    setCurrentView('ide');
    setIsProblemPaneCollapsed(false);
    setProblemPaneTabOverride('gemini');
    // reset tab override after tick
    setTimeout(() => setProblemPaneTabOverride(undefined), 200);
  };

  // Run Code
  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setIsConsolePaneCollapsed(false);

    try {
      const res = await executeCppCode(code, activeProblem, customInput, testCases);
      setExecutionResult(res);

      if (res.allPassed) {
        // Mark solved automatically
        handleToggleSolved(activeProblem.id);
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#38BDF8', '#34D399', '#A78BFA', '#FBBF24'],
        });
      }
    } catch (err: any) {
      setExecutionResult({
        stdout: '',
        stderr: err.message || 'Execution error',
        status: 'runtime_error',
        executionTimeMs: 0,
        memoryKb: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, activeProblem, customInput, testCases]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Fullscreen: F11 or Alt+Z
      if (e.key === 'F11' || (e.altKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        setIsFullScreen((prev) => !prev);
      }

      // Exit Fullscreen: Esc
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }

      // Run Code: Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }

      // Toggle Problem Pane: Alt+P
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsProblemPaneCollapsed((prev) => !prev);
      }

      // Toggle Console Pane: Alt+C
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsConsolePaneCollapsed((prev) => !prev);
      }

      // Open Directory Modal: Alt+O or Ctrl+K
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.altKey && e.key.toLowerCase() === 'o')) {
        e.preventDefault();
        setIsDirectoryOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, handleRunCode]);

  return (
    <div
      className={`flex flex-col h-screen w-screen font-sans overflow-hidden select-none transition-colors ${
        themeMode === 'light'
          ? 'bg-slate-100 text-slate-900'
          : 'bg-[#070b13] text-slate-100'
      }`}
    >
      {/* Top Navigation Bar */}
      {!isFullScreen && (
        <Navbar
          selectedProblem={activeProblem}
          onSelectProblem={handleSelectProblem}
          allProblems={allProblems}
          lists={lists}
          activeListId={activeListId}
          onSelectList={setActiveListId}
          onOpenDirectory={() => setIsDirectoryOpen(true)}
          onOpenCreateList={() => setIsCreateListOpen(true)}
          onOpenImportModal={() => setIsImportListOpen(true)}
          isProblemPaneCollapsed={isProblemPaneCollapsed}
          onToggleProblemPane={() => setIsProblemPaneCollapsed(!isProblemPaneCollapsed)}
          isConsolePaneCollapsed={isConsolePaneCollapsed}
          onToggleConsolePane={() => setIsConsolePaneCollapsed(!isConsolePaneCollapsed)}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
          onOpenSnippets={() => setIsSnippetsOpen(true)}
          onResetCode={handleResetCode}
          onQuickLoadUrl={handleQuickLoadUrl}
          currentView={currentView}
          onToggleView={setCurrentView}
          currentUser={currentUser}
          onLoginGoogle={handleGoogleLogin}
          onLogoutGoogle={handleGoogleLogout}
          onOpenGemini={handleOpenGeminiTab}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
        />
      )}

      {/* VIEW 1: HOME DASHBOARD */}
      {currentView === 'home' && !isFullScreen ? (
        <HomePage
          allProblems={allProblems}
          lists={lists}
          activeListId={activeListId}
          onSelectList={setActiveListId}
          activeProblem={activeProblem}
          onSelectProblem={handleSelectProblem}
          onOpenIDE={() => setCurrentView('ide')}
          userProblemStates={userProblemStates}
          onToggleSolved={handleToggleSolved}
          onToggleStar={handleToggleStar}
          onToggleRevision={handleToggleRevision}
          onOpenDirectory={() => setIsDirectoryOpen(true)}
          onOpenCreateList={() => setIsCreateListOpen(true)}
          onOpenImportModal={() => setIsImportListOpen(true)}
          onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
          currentUser={currentUser}
          onLoginGoogle={handleGoogleLogin}
          onLogoutGoogle={handleGoogleLogout}
          onAskGeminiPrompt={(promptText) => {
            handleOpenGeminiTab();
          }}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
        />
      ) : (
        /* VIEW 2: STUDIO IDE WORKSPACE */
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Problem Description Sidebar */}
          {!isFullScreen && (
            <ProblemPane
              problem={activeProblem}
              isCollapsed={isProblemPaneCollapsed}
              onToggleCollapse={() => setIsProblemPaneCollapsed(!isProblemPaneCollapsed)}
              userProblemState={userProblemStates[activeProblem.id]}
              userProblemStates={userProblemStates}
              onToggleSolved={handleToggleSolved}
              onToggleStar={handleToggleStar}
              onToggleRevision={handleToggleRevision}
              lists={lists}
              activeListId={activeListId}
              onSelectList={setActiveListId}
              onToggleProblemInList={handleToggleProblemInList}
              allProblems={allProblems}
              onSelectProblem={handleSelectProblem}
              onUpdateProblemDetails={(updated) =>
                setActiveProblem((prev) => {
                  const next = { ...prev, ...updated };
                  activeProblemRef.current = next;
                  return next;
                })
              }
              currentCode={code}
              language={settings.language || 'cpp'}
              executionResult={executionResult}
              onApplyCodeToEditor={handleApplyCodeFromGemini}
              onUpdateNotes={handleUpdateNotes}
              activeTabOverride={problemPaneTabOverride}
              themeMode={themeMode}
            />
          )}

          {/* Center/Right Area: Monaco C++ Editor + Bottom Console */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <EditorPane
              code={code}
              onChangeCode={handleCodeChange}
              settings={settings}
              onChangeSettings={(p) => setSettings((prev) => ({ ...prev, ...p }))}
              onResetCode={handleResetCode}
              onRunCode={handleRunCode}
              isRunning={isRunning}
              isFullScreen={isFullScreen}
              onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
              onOpenSnippets={() => setIsSnippetsOpen(true)}
              executionResult={executionResult}
              onOpenGemini={handleOpenGeminiTab}
              themeMode={themeMode}
            />

            {!isFullScreen && (
              <ConsolePane
                isCollapsed={isConsolePaneCollapsed}
                onToggleCollapse={() => setIsConsolePaneCollapsed(!isConsolePaneCollapsed)}
                executionResult={executionResult}
                isRunning={isRunning}
                testCases={testCases}
                onAddTestCase={(inp, out) =>
                  setTestCases([...testCases, { id: `tc-${Date.now()}`, input: inp, expectedOutput: out }])
                }
                onDeleteTestCase={(id) =>
                  setTestCases(testCases.filter((tc) => tc.id !== id))
                }
                customInput={customInput}
                onChangeCustomInput={setCustomInput}
                onRunCustom={handleRunCode}
                themeMode={themeMode}
              />
            )}
          </div>
        </div>
      )}

      {/* Problem Directory & Custom Lists Explorer Modal */}
      <ErrorBoundary fallbackTitle="Could not load Problem Directory">
        <ProblemDirectoryModal
          isOpen={isDirectoryOpen}
          onClose={() => setIsDirectoryOpen(false)}
          allProblems={allProblems}
          activeProblemId={activeProblem.id}
          onSelectProblem={(p) => {
            handleSelectProblem(p);
            setCurrentView('ide');
          }}
          lists={lists}
          activeListId={activeListId}
          onSelectList={setActiveListId}
          onCreateListClick={() => setIsCreateListOpen(true)}
          onImportListClick={() => setIsImportListOpen(true)}
          onDeleteCustomList={handleDeleteCustomList}
          userProblemStates={userProblemStates}
          onToggleSolved={handleToggleSolved}
          onToggleStar={handleToggleStar}
          onToggleRevision={handleToggleRevision}
          onToggleProblemInList={handleToggleProblemInList}
        />
      </ErrorBoundary>

      {/* Create Custom List Modal */}
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreateList={handleCreateList}
      />

      {/* Import List Modal */}
      <ImportListModal
        isOpen={isImportListOpen}
        onClose={() => setIsImportListOpen(false)}
        allProblems={allProblems}
        onImportList={handleImportList}
      />

      {/* Helper Modals */}
      <ComplexityCheatSheet
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />
      <SnippetsModal
        isOpen={isSnippetsOpen}
        onClose={() => setIsSnippetsOpen(false)}
        onInsertSnippet={(snippetCode) => setCode((prev) => prev + '\n\n' + snippetCode)}
      />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
