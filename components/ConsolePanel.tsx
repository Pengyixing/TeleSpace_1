import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';

interface ConsolePanelProps {
  logs: SystemLog[];
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-48 border-t border-gray-800 bg-black/50 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System Console</span>
        <span className="text-xs text-gray-600">{logs.length} messages</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 hover:bg-white/5 p-1 rounded transition-colors">
            <span className="text-gray-500 shrink-0 select-none">[{log.timestamp}]</span>
            <span className={`shrink-0 font-bold w-16 ${
              log.level === 'ERROR' ? 'text-red-500' :
              log.level === 'WARN' ? 'text-yellow-500' :
              log.level === 'SUCCESS' ? 'text-green-500' : 'text-blue-400'
            }`}>
              {log.level}
            </span>
            <span className="text-gray-400 shrink-0 w-24">[{log.source}]</span>
            <span className="text-gray-300 break-all">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-600 italic px-2">System initialized. Waiting for events...</div>
        )}
      </div>
    </div>
  );
};