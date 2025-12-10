import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusBadgeProps {
  status: ConnectionStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClass = '';
  let text = '';

  switch (status) {
    case ConnectionStatus.CONNECTED:
      colorClass = 'bg-green-500/10 text-green-500 border-green-500/20';
      text = 'Connected';
      break;
    case ConnectionStatus.CONNECTING:
      colorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      text = 'Connecting...';
      break;
    case ConnectionStatus.ERROR:
      colorClass = 'bg-red-500/10 text-red-500 border-red-500/20';
      text = 'Error';
      break;
    case ConnectionStatus.DISCONNECTED:
    default:
      colorClass = 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      text = 'Disconnected';
      break;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${colorClass} text-xs font-medium uppercase tracking-wider`}>
      <span className={`w-2 h-2 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse' : status === ConnectionStatus.CONNECTING ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
      {text}
    </div>
  );
};