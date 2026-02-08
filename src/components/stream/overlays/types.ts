export type OverlayType =
  | "lower-third"
  | "logo"
  | "image"
  | "chroma";

export type OverlayLayer = {
  id: string;
  type: OverlayType;
  zIndex: number;
  enabled: boolean;
  data: any;
};

export type Scene = {
  id: string;
  name: string;
  cameraId?: string;
  overlayIds: string[]; // References to overlay layers
  isActive: boolean;
};

export type Destination = {
  id: string;
  name: string;
  platform: 'youtube' | 'twitch' | 'facebook' | 'linkedin' | 'custom';
  rtmpUrl?: string;
  streamKey?: string;
  enabled: boolean;
  status?: 'idle' | 'connecting' | 'streaming' | 'error';
};
