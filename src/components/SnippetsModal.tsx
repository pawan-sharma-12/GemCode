import React, { useState } from 'react';
import { X, Code2, Copy, Check, Plus } from 'lucide-react';
import { CPP_DSA_SNIPPETS, CppSnippet } from '../data/cppSnippets';

interface SnippetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSnippet: (snippetCode: string) => void;
}

export const SnippetsModal: React.FC<SnippetsModalProps> = ({ isOpen, onClose, onInsertSnippet }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['All', 'Template', 'Algorithm', 'Data Structure', 'Utility'];

  const filteredSnippets = CPP_DSA_SNIPPETS.filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.detail.toLowerCase().includes(search.toLowerCase()) ||
      s.documentation.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (snippet: CppSnippet) => {
    // Remove snippet placeholders like ${1:val}
    const clean = snippet.insertText.replace(/\$\{\d+:?([^}]*)\}/g, '$1').replace(/\$\d+/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedLabel(snippet.label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const handleInsert = (snippet: CppSnippet) => {
    const clean = snippet.insertText.replace(/\$\{\d+:?([^}]*)\}/g, '$1').replace(/\$\d+/g, '');
    onInsertSnippet(clean);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d131f]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">C++ DSA Snippets & Templates Library</h2>
              <p className="text-xs text-slate-400">Click insert to add directly into your code or copy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="px-6 py-3 border-b border-slate-800 bg-[#0f172a] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search snippets (e.g. dsu, dijkstra, binary search)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>

        {/* Snippet List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {filteredSnippets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No snippets found matching your filter.</div>
          ) : (
            filteredSnippets.map((snippet) => (
              <div
                key={snippet.label}
                className="border border-slate-800 bg-[#0a0f1d] rounded-xl p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                        {snippet.label}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{snippet.detail}</span>
                      <span className="text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {snippet.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{snippet.documentation}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(snippet)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      {copiedLabel === snippet.label ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleInsert(snippet)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insert to Code</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#050811] p-3 rounded-lg border border-slate-900 font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-40">
                  <pre>{snippet.insertText.replace(/\$\{\d+:?([^}]*)\}/g, '$1').replace(/\$\d+/g, '')}</pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
