// src/lib/streamStudio/streamStateMachine.ts

export type StreamState =
  | "idle"
  | "previewing"
  | "connecting"
  | "live"
  | "error";

type StreamContext = {
  previewStream: MediaStream | null;
  liveRoom?: any;
};

export class StreamStudioController {
  state: StreamState = "idle";
  ctx: StreamContext = { previewStream: null };

  listeners = new Set<(s: StreamState) => void>();

  subscribe(fn: (s: StreamState) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private setState(next: StreamState) {
    this.state = next;
    this.listeners.forEach((l) => l(next));
  }

  async startPreview(opts: {
    cameraId?: string;
    micId?: string;
    videoEl: HTMLVideoElement;
  }) {
    if (this.state !== "idle") return;

    this.setState("previewing");

    try {
      const { startPreview } = await import("./startPreview");
      const res = await startPreview(opts);
      this.ctx.previewStream = res.stream;
    } catch (e) {
      this.setState("error");
      throw e;
    }
  }

  async goLive(opts: {
    room: string;
    token: string;
    publish: (stream: MediaStream) => Promise<any>;
  }) {
    if (this.state !== "previewing" || !this.ctx.previewStream) {
      throw new Error("Preview not ready");
    }

    this.setState("connecting");

    try {
      this.ctx.liveRoom = await opts.publish(this.ctx.previewStream);
      this.setState("live");
    } catch (e) {
      this.setState("previewing");
      throw e;
    }
  }

  stopPreview() {
    if (this.ctx.previewStream) {
      this.ctx.previewStream.getTracks().forEach((t) => t.stop());
    }
    this.ctx.previewStream = null;
    this.setState("idle");
  }

  stopLive() {
    if (this.ctx.liveRoom?.disconnect) {
      this.ctx.liveRoom.disconnect();
    }
    this.ctx.liveRoom = undefined;
    this.stopPreview();
  }
}
