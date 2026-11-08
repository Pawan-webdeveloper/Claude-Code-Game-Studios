/**
 * DOM heads-up display: Atlas counter, region name, discovery toasts, project cards (non-blocking),
 * ride indicator and the minimap.
 */
import type { RideId } from "../rides/rideLogic";
import type { LandmarkCard, LandmarkDef } from "../world/types";

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing #" + id);
  return el as T;
};

export class Hud {
  private readonly count = $("hud-count");
  private readonly region = $("hud-region");
  private readonly toastEl = $("toast");
  private readonly card = $("card");
  private readonly hint = $("hint");
  private toastTimer = 0;
  private hintTimer = 0;
  private lastRegion = "";

  constructor(onRide: (id: RideId) => void, onMute: () => boolean) {
    $("card-close").addEventListener("click", () => this.hideCard());
    document.querySelectorAll<HTMLButtonElement>("#rides button").forEach((b) =>
      b.addEventListener("click", () => onRide(b.dataset.ride as RideId)),
    );
    const mute = $("mute");
    mute.addEventListener("click", () => {
      mute.textContent = onMute() ? "🔇" : "🔊";
    });
    $("help").addEventListener("click", () => document.body.classList.toggle("show-help"));
  }

  /** Updates the "Atlas n / total" counter. */
  setCount(n: number, total: number): void {
    this.count.textContent = `${n} / ${total}`;
  }

  /** Shows the region name when it changes. */
  setRegion(name: string): void {
    if (name === this.lastRegion) return;
    this.lastRegion = name;
    this.region.textContent = name;
    this.region.classList.remove("flash");
    void this.region.offsetWidth;
    this.region.classList.add("flash");
  }

  /** Highlights the active ride and greys out rides still loading. */
  setRide(active: RideId, loaded: ReadonlySet<RideId>): void {
    document.querySelectorAll<HTMLButtonElement>("#rides button").forEach((b) => {
      const id = b.dataset.ride as RideId;
      b.classList.toggle("active", id === active);
      b.disabled = !loaded.has(id);
    });
  }

  /** A short toast for a discovery or event; clicking it reopens the card if there is one. */
  toast(title: string, line: string, ms = 4200, onClick?: () => void): void {
    this.toastEl.innerHTML = "";
    const h = document.createElement("strong");
    h.textContent = title;
    const p = document.createElement("span");
    p.textContent = line;
    this.toastEl.append(h, p);
    this.toastEl.onclick = onClick ?? null;
    this.toastEl.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove("show"), ms);
  }

  /** Shows a one-off control hint. */
  showHint(text: string, ms = 5000): void {
    this.hint.textContent = text;
    this.hint.classList.add("show");
    clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => this.hint.classList.remove("show"), ms);
  }

  /** Opens the side card for a landmark (does not pause the game). */
  showCard(def: LandmarkDef, card: LandmarkCard): void {
    $("card-region").textContent = def.name;
    $("card-title").textContent = card.title;
    $("card-subtitle").textContent = card.subtitle;
    $("card-body").textContent = card.body;
    const link = $<HTMLAnchorElement>("card-link");
    if (card.link) {
      link.href = card.link;
      link.textContent = (card.linkLabel ?? "Open") + " ↗";
      link.hidden = false;
    } else link.hidden = true;
    this.card.classList.toggle("project", !!def.project);
    this.card.classList.add("show");
  }

  /** Closes the side card. */
  hideCard(): void {
    this.card.classList.remove("show");
  }
}

export interface MinimapPoint {
  x: number;
  z: number;
  kind: "project" | "pawan" | "other";
  found: boolean;
}

/** North-up minimap drawn from a pre-rendered terrain image plus live markers. */
export class Minimap {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly base: HTMLCanvasElement;
  visible = true;

  /**
   * @param canvas target canvas
   * @param extent half-size of the mapped square in world units
   * @param colorAt colour sampler (CSS colour) for a world point
   */
  constructor(private readonly canvas: HTMLCanvasElement, private readonly extent: number, colorAt: (x: number, z: number) => string) {
    this.ctx = canvas.getContext("2d")!;
    const N = 120;
    this.base = document.createElement("canvas");
    this.base.width = this.base.height = N;
    const b = this.base.getContext("2d")!;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        b.fillStyle = colorAt(((i + 0.5) / N * 2 - 1) * extent, ((j + 0.5) / N * 2 - 1) * extent);
        b.fillRect(i, j, 1, 1);
      }
  }

  /** Toggles visibility. */
  toggle(): void {
    this.visible = !this.visible;
    this.canvas.style.display = this.visible ? "block" : "none";
  }

  /** Redraws markers and the player arrow. */
  draw(px: number, pz: number, heading: number, points: readonly MinimapPoint[]): void {
    if (!this.visible) return;
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    const toX = (x: number) => (x / this.extent * 0.5 + 0.5) * W;
    const toY = (z: number) => (z / this.extent * 0.5 + 0.5) * H;
    c.imageSmoothingEnabled = false;
    c.drawImage(this.base, 0, 0, W, H);
    for (const p of points) {
      c.beginPath();
      c.arc(toX(p.x), toY(p.z), p.kind === "project" ? 4.5 : 3, 0, Math.PI * 2);
      c.fillStyle = p.found ? "#ffffff" : p.kind === "project" ? "#f2c94c" : p.kind === "pawan" ? "#e2733c" : "#8a8270";
      c.fill();
      c.lineWidth = 1.2;
      c.strokeStyle = "#1f1d2b";
      c.stroke();
    }
    c.save();
    c.translate(toX(px), toY(pz));
    c.rotate(-heading + Math.PI);
    c.beginPath();
    c.moveTo(0, -8); c.lineTo(5, 6); c.lineTo(0, 3); c.lineTo(-5, 6); c.closePath();
    c.fillStyle = "#d6453a";
    c.fill();
    c.strokeStyle = "#1f1d2b";
    c.stroke();
    c.restore();
  }
}
