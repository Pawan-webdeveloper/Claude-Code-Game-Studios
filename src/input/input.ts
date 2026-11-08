/**
 * Unified input: keyboard, mouse drag-look, and on-screen touch controls all write one InputState.
 */
import type { RideId } from "../rides/rideLogic";

export interface InputState {
  /** Steer: -1 left .. 1 right. */
  x: number;
  /** Forward/climb: -1 .. 1 (W / joystick up = +1). */
  y: number;
  boost: boolean;
  jump: boolean;
  /** Ride requested this frame (consumed by the game). */
  ride: RideId | null;
  /** Camera orbit offsets from drag-look (radians). */
  orbitYaw: number;
  orbitPitch: number;
  dragging: boolean;
  /** Minimap toggle requested this frame. */
  toggleMap: boolean;
}

export class Input {
  readonly state: InputState = {
    x: 0, y: 0, boost: false, jump: false, ride: null, orbitYaw: 0, orbitPitch: 0, dragging: false, toggleMap: false,
  };
  private readonly keys = new Set<string>();
  private stick = { x: 0, y: 0, active: false };
  private touchBoost = false;
  private touchJump = false;

  /** @param canvas element used for drag-look */
  constructor(canvas: HTMLElement) {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === "Digit1" || e.code === "KeyF") this.state.ride = "charizard";
      if (e.code === "Digit2") this.state.ride = "gengar";
      if (e.code === "Digit3") this.state.ride = "greninja";
      if (e.code === "KeyM") this.state.toggleMap = true;
      if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());

    let last: { x: number; y: number; id: number } | null = null;
    canvas.addEventListener("pointerdown", (e) => {
      last = { x: e.clientX, y: e.clientY, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
      this.state.dragging = true;
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!last || e.pointerId !== last.id) return;
      this.state.orbitYaw -= (e.clientX - last.x) * 0.006;
      this.state.orbitPitch = Math.max(-0.5, Math.min(0.9, this.state.orbitPitch + (e.clientY - last.y) * 0.004));
      last.x = e.clientX; last.y = e.clientY;
    });
    const end = (e: PointerEvent) => {
      if (last && e.pointerId === last.id) { last = null; this.state.dragging = false; }
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  /** Wires the on-screen joystick (#stick) and action buttons ([data-action]). */
  bindTouch(stick: HTMLElement, knob: HTMLElement, buttons: NodeListOf<HTMLElement>): void {
    let id = -1;
    const move = (e: PointerEvent) => {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2;
      let dx = (e.clientX - cx) / rad, dy = (e.clientY - cy) / rad;
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      this.stick = { x: dx, y: -dy, active: true };
      knob.style.transform = `translate(${dx * rad * 0.6}px, ${dy * rad * 0.6}px)`;
    };
    stick.addEventListener("pointerdown", (e) => { id = e.pointerId; stick.setPointerCapture(id); move(e); });
    stick.addEventListener("pointermove", (e) => { if (e.pointerId === id) move(e); });
    const release = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      this.stick = { x: 0, y: 0, active: false };
      knob.style.transform = "";
    };
    stick.addEventListener("pointerup", release);
    stick.addEventListener("pointercancel", release);

    buttons.forEach((b) => {
      const action = b.dataset.action;
      const set = (on: boolean) => {
        if (action === "boost") this.touchBoost = on;
        if (action === "jump") this.touchJump = on;
        b.classList.toggle("down", on);
      };
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        set(true);
        if (action === "fly") this.state.ride = "charizard";
        if (action === "land") this.state.ride = "gengar";
        if (action === "map") this.state.toggleMap = true;
      });
      b.addEventListener("pointerup", () => set(false));
      b.addEventListener("pointercancel", () => set(false));
      b.addEventListener("pointerleave", () => set(false));
    });
  }

  /** Refreshes analogue axes from held keys / joystick. Call once per frame before reading state. */
  poll(dt: number): void {
    const k = this.keys;
    let x = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    let y = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    if (this.stick.active) { x = this.stick.x; y = this.stick.y; }
    this.state.x = x;
    this.state.y = y;
    this.state.boost = k.has("ShiftLeft") || k.has("ShiftRight") || this.touchBoost;
    this.state.jump = k.has("Space") || this.touchJump;
    if (!this.state.dragging) {
      const d = Math.min(1, dt * 1.8);
      this.state.orbitYaw -= this.state.orbitYaw * d;
      this.state.orbitPitch -= this.state.orbitPitch * d;
    }
  }

  /** Clears one-shot requests after the game has consumed them. */
  consume(): void {
    this.state.ride = null;
    this.state.toggleMap = false;
  }
}
