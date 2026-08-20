import React from 'react';
import { X, Keyboard, Maximize, Play, Sparkles, Sidebar } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F11 / Alt + Z', desc: 'Toggle Full-Screen Code Mode (Full Tab View)', icon: Maximize },
    { key: 'Ctrl + Enter / ⌘ + Enter', desc: 'Run Code / Test Cases', icon: Play },
    { key: 'Ctrl + Shift + F / ⌥ + ⇧ + F', desc: 'Format C++ Code (Beautify & Indent)', icon: Sparkles },
    { key: 'Alt + P', desc: 'Toggle Problem Description Panel', icon: Sidebar },
    { key: 'Alt + C', desc: 'Toggle Bottom Console / Testcases Panel', icon: Sidebar },
    { key: 'Esc', desc: 'Exit Full-Screen Mode', icon: X },
    { key: 'Ctrl + Space', desc: 'Trigger C++ IntelliSense / Autocompletion', icon: Keyboard },
    { key: 'Tab', desc: 'Accept Autocomplete Suggestion / Indent', icon: Keyboard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d131f]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Boost your C++ DSA coding speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs text-slate-300">{s.desc}</span>
                </div>
                <kbd className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-slate-800 text-cyan-300 border border-slate-700 rounded shadow-sm">
                  {s.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-[#0d131f] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
