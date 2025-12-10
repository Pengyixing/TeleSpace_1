import React from 'react';
import { SimulationConfig } from '../types';
import { Icon } from '../components/Icon';

interface SimulationViewProps {
  config: SimulationConfig;
  onUpdateConfig: (key: keyof SimulationConfig, value: any) => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ config, onUpdateConfig }) => {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="box" className="w-8 h-8 text-orange-500" />
            MuJoCo Simulation Core
          </h2>
          <p className="text-gray-400 mt-1">Manage physics environments and virtual robotics.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onUpdateConfig('isRunning', !config.isRunning)}
            className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              config.isRunning 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50' 
                : 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border border-green-500/50'
            }`}
          >
            {config.isRunning ? <Icon name="stop" /> : <Icon name="play" />}
            {config.isRunning ? 'Stop Engine' : 'Start Engine'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Environment Selector */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 backdrop-blur-sm overflow-y-auto">
          <h3 className="text-gray-200 font-semibold mb-4 text-sm uppercase tracking-wide">Environment</h3>
          <div className="space-y-3">
            {['Tabletop (Sphere Task)', 'Bin Picking', 'Empty Room', 'Calibration Grid'].map((env) => (
              <div 
                key={env}
                onClick={() => onUpdateConfig('environmentId', env)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  config.environmentId === env 
                    ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg' 
                    : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium">{env}</div>
                <div className="text-xs opacity-70 mt-1">Standard MuJoCo scene with physics properties.</div>
              </div>
            ))}
          </div>
        </div>

        {/* Robot Selector */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 backdrop-blur-sm overflow-y-auto">
          <h3 className="text-gray-200 font-semibold mb-4 text-sm uppercase tracking-wide">Robot Model</h3>
          <div className="space-y-3">
            {['ALOHA (Dual Arm)', 'Unitree Z1', 'UR5e', 'Franka Emika'].map((robot) => (
              <div 
                key={robot}
                onClick={() => onUpdateConfig('robotModelId', robot)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  config.robotModelId === robot 
                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg' 
                    : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium">{robot}</div>
                <div className="text-xs opacity-70 mt-1">Includes 6DOF kinematics and gripper definition.</div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview / Status Placeholder */}
        <div className="bg-black border border-gray-700 rounded-xl p-1 flex flex-col">
           <div className="bg-gray-900 flex-1 rounded-lg flex items-center justify-center relative overflow-hidden">
              {config.isRunning ? (
                <div className="text-center">
                  <div className="inline-block animate-pulse mb-4">
                    <Icon name="box" className="w-16 h-16 text-orange-500 opacity-50" />
                  </div>
                  <p className="text-green-400 font-mono text-sm">Physics Running: 60Hz</p>
                  <p className="text-gray-500 text-xs mt-2">Streaming Transforms to VisionPro...</p>
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  <Icon name="box" className="w-16 h-16 mx-auto mb-2 opacity-20" />
                  <p>Simulation Paused</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};