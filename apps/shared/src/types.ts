export interface PlaybackContent {
  id: string;
  m4a_file_url: string;
}

export interface Topic {
  id: string;
  title: string;
  context: string;
  sender?: string;
  timestamp: string;
  playback_content?: PlaybackContent;
}

export interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  togglePlay: () => void;
  toggleMute: () => void;
  playTopic: (topic: Topic) => void;
  currentTopic: Topic | null;
  seekBy: (seconds: number) => void;
  initAudio?: () => void;
}
