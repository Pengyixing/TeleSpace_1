
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CONNECTION = 'CONNECTION',
  STREAMS = 'STREAMS',
  SIMULATION = 'SIMULATION',
  SETTINGS = 'SETTINGS',
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  source: 'SYSTEM' | 'NETWORK' | 'SIMULATION' | 'VISION_PRO';
}

export interface VisionProConfig {
  ipAddress: string;
  port: number;
  isConnected: boolean;
  latencyMs: number;
}

export interface StreamSource {
  id: string;
  name: string;
  type: 'RTSP' | 'RTMP' | 'WEBCAM' | 'FILE' | 'SCREEN';
  url: string; // Used for display or RTSP URL
  active: boolean;
  rawStream?: MediaStream; // The actual browser MediaStream object
}

export interface SimulationConfig {
  environmentId: string;
  robotModelId: string;
  isRunning: boolean;
}
