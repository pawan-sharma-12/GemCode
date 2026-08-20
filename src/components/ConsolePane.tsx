import React, { useState } from 'react';
import {
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Code2,
} from 'lucide-react';
import { ExecutionResult, TestCase } from '../types/dsa';

interface ConsolePaneProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  executionResult: ExecutionResult | null;
  isRunning: boolean;
  testCases: TestCase[];
  onAddTestCase: (input: string, expectedOutput: string) => void;
  onDeleteTestCase: (id: string) => void;
  customInput: string;
  onChangeCustomInput: (val: string) => void;
  onRunCustom: () => void;
  themeMode?: 'dark' | 'light';
}

export const ConsolePane: React.FC<ConsolePaneProps> = ({
  isCollapsed,
  onToggleCollapse,
  executionResult,
  isRunning,
  testCases,
  onAddTestCase,
  onDeleteTestCase,
  customInput,
  onChangeCustomInput,
  onRunCustom,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [activeTab, setActiveTab] = useState<'testcases' | 'custom' | 'output'>('testcases');
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState<number>(0);
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [newCaseInput, setNewCaseInput] = useState('');
  const [newCaseExpected, setNewCaseExpected] = useState('');

  const handleSaveNewCase = () => {
    if (!newCaseInput.trim()) return;
    onAddTestCase(newCaseInput, newCaseExpected);
    setNewCaseInput('');
    setNewCaseExpected('');
    setIsAddingCase(false);
    setSelectedTestCaseIndex(testCases.length);
  };

  if (isCollapsed) {
    return (
      <div
        className={`h-9 border-t flex items-center justify-between px-4 shrink-0 transition-colors ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0d131f] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
              isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ChevronUp className="w-4 h-4 text-blue-500" />
            <Terminal className="w-3.5 h-3.5" />
            <span>Console & Test Cases</span>
          </button>
          {executionResult && (
            <div className="flex items-center gap-2">
              {executionResult.status === 'success' && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {executionResult.allPassed !== undefined
                    ? executionResult.allPassed
                      ? 'All Test Cases Passed'
                      : 'Test Run Finished'
                    : 'Success'}
                </span>
              )}
              {executionResult.status === 'failed' && (
                <span className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                  <XCircle className="w-3 h-3" />
                  Some Tests Failed
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
        >
          Open Console
        </button>
      </div>
    );
  }

  return (
    <div
      className={`h-64 md:h-72 border-t flex flex-col shrink-0 overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0d131f] border-slate-800'
      }`}
    >
      {/* Console Header */}
      <div
        className={`px-4 py-2 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#090d16] border-slate-800'
        }`}
      >
        {/* Tabs */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('testcases')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'testcases'
                ? isLight
                  ? 'bg-white text-blue-700 font-semibold shadow-sm border border-slate-200'
                  : 'bg-slate-800 text-white font-semibold shadow'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Test Cases ({testCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'custom'
                ? isLight
                  ? 'bg-white text-emerald-700 font-semibold shadow-sm border border-slate-200'
                  : 'bg-slate-800 text-white font-semibold shadow'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Custom Input (Stdin)</span>
          </button>

          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'output'
                ? isLight
                  ? 'bg-white text-amber-700 font-semibold shadow-sm border border-slate-200'
                  : 'bg-slate-800 text-white font-semibold shadow'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-yellow-500" />
            <span>Execution Output</span>
            {executionResult && executionResult.status !== 'idle' && (
              <span
                className={`w-2 h-2 rounded-full ${
                  executionResult.status === 'success'
                    ? 'bg-emerald-500'
                    : executionResult.status === 'failed'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
            )}
          </button>
        </div>

        {/* Status / Timing / Collapse */}
        <div className="flex items-center gap-3">
          {isRunning ? (
            <div className="flex items-center gap-2 text-xs text-blue-500 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Compiling & Executing Code...</span>
            </div>
          ) : executionResult && executionResult.status !== 'idle' ? (
            <div className="flex items-center gap-3 text-xs">
              <span
                className={`flex items-center gap-1 font-mono ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                {executionResult.executionTimeMs} ms
              </span>
              <span
                className={`flex items-center gap-1 font-mono ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-purple-500" />
                {(executionResult.memoryKb / 1024).toFixed(1)} MB
              </span>
            </div>
          ) : null}

          <button
            onClick={onToggleCollapse}
            title="Minimize Console"
            className={`p-1 rounded transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div
        className={`flex-1 overflow-y-auto p-4 text-xs ${
          isLight ? 'bg-white text-slate-800' : 'bg-[#0d131f] text-slate-300'
        }`}
      >
        {activeTab === 'testcases' && (
          <div className="space-y-4">
            {/* Case selector pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {testCases.map((tc, idx) => {
                const tcResult = executionResult?.testCaseResults?.find((r) => r.testCaseId === tc.id);
                const isPassed = tcResult?.passed;
                const isFailed = tcResult && !tcResult.passed;

                return (
                  <button
                    key={tc.id}
                    onClick={() => {
                      setSelectedTestCaseIndex(idx);
                      setIsAddingCase(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                      selectedTestCaseIndex === idx && !isAddingCase
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>Case {idx + 1}</span>
                    {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                    {isFailed && <XCircle className="w-3.5 h-3.5 text-rose-300" />}
                  </button>
                );
              })}

              <button
                onClick={() => setIsAddingCase(true)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed flex items-center gap-1 transition-colors ${
                  isAddingCase
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Testcase</span>
              </button>
            </div>

            {/* Selected Test Case Detail */}
            {!isAddingCase && testCases[selectedTestCaseIndex] && (
              <div className="bg-[#080d16] border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Input Data (Stdin):
                  </span>
                  {testCases.length > 1 && (
                    <button
                      onClick={() => onDeleteTestCase(testCases[selectedTestCaseIndex].id)}
                      title="Delete test case"
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="bg-[#050811] p-2.5 rounded-lg border border-slate-900 text-amber-300 text-xs whitespace-pre-wrap">
                  {testCases[selectedTestCaseIndex].input}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      Expected Output:
                    </span>
                    <div className="bg-[#050811] p-2.5 rounded-lg border border-slate-900 text-emerald-400 text-xs whitespace-pre-wrap">
                      {testCases[selectedTestCaseIndex].expectedOutput || '(None specified)'}
                    </div>
                  </div>

                  {executionResult?.testCaseResults?.[selectedTestCaseIndex] && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">
                        Actual Output:
                      </span>
                      <div
                        className={`p-2.5 rounded-lg border text-xs whitespace-pre-wrap ${
                          executionResult.testCaseResults[selectedTestCaseIndex].passed
                            ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                            : 'bg-rose-950/20 border-rose-800/60 text-rose-300'
                        }`}
                      >
                        {executionResult.testCaseResults[selectedTestCaseIndex].actual}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add Custom Test Case Form */}
            {isAddingCase && (
              <div className="bg-[#080d16] border border-emerald-500/30 rounded-xl p-4 space-y-3 font-mono">
                <span className="text-xs font-bold text-emerald-400 block">
                  Add New Custom Test Case:
                </span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Input (Stdin):</label>
                  <textarea
                    rows={2}
                    value={newCaseInput}
                    onChange={(e) => setNewCaseInput(e.target.value)}
                    placeholder="Enter input data (e.g. 4\n2 7 11 15\n9)"
                    className="w-full bg-[#050811] border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Expected Output (Optional):</label>
                  <input
                    type="text"
                    value={newCaseExpected}
                    onChange={(e) => setNewCaseExpected(e.target.value)}
                    placeholder="Enter expected result (e.g. [0,1])"
                    className="w-full bg-[#050811] border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 font-sans">
                  <button
                    onClick={() => setIsAddingCase(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewCase}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Save Test Case
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-3 h-full flex flex-col font-mono">
            <div className="flex items-center justify-between font-sans">
              <span className="text-slate-400 text-xs">
                Provide custom standard input (cin stream) for interactive execution:
              </span>
              <button
                onClick={onRunCustom}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>Run with Custom Input</span>
              </button>
            </div>
            <textarea
              value={customInput}
              onChange={(e) => onChangeCustomInput(e.target.value)}
              placeholder="e.g.:&#10;5&#10;10 20 30 40 50"
              rows={4}
              className="w-full flex-1 bg-[#050811] border border-slate-800 rounded-lg p-3 text-xs text-amber-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none font-mono"
            />
          </div>
        )}

        {activeTab === 'output' && (
          <div className="space-y-3 font-mono text-xs h-full">
            {executionResult ? (
              <div className="space-y-3">
                {executionResult.stderr && (
                  <div className="bg-rose-950/30 border border-rose-800/80 rounded-lg p-3 text-rose-300">
                    <span className="font-bold block text-rose-400 mb-1">Errors / Warnings:</span>
                    <pre className="whitespace-pre-wrap">{executionResult.stderr}</pre>
                  </div>
                )}

                {executionResult.stdout && (
                  <div className="bg-[#050811] border border-slate-800 rounded-lg p-3 text-emerald-300">
                    <span className="font-bold block text-slate-400 mb-1">Standard Output (stdout):</span>
                    <pre className="whitespace-pre-wrap">{executionResult.stdout}</pre>
                  </div>
                )}

                {!executionResult.stdout && !executionResult.stderr && (
                  <div className="text-slate-500 py-6 text-center">
                    Program executed with no output.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 py-8 text-center">
                Click "Run Code" or press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl + Enter</kbd> to compile and execute.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
