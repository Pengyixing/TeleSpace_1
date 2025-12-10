import React, { useState } from 'react';
import { ConnectionStatus, VisionProConfig } from '../types';
import { Icon } from '../components/Icon';

interface ConnectionViewProps {
  config: VisionProConfig;
  status: ConnectionStatus;
  onConnect: (ip: string) => void;
  onDisconnect: () => void;
}

export const ConnectionView: React.FC<ConnectionViewProps> = ({ config, status, onConnect, onDisconnect }) => {
  const [ipInput, setIpInput] = useState(config.ipAddress);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
      onConnect(ipInput);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
        <Icon name="link" className="w-8 h-8 text-blue-500" />
        VisionPro Link
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Card: Connection Control */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-200">Connection Settings</h3>
            <div className={`w-3 h-3 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Device IP Address</label>
              <div className="relative">
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  disabled={status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING}
                  placeholder="192.168.1.xxx"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 font-mono"
                />
                <div className="absolute right-3 top-3 text-gray-500">
                  <Icon name="wifi" className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              {status === ConnectionStatus.CONNECTED ? (
                <button
                  type="button"
                  onClick={onDisconnect}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="stop" />
                  Disconnect Session
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === ConnectionStatus.CONNECTING}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    status === ConnectionStatus.CONNECTING
                      ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25'
                  }`}
                >
                  {status === ConnectionStatus.CONNECTING ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting to Bridge...
                    </>
                  ) : (
                    <>
                      <Icon name="activity" />
                      Initiate Handshake
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Card: Diagnostics */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Icon name="cpu" className="text-purple-400" />
            Link Diagnostics
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
              <span className="text-gray-400 text-sm">Protocol</span>
              <span className="text-purple-400 font-mono text-sm">gRPC + WebRTC</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
              <span className="text-gray-400 text-sm">Latency</span>
              <span className={`font-mono text-sm ${config.latencyMs < 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                {status === ConnectionStatus.CONNECTED ? `${config.latencyMs}ms` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
              <span className="text-gray-400 text-sm">Handshake Status</span>
              <span className="text-gray-200 text-sm">
                {status === ConnectionStatus.CONNECTED ? 'ACKNOWLEDGED' : 'WAITING'}
              </span>
            </div>
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 leading-relaxed">
                <strong className="block mb-1 text-blue-200">Phase 1 Status:</strong>
                Ensure VisionPro application is running and "Server Mode" is active before initiating connection. Default port: 50051.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};