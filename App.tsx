
import React, { useState, useEffect } from 'react';
import { ConnectionStatus, AppView, SystemLog, VisionProConfig, SimulationConfig, StreamSource } from './types';
import { Icon } from './components/Icon';
import { StatusBadge } from './components/StatusBadge';
import { ConsolePanel } from './components/ConsolePanel';
import { ConnectionView } from './views/ConnectionView';
import { SimulationView } from './views/SimulationView';
import { StreamsView } from './views/StreamsView';

const App: React.FC = () => {
  // --- Global State ---
  const [currentView, setCurrentView] = useState<AppView>(AppView.CONNECTION);
  
  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [visionProConfig, setVisionProConfig] = useState<VisionProConfig>({
    ipAddress: '',
    port: 50051,
    isConnected: false,
    latencyMs: 0,
  });

  // Simulation State
  const [simConfig, setSimConfig] = useState<SimulationConfig>({
    environmentId: 'Tabletop (Sphere Task)',
    robotModelId: 'ALOHA (Dual Arm)',
    isRunning: false,
  });

  // Streams State
  const [streams, setStreams] = useState<StreamSource[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  // Logs
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // --- Helpers ---
  const addLog = (level: SystemLog['level'], source: SystemLog['source'], message: string) => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      source,
      message,
    };
    setLogs(prev => [...prev.slice(-99), newLog]);
  };

  // --- Handlers ---
  const handleConnect = (ip: string) => {
    setVisionProConfig(prev => ({ ...prev, ipAddress: ip }));
    setConnectionStatus(ConnectionStatus.CONNECTING);
    
    // Simulate complex handshake sequence
    addLog('INFO', 'NETWORK', `Resolving host ${ip}...`);
    
    setTimeout(() => {
      addLog('INFO', 'NETWORK', `gRPC Channel created on port 50051. Sending HANDSHAKE_SYN...`);
    }, 600);

    setTimeout(() => {
      addLog('SUCCESS', 'NETWORK', `Received HANDSHAKE_ACK. Protocol: v1.2.`);
      addLog('INFO', 'NETWORK', `Initializing WebRTC PeerConnection...`);
    }, 1500);

    setTimeout(() => {
      addLog('INFO', 'NETWORK', `ICE Gathering Complete. 4 Candidates found.`);
      addLog('INFO', 'NETWORK', `DTLS Handshake successful.`);
    }, 2200);

    setTimeout(() => {
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setVisionProConfig(prev => ({ ...prev, isConnected: true, latencyMs: 18 }));
      addLog('SUCCESS', 'NETWORK', 'Session Established. Media/Data Channels Active.');
      addLog('INFO', 'VISION_PRO', 'Telemetry received: Battery 85%, Spatial Mode: Active.');
      setCurrentView(AppView.DASHBOARD);
    }, 3000);
  };

  const handleDisconnect = () => {
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setVisionProConfig(prev => ({ ...prev, isConnected: false, latencyMs: 0 }));
    addLog('WARN', 'NETWORK', 'Session terminated by user.');
  };

  const handleSimConfigUpdate = (key: keyof SimulationConfig, value: any) => {
    setSimConfig(prev => ({ ...prev, [key]: value }));
    if (key === 'isRunning') {
      if (value) addLog('INFO', 'SIMULATION', `Physics engine started. Env: ${simConfig.environmentId}`);
      else addLog('WARN', 'SIMULATION', 'Physics engine paused.');
    }
    if (key === 'environmentId') addLog('INFO', 'SIMULATION', `Environment changed to ${value}`);
    if (key === 'robotModelId') addLog('INFO', 'SIMULATION', `Robot model loaded: ${value}`);
  };

  // --- Stream Handlers ---
  const handleAddWebcam = async () => {
    try {
      addLog('INFO', 'SYSTEM', 'Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const newSource: StreamSource = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Local Camera ${streams.length + 1}`,
        type: 'WEBCAM',
        url: 'local',
        active: true,
        rawStream: stream
      };
      setStreams(prev => [...prev, newSource]);
      setActiveSourceId(newSource.id);
      addLog('SUCCESS', 'SYSTEM', 'Camera added to source list.');
    } catch (err) {
      addLog('ERROR', 'SYSTEM', 'Failed to access camera. Permission denied?');
    }
  };

  const handleAddScreenShare = async () => {
    try {
      addLog('INFO', 'SYSTEM', 'Requesting screen capture...');
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const newSource: StreamSource = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Screen Share ${streams.length + 1}`,
        type: 'SCREEN',
        url: 'local',
        active: true,
        rawStream: stream
      };
      setStreams(prev => [...prev, newSource]);
      setActiveSourceId(newSource.id);
      addLog('SUCCESS', 'SYSTEM', 'Screen capture active.');
      
      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        handleRemoveSource(newSource.id);
        addLog('WARN', 'SYSTEM', 'Screen share stopped by user.');
      };

    } catch (err) {
      addLog('ERROR', 'SYSTEM', 'Failed to capture screen.');
    }
  };

  const handleRemoveSource = (id: string) => {
    setStreams(prev => {
      const target = prev.find(s => s.id === id);
      if (target?.rawStream) {
        target.rawStream.getTracks().forEach(track => track.stop());
      }
      return prev.filter(s => s.id !== id);
    });
    if (activeSourceId === id) {
      setActiveSourceId(null);
    }
  };

  // --- Render ---
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 border-r border-gray-800 flex flex-col bg-gray-900/50 backdrop-blur">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <span className="font-bold text-white">T</span>
          </div>
          <span className="font-bold text-lg hidden lg:block tracking-tight text-gray-100">TeleSpace</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: AppView.CONNECTION, label: 'Connection', icon: 'link' },
            { id: AppView.DASHBOARD, label: 'Dashboard', icon: 'activity' },
            { id: AppView.STREAMS, label: 'Ext. Streams', icon: 'video' },
            { id: AppView.SIMULATION, label: 'Simulation', icon: 'box' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as AppView)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                currentView === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`}
            >
              <Icon name={item.icon as any} className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-blue-400' : 'text-gray-500'}`} />
              <span className="hidden lg:block font-medium text-sm">{item.label}</span>
              {item.id === AppView.CONNECTION && connectionStatus === ConnectionStatus.CONNECTED && (
                <span className="hidden lg:block w-2 h-2 rounded-full bg-green-500 ml-auto shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 transition-all">
            <Icon name="settings" className="w-5 h-5" />
            <span className="hidden lg:block font-medium text-sm">System Config</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-900/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">
              {currentView === AppView.DASHBOARD && 'Mission Control'}
              {currentView === AppView.CONNECTION && 'Establish Link'}
              {currentView === AppView.SIMULATION && 'Simulation Orchestrator'}
              {currentView === AppView.STREAMS && 'Stream Aggregation'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-mono">VISION_PRO_TARGET</span>
                <StatusBadge status={connectionStatus} />
             </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-950 to-gray-900">
          {currentView === AppView.CONNECTION && (
            <ConnectionView 
              config={visionProConfig} 
              status={connectionStatus} 
              onConnect={handleConnect} 
              onDisconnect={handleDisconnect} 
            />
          )}
          
          {currentView === AppView.SIMULATION && (
            <SimulationView config={simConfig} onUpdateConfig={handleSimConfigUpdate} />
          )}

          {currentView === AppView.STREAMS && (
            <StreamsView 
              sources={streams} 
              activeSourceId={activeSourceId}
              onAddWebcam={handleAddWebcam}
              onAddScreenShare={handleAddScreenShare}
              onSelectSource={setActiveSourceId}
              onRemoveSource={handleRemoveSource}
            />
          )}

          {currentView === AppView.DASHBOARD && (
             <div className="p-8 text-center mt-20">
                <div className="inline-block p-6 rounded-full bg-gray-800/50 mb-6">
                   <Icon name="activity" className="w-16 h-16 text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Ready for Operations</h2>
                <p className="text-gray-400 max-w-lg mx-auto mb-8">
                  TeleSpace Hub is active. 
                  <br />
                  <span className="text-blue-400">{streams.length} Video Sources Active</span>
                  <span className="mx-2">•</span>
                  <span className={visionProConfig.isConnected ? "text-green-400" : "text-gray-500"}>
                    {visionProConfig.isConnected ? "VisionPro Linked" : "VisionPro Offline"}
                  </span>
                </p>
                <div className="flex justify-center gap-4">
                   <button onClick={() => setCurrentView(AppView.SIMULATION)} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-2 rounded-lg text-white font-medium transition-all">
                      Go to Simulation
                   </button>
                   <button onClick={() => setCurrentView(AppView.STREAMS)} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-2 rounded-lg text-white font-medium transition-all">
                      Manage Streams
                   </button>
                </div>
             </div>
          )}
        </div>

        {/* Console Log Panel */}
        <ConsolePanel logs={logs} />
      </main>
    </div>
  );
};

export default App;
