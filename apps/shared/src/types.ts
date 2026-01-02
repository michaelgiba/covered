export interface Topic {
  id: string;
  title: string;
  context: string;
  sender?: string;
  timestamp: string;
  playback_content_id?: string;
}
