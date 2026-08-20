import React from 'react';
import { X, Zap, Database, ArrowUpDown, Network } from 'lucide-react';

interface ComplexityCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplexityCheatSheet: React.FC<ComplexityCheatSheetProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d131f]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">DSA Big-O Complexity Reference</h2>
              <p className="text-xs text-slate-400">Time & Space complexities for Data Structures & Algorithms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Data Structures Table */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-cyan-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>Data Structures Operations</span>
            </div>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e293b] text-slate-300 font-medium">
                  <tr>
                    <th className="p-2.5">Data Structure</th>
                    <th className="p-2.5">Access</th>
                    <th className="p-2.5">Search</th>
                    <th className="p-2.5">Insertion</th>
                    <th className="p-2.5">Deletion</th>
                    <th className="p-2.5">Space</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#0f172a]/60">
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-white">std::vector / Array</td>
                    <td className="p-2.5 text-emerald-400">O(1)</td>
                    <td className="p-2.5 text-amber-400">O(N)</td>
                    <td className="p-2.5 text-emerald-400">O(1) amortized</td>
                    <td className="p-2.5 text-amber-400">O(N)</td>
                    <td className="p-2.5 text-blue-400">O(N)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-white">std::stack / std::queue</td>
                    <td className="p-2.5 text-emerald-400">O(1) top/front</td>
                    <td className="p-2.5 text-amber-400">O(N)</td>
                    <td className="p-2.5 text-emerald-400">O(1)</td>
                    <td className="p-2.5 text-emerald-400">O(1)</td>
                    <td className="p-2.5 text-blue-400">O(N)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-white">std::unordered_map / Hash Table</td>
                    <td className="p-2.5 text-slate-400">—</td>
                    <td className="p-2.5 text-emerald-400">O(1) avg (O(N) worst)</td>
                    <td className="p-2.5 text-emerald-400">O(1) avg</td>
                    <td className="p-2.5 text-emerald-400">O(1) avg</td>
                    <td className="p-2.5 text-blue-400">O(N)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-white">std::map / std::set (Red-Black)</td>
                    <td className="p-2.5 text-slate-400">—</td>
                    <td className="p-2.5 text-cyan-400">O(log N)</td>
                    <td className="p-2.5 text-cyan-400">O(log N)</td>
                    <td className="p-2.5 text-cyan-400">O(log N)</td>
                    <td className="p-2.5 text-blue-400">O(N)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-white">std::priority_queue (Binary Heap)</td>
                    <td className="p-2.5 text-emerald-400">O(1) top</td>
                    <td className="p-2.5 text-amber-400">O(N)</td>
                    <td className="p-2.5 text-cyan-400">O(log N)</td>
                    <td className="p-2.5 text-cyan-400">O(log N)</td>
                    <td className="p-2.5 text-blue-400">O(N)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-white">Trie (Prefix Tree)</td>
                    <td className="p-2.5 text-slate-400">—</td>
                    <td className="p-2.5 text-emerald-400">O(L) string len</td>
                    <td className="p-2.5 text-emerald-400">O(L)</td>
                    <td className="p-2.5 text-emerald-400">O(L)</td>
                    <td className="p-2.5 text-blue-400">O(ALPHABET * L)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sorting & Graph Algorithms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-yellow-400 font-semibold">
                <ArrowUpDown className="w-4 h-4" />
                <span>Sorting Algorithms</span>
              </div>
              <div className="border border-slate-800 rounded-lg overflow-hidden text-xs bg-[#0f172a]/60 p-3 space-y-2">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="font-semibold text-white">std::sort (Introsort)</span>
                  <span className="text-emerald-400">O(N log N) / O(log N) space</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="font-semibold text-white">Merge Sort</span>
                  <span className="text-emerald-400">O(N log N) / O(N) space</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="font-semibold text-white">Quick Sort</span>
                  <span className="text-cyan-400">O(N log N) avg / O(N²) worst</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Counting / Radix Sort</span>
                  <span className="text-emerald-400">O(N + K) / O(N + K) space</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-purple-400 font-semibold">
                <Network className="w-4 h-4" />
                <span>Graph Algorithms</span>
              </div>
              <div className="border border-slate-800 rounded-lg overflow-hidden text-xs bg-[#0f172a]/60 p-3 space-y-2">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="font-semibold text-white">BFS / DFS Traversal</span>
                  <span className="text-emerald-400">O(V + E) / O(V) space</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="font-semibold text-white">Dijkstra Shortest Path</span>
                  <span className="text-emerald-400">O((V + E) log V)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="font-semibold text-white">Kruskal MST (DSU)</span>
                  <span className="text-emerald-400">O(E log E) ≈ O(E log V)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Floyd-Warshall (All pairs)</span>
                  <span className="text-amber-400">O(V³) / O(V²) space</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0d131f] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
