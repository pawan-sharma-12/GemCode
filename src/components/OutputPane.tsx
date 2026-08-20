import React, { useState } from 'react';
import { Play, Sparkles, Terminal, CheckCircle2, XCircle, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
import { ExecutionResult, TestCase } from '../types/dsa';

interface OutputPaneProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onRun: (customStdin: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  testCases?: TestCase[];
  themeMode?: 'dark' | 'light';
  onAskAiAboutError?: () => void;
}

export const OutputPane: React.FC<OutputPaneProps> = ({
  result,
  isRunning,
  onRun,
  isCollapsed,
  onToggleCollapse,
  testCases = [],
  themeMode = 'dark',
  onAskAiAboutError,
}) => {
  const [activeTab, setActiveTab] = useState<'testcases' | 'result'>('testcases');
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');

  // Fallback if no test cases passed
  const displayCases: TestCase[] = testCases.length > 0 
    ? testCases 
    : [
        {
          id: 'case-1',
          input: '1 2 3',
          expectedOutput: '',
          isHidden: false,
        }
      ];

  const currentCase = displayCases[selectedCaseIndex] || displayCases[0];

  const currentResultCase = result?.testCaseResults 
    ? result.testCaseResults[selectedCaseIndex] 
    : null;

  return (
    <div className={`h-full flex flex-col ${themeMode === 'dark' ? 'bg-[#0f172a] text-slate-200' : 'bg-slate-50 text-slate-800'} border-t ${themeMode === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
      {/* Top Header */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${themeMode === 'dark' ? 'border-slate-800 bg-[#1e293b]/60' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('testcases')}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'testcases'
                ? themeMode === 'dark'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sample Test Cases</span>
          </button>

          <button
            onClick={() => setActiveTab('result')}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'result'
                ? themeMode === 'dark'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Run Result</span>
            {result && (
              <span className={`w-2 h-2 rounded-full ${result.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {result?.error && onAskAiAboutError && (
            <button
              onClick={onAskAiAboutError}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 rounded transition-all shadow-sm"
              title="Ask AI to analyze this compiler error and suggest a fix"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Ask AI About Error</span>
            </button>
          )}

          <button
            onClick={() => onRun(customInput || currentCase.input)}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded transition-all shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {activeTab === 'testcases' && (
          <div className="space-y-4">
            {/* Case Selection Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-700/50 pb-2">
              {displayCases.map((tc, idx) => {
                const caseRes = result?.testCaseResults?.find(r => r.testCaseId === tc.id || r.input === tc.input);
                return (
                  <button
                    key={tc.id || idx}
                    onClick={() => setSelectedCaseIndex(idx)}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedCaseIndex === idx
                        ? themeMode === 'dark'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-900'
                        : themeMode === 'dark'
                          ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                          : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {caseRes ? (
                      caseRes.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    )}
                    <span>Case {idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Case Details */}
            {currentCase && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 font-sans font-semibold">Input:</span>
                  </div>
                  <div className={`p-2.5 rounded-md border ${themeMode === 'dark' ? 'bg-[#0b0f19] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} whitespace-pre-wrap`}>
                    {currentCase.input}
                  </div>
                </div>

                {currentCase.expectedOutput && (
                  <div>
                    <span className="text-slate-400 font-sans font-semibold block mb-1">Expected Output:</span>
                    <div className={`p-2.5 rounded-md border ${themeMode === 'dark' ? 'bg-[#0b0f19] border-slate-800 text-emerald-400' : 'bg-white border-slate-200 text-emerald-600'} whitespace-pre-wrap font-semibold`}>
                      {currentCase.expectedOutput}
                    </div>
                  </div>
                )}

                {currentResultCase && (
                  <div>
                    <span className="text-slate-400 font-sans font-semibold block mb-1">Your Output:</span>
                    <div className={`p-2.5 rounded-md border ${
                      currentResultCase.passed 
                        ? themeMode === 'dark' ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : themeMode === 'dark' ? 'bg-rose-950/20 border-rose-800/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
                    } whitespace-pre-wrap font-semibold`}>
                      {currentResultCase.actualOutput || '(No output)'}
                    </div>
                  </div>
                )}

                {currentCase.explanation && (
                  <div className="flex items-start space-x-2 text-slate-400 font-sans text-xs pt-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span>{currentCase.explanation}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'result' && (
          <div className="space-y-4">
            {!result && !isRunning && (
              <div className="text-slate-500 italic py-6 text-center">
                Click "Run Code" to compile and execute against the sample test cases.
              </div>
            )}

            {isRunning && (
              <div className="flex items-center justify-center space-x-2 py-8 text-blue-400">
                <Play className="w-4 h-4 animate-spin" />
                <span>Running your code on Piston sandbox...</span>
              </div>
            )}

            {result && !isRunning && (
              <div className="space-y-4">
                {/* Result Header Badge */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${
                  result.status === 'success'
                    ? themeMode === 'dark' ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : themeMode === 'dark' ? 'bg-rose-950/30 border-rose-800/50 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                    <span className="font-semibold text-sm font-sans">
                      {result.status === 'success' ? 'Accepted' : 'Wrong Answer / Runtime Error'}
                    </span>
                  </div>

                  {result.executionTimeMs !== undefined && (
                    <div className="flex items-center space-x-1 text-xs opacity-80">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Runtime: {result.executionTimeMs} ms</span>
                    </div>
                  )}
                </div>

                {/* Test case breakdown badges */}
                {result.testCaseResults && (
                  <div className="space-y-2">
                    <span className="text-slate-400 font-sans font-semibold">Test Case Summary:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {result.testCaseResults.map((tc, idx) => (
                        <div
                          key={tc.testCaseId || idx}
                          className={`p-2.5 rounded-md border flex items-center justify-between ${
                            tc.passed
                              ? themeMode === 'dark' ? 'bg-emerald-900/10 border-emerald-800/30 text-slate-200' : 'bg-emerald-50/50 border-emerald-100 text-slate-800'
                              : themeMode === 'dark' ? 'bg-rose-900/10 border-rose-800/30 text-slate-200' : 'bg-rose-50/50 border-rose-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {tc.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            )}
                            <span className="font-semibold">Case {idx + 1}</span>
                          </div>
                          <span className="text-xs text-slate-400">{tc.executionTimeMs} ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stderr / Compiler Error */}
                {result.error && (
                  <div>
                    <span className="text-rose-400 font-sans font-semibold block mb-1">Compiler / Runtime Error:</span>
                    <div className={`p-3 rounded-md border ${themeMode === 'dark' ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'} whitespace-pre-wrap overflow-x-auto`}>
                      {result.error}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
