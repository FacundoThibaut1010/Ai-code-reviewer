'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileCode, Plus, Minus } from 'lucide-react';

interface DiffLine {
  type: 'add' | 'delete' | 'info' | 'normal';
  content: string;
}

interface DiffFile {
  name: string;
  lines: DiffLine[];
}

interface DiffViewerProps {
  diffText: string;
}

export default function DiffViewer({ diffText }: DiffViewerProps) {
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});

  if (!diffText) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">No hay información del diff disponible.</p>
      </div>
    );
  }

  // Parse the raw diff text
  const parseDiff = (text: string): DiffFile[] => {
    const files: DiffFile[] = [];
    const lines = text.split('\n');
    let currentFile: DiffFile | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match git diff file headers: diff --git a/filepath b/filepath
      if (line.startsWith('diff --git')) {
        // Extract the filename from the end of the line (usually b/filename)
        const parts = line.split(' ');
        let fileName = 'unknown_file';
        for (const part of parts) {
          if (part.startsWith('b/')) {
            fileName = part.substring(2);
          }
        }
        currentFile = { name: fileName, lines: [] };
        files.push(currentFile);
        continue;
      }

      if (!currentFile) continue;

      // Skip the diff header metadata lines
      if (line.startsWith('index ') || line.startsWith('new file ') || line.startsWith('deleted file ')) {
        continue;
      }
      if (line.startsWith('--- a/') || line.startsWith('+++ b/')) {
        continue;
      }
      // Handle edge cases where files don't have standard headers
      if (line.startsWith('--- /dev/null') || line.startsWith('+++ /dev/null')) {
        continue;
      }

      if (line.startsWith('@@')) {
        currentFile.lines.push({ type: 'info', content: line });
      } else if (line.startsWith('+')) {
        currentFile.lines.push({ type: 'add', content: line });
      } else if (line.startsWith('-')) {
        currentFile.lines.push({ type: 'delete', content: line });
      } else {
        currentFile.lines.push({ type: 'normal', content: line });
      }
    }

    return files;
  };

  const files = parseDiff(diffText);

  const toggleCollapse = (fileName: string) => {
    setCollapsedFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  return (
    <div className="space-y-4">
      {files.map((file) => {
        const isCollapsed = collapsedFiles[file.name] || false;
        const additions = file.lines.filter((l) => l.type === 'add').length;
        const deletions = file.lines.filter((l) => l.type === 'delete').length;

        return (
          <div
            key={file.name}
            className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-md"
          >
            {/* Header del archivo */}
            <div
              onClick={() => toggleCollapse(file.name)}
              className="flex cursor-pointer items-center justify-between bg-slate-900/60 px-4 py-3 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
                <FileCode className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <span className="truncate font-mono text-sm font-semibold text-slate-200">
                  {file.name}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono">
                <span className="flex items-center text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded">
                  <Plus className="h-3 w-3 mr-0.5" />
                  {additions}
                </span>
                <span className="flex items-center text-rose-400 font-semibold bg-rose-950/40 px-2 py-0.5 rounded">
                  <Minus className="h-3 w-3 mr-0.5" />
                  {deletions}
                </span>
              </div>
            </div>

            {/* Contenido del diff */}
            {!isCollapsed && (
              <div className="overflow-x-auto bg-slate-950 font-mono text-xs leading-relaxed border-t border-slate-900">
                <table className="w-full border-collapse">
                  <tbody>
                    {file.lines.map((line, idx) => {
                      let lineClass = 'text-slate-400 hover:bg-slate-900/40';
                      let prefix = ' ';

                      if (line.type === 'add') {
                        lineClass = 'bg-emerald-950/20 text-emerald-400 border-l-2 border-emerald-500 hover:bg-emerald-950/30';
                        prefix = '+';
                      } else if (line.type === 'delete') {
                        lineClass = 'bg-rose-950/20 text-rose-400 border-l-2 border-rose-500 hover:bg-rose-950/30';
                        prefix = '-';
                      } else if (line.type === 'info') {
                        lineClass = 'bg-indigo-950/20 text-indigo-400/80 font-bold border-l-2 border-indigo-500/50 hover:bg-indigo-950/30';
                        prefix = 'i';
                      }

                      return (
                        <tr key={idx} className={`${lineClass} transition-colors`}>
                          {/* Número de línea (decorativo) */}
                          <td className="w-12 select-none text-right text-slate-600 px-2 border-r border-slate-900 py-0.5 text-[10px]">
                            {line.type === 'info' ? '@@' : idx + 1}
                          </td>
                          {/* Signo del diff */}
                          <td className="w-6 select-none text-center px-1 font-semibold py-0.5">
                            {prefix}
                          </td>
                          {/* Contenido del código */}
                          <td className="whitespace-pre px-4 py-0.5 font-mono">
                            {line.type === 'add' || line.type === 'delete'
                              ? line.content.substring(1)
                              : line.content}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
