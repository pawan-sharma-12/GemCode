import React, { useState } from 'react';
import { X, FileSpreadsheet, Link as LinkIcon, Download, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ProblemList, SheetProblem } from '../types/dsa';

interface ImportListModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProblems: SheetProblem[];
  onImportList: (newList: ProblemList, newProblems?: SheetProblem[]) => void;
}

export const ImportListModal: React.FC<ImportListModalProps> = ({
  isOpen,
  onClose,
  allProblems,
  onImportList,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'urls' | 'json'>('sheet');
  const [listName, setListName] = useState('');
  const [sheetUrl, setSheetUrl] = useState(
    'https://docs.google.com/spreadsheets/d/1_tl0rSDcv-yTEqtvF97OXt_uMVLjaJJ_H8fkAP5-BiE/edit?gid=663324863#gid=663324863'
  );
  const [urlBatchText, setUrlBatchText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleImportSheet = async () => {
    if (!sheetUrl.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/fetch-sheet-csv?url=${encodeURIComponent(sheetUrl.trim())}`);
      if (!res.ok) {
        throw new Error('Failed to fetch spreadsheet. Make sure sharing is set to Anyone with the link can view.');
      }
      const csvText = await res.text();
      const lines = csvText.split(/\r?\n/);
      if (lines.length <= 1) {
        throw new Error('Spreadsheet returned empty or invalid CSV data.');
      }

      const matchedIds: string[] = [];
      const newCustomProblems: SheetProblem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Basic CSV split
        const parts = line.split(',');
        const qName = parts[0]?.replace(/^"|"$/g, '').trim();
        const lcLink = parts[1]?.replace(/^"|"$/g, '').trim() || '';
        const topic = parts[3]?.replace(/^"|"$/g, '').trim() || 'General';
        const notes = parts[4]?.replace(/^"|"$/g, '').trim() || '';

        if (!qName) continue;

        // Try to match existing problem in master sheet
        const existing = allProblems.find(
          (p) =>
            p.title.toLowerCase() === qName.toLowerCase() ||
            (lcLink && p.leetcodeUrl && p.leetcodeUrl.toLowerCase().includes(lcLink.toLowerCase()))
        );

        if (existing) {
          matchedIds.push(existing.id);
        } else {
          // Create custom sheet problem entry
          const slug = qName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const newProb: SheetProblem = {
            id: `custom-sheet-${Date.now()}-${i}`,
            title: qName,
            slug: slug,
            leetcodeUrl: lcLink.startsWith('http') ? lcLink : (slug ? `https://leetcode.com/problems/${slug}/` : ''),
            topic: topic,
            category: topic.split(/[\/\&]/)[0].trim() || 'Custom',
            notes: notes,
            sheetStatus: 'Unsolved',
          };
          newCustomProblems.push(newProb);
          matchedIds.push(newProb.id);
        }
      }

      const finalName = listName.trim() || 'Imported Google Sheet (' + matchedIds.length + ' Qs)';
      const newList: ProblemList = {
        id: `imported-sheet-${Date.now()}`,
        name: finalName,
        description: `Imported from Google Sheet: ${matchedIds.length} problems`,
        isBuiltIn: false,
        color: '#10B981',
        icon: 'FileSpreadsheet',
        problemIds: matchedIds,
        createdAt: Date.now(),
      };

      onImportList(newList, newCustomProblems);
      setSuccessMsg(`Successfully imported ${matchedIds.length} problems!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportUrlBatch = () => {
    if (!urlBatchText.trim()) return;
    setErrorMsg('');

    const lines = urlBatchText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const matchedIds: string[] = [];
    const newCustomProblems: SheetProblem[] = [];

    lines.forEach((line, idx) => {
      let slug = '';
      if (line.includes('leetcode.com/problems/')) {
        const match = line.match(/problems\/([a-zA-Z0-9_-]+)/);
        if (match) slug = match[1];
      } else {
        slug = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }

      const existing = allProblems.find((p) => p.slug === slug || p.title.toLowerCase() === line.toLowerCase());
      if (existing) {
        matchedIds.push(existing.id);
      } else {
        const titleFormatted = slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        const newProb: SheetProblem = {
          id: `custom-url-${Date.now()}-${idx}`,
          title: titleFormatted,
          slug: slug,
          leetcodeUrl: line.startsWith('http') ? line : `https://leetcode.com/problems/${slug}/`,
          topic: 'Custom',
          category: 'Custom',
          sheetStatus: 'Unsolved',
        };
        newCustomProblems.push(newProb);
        matchedIds.push(newProb.id);
      }
    });

    if (matchedIds.length === 0) {
      setErrorMsg('No valid URLs or problem names detected.');
      return;
    }

    const newList: ProblemList = {
      id: `imported-urls-${Date.now()}`,
      name: listName.trim() || `URL Batch (${matchedIds.length} Qs)`,
      description: `Custom batch list with ${matchedIds.length} problems`,
      isBuiltIn: false,
      color: '#8B5CF6',
      icon: 'Link',
      problemIds: matchedIds,
      createdAt: Date.now(),
    };

    onImportList(newList, newCustomProblems);
    setSuccessMsg(`Imported ${matchedIds.length} problems!`);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e1626] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0f1d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Import Problem List</h2>
              <p className="text-[11px] text-slate-400">Import from Google Sheets, LeetCode URLs, or JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-[#0b101c] text-xs font-medium">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'sheet'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheet URL</span>
          </button>
          <button
            onClick={() => setActiveTab('urls')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'urls'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>LeetCode URLs / Slugs</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom List Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., SDE Sheet Import, 30-Day LeetCode Challenge"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {activeTab === 'sheet' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Google Sheet URL
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                💡 Automatically extracts Question Name, LeetCode link, Topic, and Notes columns from public Google Sheets.
              </p>
            </div>
          )}

          {activeTab === 'urls' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Paste LeetCode URLs or Problem Slugs (One per line)
                </label>
                <textarea
                  rows={5}
                  placeholder={`https://leetcode.com/problems/two-sum/\nhttps://leetcode.com/problems/trapping-rain-water/\nhttps://leetcode.com/problems/course-schedule/\nmerge-k-sorted-lists`}
                  value={urlBatchText}
                  onChange={(e) => setUrlBatchText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={activeTab === 'sheet' ? handleImportSheet : handleImportUrlBatch}
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Start Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
