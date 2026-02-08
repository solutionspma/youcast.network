import { OverlayLayer } from "./types";

type Listener = (layers: OverlayLayer[]) => void;

export class OverlayEngine {
  private layers: OverlayLayer[] = [];
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  setLayer(layer: OverlayLayer) {
    this.layers = [
      ...this.layers.filter(l => l.id !== layer.id),
      layer,
    ].sort((a, b) => a.zIndex - b.zIndex);

    this.emit();
  }

  removeLayer(id: string) {
    this.layers = this.layers.filter(l => l.id !== id);
    this.emit();
  }

  toggle(id: string, enabled: boolean) {
    this.layers = this.layers.map(l =>
      l.id === id ? { ...l, enabled } : l
    );
    this.emit();
  }

  getLayers() {
    return this.layers.filter(l => l.enabled);
  }

  getAllLayers() {
    return this.layers;
  }

  private emit() {
    this.listeners.forEach(l => l(this.layers));
  }
}
