import React, { useState } from 'react';
import { 
  Code2, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Sun, 
  Moon, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Check, 
  AlertCircle,
  HelpCircle,
  UserCheck,
  LayoutGrid,
  ListPlus,
  FileSpreadsheet,
  FileCode,
  FolderOpen,
  Keyboard,
  BookOpen,
  RotateCcw,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DSAProblem, ProblemList, SheetProblem } from '../types/dsa';
import { signInWithGoogle, signInAsGuest, signOutUser } from '../utils/firebase';

interface NavbarProps {
  selectedProblem?: DSAProblem;
  activeProblemTitle?: string;
  onSelectProblem?: (problem: SheetProblem) => void;
  allProblems?: SheetProblem[];
  lists?: ProblemList[];
  activeListId?: string;
  onSelectList?: (listId: string) => void;
  onOpenDirectory?: () => void;
  onOpenCreateList?: () => void;
  onOpenImportModal?: () => void;
  isProblemPaneCollapsed?: boolean;
  onToggleProblemPane?: () => void;
  isConsolePaneCollapsed?: boolean;
  onToggleConsolePane?: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onOpenShortcuts?: () => void;
  onOpenCheatSheet?: () => void;
  onOpenSnippets?: () => void;
  onResetCode?: () => void;
  onQuickLoadUrl?: (urlOrSlug: string) => void;
  currentView?: 'home' | 'ide';
  onToggleView?: (view: 'home' | 'ide') => void;
  currentUser?: User | null;
  user?: User | null;
  onLoginGoogle?: () => void;
  onLogoutGoogle?: () => void;
  onOpenGemini?: () => void;
  onOpenGeminiChat?: () => void;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
  onToggleTheme?: () => void;
  onRunCode?: () => void;
  onSubmitCode?: () => void;
  isRunning?: boolean;
  isSolved?: boolean;
  onToggleSolved?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedProblem,
  activeProblemTitle,
  onSelectProblem,
  allProblems = [],
  lists = [],
  activeListId,
  onSelectList,
  onOpenDirectory,
  onOpenCreateList,
  onOpenImportModal,
  isFullScreen,
  onToggleFullScreen,
  onOpenShortcuts,
  onOpenCheatSheet,
  onOpenSnippets,
  onResetCode,
  onQuickLoadUrl,
  currentView = 'ide',
  onToggleView,
  currentUser,
  user,
  onLoginGoogle,
  onLogoutGoogle,
  onOpenGemini,
  onOpenGeminiChat,
  themeMode = 'dark',
  onToggleThemeMode,
  onToggleTheme,
  onRunCode,
  onSubmitCode,
  isRunning = false,
  isSolved = false,
  onToggleSolved,
  onOpenSettings,
}) => {
  const effectiveUser = currentUser !== undefined ? currentUser : (user || null);
  const handleToggleTheme = onToggleThemeMode || onToggleTheme || (() => {});
  const handleOpenGemini = onOpenGemini || onOpenGeminiChat || (() => {});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showListsDropdown, setShowListsDropdown] = useState(false);

  const activeTitle = selectedProblem?.title || activeProblemTitle || 'Two Sum';

  const handleGoogleSignIn = async () => {
    if (onLoginGoogle) {
      onLoginGoogle();
      return;
    }
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInAsGuest();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in as guest');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (onLogoutGoogle) {
      onLogoutGoogle();
      return;
    }
    try {
      await signOutUser();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <header className={`h-13 border-b flex items-center justify-between px-3 md:px-4 z-20 shrink-0 transition-colors ${
      themeMode === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0b101b] border-slate-800 text-slate-200'
    }`}>
      {/* Brand & Left Navigation */}
      <div className="flex items-center space-x-3">
        {/* App Logo / View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleView && onToggleView(currentView === 'home' ? 'ide' : 'home')}
            className="flex items-center space-x-2 focus:outline-none group"
            title="Click to toggle between Dashboard and IDE"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent hidden sm:inline-block">
              DSA Studio
            </span>
          </button>
        </div>

        {/* View Switcher Pills (Dashboard vs Studio IDE) */}
        {onToggleView && (
          <div className="hidden sm:flex items-center bg-slate-800/40 p-0.5 rounded-lg border border-slate-700/50 text-xs">
            <button
              onClick={() => onToggleView('home')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                currentView === 'home'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onToggleView('ide')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                currentView === 'ide'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IDE
            </button>
          </div>
        )}

        {/* Directory Explorer Button */}
        {onOpenDirectory && (
          <button
            onClick={onOpenDirectory}
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              themeMode === 'light'
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Browse all DSA Problems & Sheets (Ctrl+K)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Problems Directory</span>
          </button>
        )}

        {/* Active Problem Title Pill */}
        {selectedProblem && currentView === 'ide' && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-700/40 max-w-[240px] truncate">
            <span className="text-xs font-medium text-slate-300 truncate" title={activeTitle}>
              {activeTitle}
            </span>
            {onToggleSolved && (
              <button
                onClick={onToggleSolved}
                className={`p-1 rounded transition-colors ${
                  isSolved 
                    ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title={isSolved ? "Mark as unsolved" : "Mark as solved"}
              >
                <CheckCircle2 className={`w-4 h-4 ${isSolved ? 'fill-emerald-400/20 text-emerald-400' : ''}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center Execution Action Buttons (Run & Submit & AI Tutor) */}
      <div className="flex items-center space-x-2">
        {onRunCode && (
          <button
            onClick={onRunCode}
            disabled={isRunning}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              themeMode === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
            } disabled:opacity-50 active:scale-95`}
            title="Run code on sample test cases (Ctrl+Enter)"
          >
            <Play className={`w-3.5 h-3.5 text-blue-400 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>
        )}

        {onSubmitCode && (
          <button
            onClick={onSubmitCode}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
            title="Submit solution for evaluation"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Submit</span>
          </button>
        )}

        <button
          onClick={handleOpenGemini}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-200 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 transition-all shadow-sm active:scale-95"
          title="Open AI DSA Assistant & Complexity Review"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>
      </div>

      {/* Right Controls & Auth */}
      <div className="flex items-center space-x-1.5 md:space-x-2">
        {onOpenSnippets && (
          <button
            onClick={onOpenSnippets}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors hidden lg:inline-flex"
            title="C++ STL Snippets & Algorithms"
          >
            <FileCode className="w-4 h-4" />
          </button>
        )}

        {onOpenCheatSheet && (
          <button
            onClick={onOpenCheatSheet}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors hidden lg:inline-flex"
            title="Time & Space Complexity Cheat Sheet"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        )}

        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors hidden xl:inline-flex"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={handleToggleTheme}
          className={`p-1.5 rounded-lg transition-colors ${
            themeMode === 'light'
              ? 'hover:bg-slate-100 text-slate-600'
              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {themeMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className={`p-1.5 rounded-lg transition-colors ${
              themeMode === 'light'
                ? 'hover:bg-slate-100 text-slate-600'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* User Profile / Auth State */}
        {effectiveUser ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-700/40">
            {effectiveUser.photoURL ? (
              <img
                src={effectiveUser.photoURL}
                alt={effectiveUser.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-slate-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs font-bold">
                {effectiveUser.isAnonymous ? <UserCheck className="w-3.5 h-3.5" /> : (effectiveUser.displayName?.[0] || effectiveUser.email?.[0] || 'U')}
              </div>
            )}
            <span className="text-xs text-slate-300 font-medium hidden xl:inline-block max-w-[100px] truncate">
              {effectiveUser.isAnonymous ? 'Guest' : (effectiveUser.displayName || effectiveUser.email?.split('@')[0])}
            </span>
            <button
              onClick={handleSignOut}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1 pl-1">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm disabled:opacity-50"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={handleGuestSignIn}
              disabled={isSigningIn}
              className="px-2 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Continue as Guest"
            >
              Guest
            </button>
          </div>
        )}
      </div>

      {/* Auth Error Toast */}
      {authError && (
        <div className="fixed bottom-4 right-4 max-w-md bg-slate-900 border border-rose-600/50 p-3 rounded-lg shadow-xl text-xs text-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-rose-300">Sign-In Notice</p>
              <p className="text-slate-300 mt-0.5">{authError}</p>
              <div className="mt-2 flex items-center space-x-2">
                <button
                  onClick={handleGuestSignIn}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                >
                  Continue as Guest
                </button>
                <button
                  onClick={() => setAuthError(null)}
                  className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
