
import React, { useState, useRef, useEffect } from 'react';
import { StreamSource } from '../types';
import { Icon } from '../components/Icon';

interface StreamsViewProps {
  sources: StreamSource[];
  activeSourceId: string | null;
  onAddWebcam: () => void;
  onAddScreenShare: () => void;
  onSelectSource: (id: string) => void;
  onRemoveSource: (id: string) => void;
}

export const StreamsView: React.FC<StreamsViewProps> = ({ 
  sources, 
  activeSourceId, 
  onAddWebcam, 
  onAddScreenShare, 
  onSelectSource,
  onRemoveSource
}) => {
  const [rtspUrl, setRtspUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeSource = sources.find(s => s.id === activeSourceId);

  // Handle video stream attachment
  useEffect(() => {
    if (videoRef.current) {
      if (activeSource?.rawStream) {
        videoRef.current.srcObject = activeSource.rawStream;
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [activeSource]);

  return (
    <div className="p-8 h-full flex flex-col">
       <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="video" className="w-8 h-8 text-pink-500" />
            External Streams
          </h2>
          <p className="text-gray-400 mt-1">Manage incoming 2D/3D video feeds for VisionPro projection.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column: Controls & List */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
          
          {/* Quick Actions */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 backdrop-blur-sm shrink-0">
            <h3 className="text-sm font-semibold text-gray-200 mb-4 uppercase tracking-wide">Input Sources</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onAddWebcam}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg text-sm font-medium transition-colors border border-gray-600 hover:border-gray-500"
              >
                <Icon name="video" className="w-4 h-4" />
                Add Camera
              </button>
              <button 
                onClick={onAddScreenShare}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg text-sm font-medium transition-colors border border-gray-600 hover:border-gray-500"
              >
                <Icon name="monitor" className="w-4 h-4" />
                Share Screen
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
               <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="rtsp://192.168.1.50:554/live" 
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button className="bg-pink-600/20 text-pink-500 border border-pink-500/50 hover:bg-pink-600/30 px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                  RTSP
                </button>
              </div>
            </div>
          </div>

          {/* Active Sources List */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 backdrop-blur-sm flex-1 flex flex-col min-h-0">
             <h3 className="text-sm font-semibold text-gray-200 mb-4 uppercase tracking-wide shrink-0">Active Feeds ({sources.length})</h3>
             <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {sources.map(source => (
                  <div 
                    key={source.id} 
                    onClick={() => onSelectSource(source.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      activeSourceId === source.id
                        ? 'bg-pink-500/10 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
                        : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`shrink-0 w-2 h-2 rounded-full ${source.active ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                      <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${activeSourceId === source.id ? 'text-pink-100' : 'text-gray-300'}`}>
                          {source.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate max-w-[140px]">
                          {source.type} • {source.active ? 'LIVE' : 'OFFLINE'}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveSource(source.id); }}
                      className="shrink-0 p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                {sources.length === 0 && (
                  <div className="text-gray-500 text-center py-8 text-sm italic border-2 border-dashed border-gray-800 rounded-lg">
                    No sources active.<br/>Add a camera or screen share.
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Column: Central Preview */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-black border border-gray-800 rounded-xl flex-1 flex flex-col relative overflow-hidden group shadow-2xl">
              {/* Header Overlay */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSource ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${activeSource ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                  </span>
                  <span className="font-mono text-xs text-gray-300 font-bold tracking-wider">
                    {activeSource ? 'TRANSMITTING' : 'NO SIGNAL'}
                  </span>
                </div>
                {activeSource && (
                  <div className="px-3 py-1 bg-gray-900/80 backdrop-blur rounded border border-gray-700 text-xs text-gray-300 font-mono">
                    {activeSource.name}
                  </div>
                )}
              </div>

              {/* Video Area */}
              <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] relative">
                  {activeSource?.rawStream ? (
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-12">
                      <div className="inline-block p-6 rounded-full bg-gray-900 mb-4 border border-gray-800">
                        <Icon name="monitor" className="w-12 h-12 text-gray-700" />
                      </div>
                      <p className="text-gray-500 font-medium">No Source Selected</p>
                      <p className="text-gray-600 text-sm mt-2">Select a source from the list to preview</p>
                    </div>
                  )}
              </div>

              {/* Footer Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                 <div className="text-xs text-gray-400 font-mono">
                   {activeSource ? `RES: ${activeSource.rawStream?.getVideoTracks()[0]?.getSettings().width || 'AUTO'}x${activeSource.rawStream?.getVideoTracks()[0]?.getSettings().height || 'AUTO'} @ 30FPS` : '--'}
                 </div>
              </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center px-2">
            <p className="text-xs text-gray-500">
              <span className="text-pink-500 font-bold">NOTE:</span> This stream will be forwarded to VisionPro via WebRTC data channel #1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
