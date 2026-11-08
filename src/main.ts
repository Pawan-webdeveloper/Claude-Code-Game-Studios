/** Entry point: loading screen → PRESS START (unlocks audio) → game. */
import "./style.css";
import { Game } from "./game";
import { detectQuality, isTouch } from "./render/quality";

async function boot(): Promise<void> {
  const app = document.getElementById("app")!;
  const bar = document.getElementById("load-bar")!;
  const label = document.getElementById("load-label")!;
  const start = document.getElementById("start") as HTMLButtonElement;
  if (isTouch()) document.body.classList.add("touch");

  const game = new Game(app, detectQuality());
  (window as unknown as { atlas: Game }).atlas = game;
  await game.load((p, text) => {
    bar.style.width = Math.round(p * 100) + "%";
    label.textContent = text;
  });
  start.hidden = false;
  label.textContent = "Tap or press Enter";

  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    document.getElementById("loading")!.classList.add("gone");
    document.getElementById("hud")!.hidden = false;
    window.removeEventListener("keydown", onKey);
    game.start();
    game.bindTouch(
      document.getElementById("stick")!,
      document.getElementById("knob")!,
      document.querySelectorAll<HTMLElement>("#buttons button"),
    );
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.code === "Enter" || e.code === "Space") go();
  };
  start.addEventListener("click", go, { once: true });
  window.addEventListener("keydown", onKey);
}

boot().catch((err) => {
  console.error(err);
  const label = document.getElementById("load-label");
  if (label) label.textContent = "Something went wrong loading the world. Please refresh.";
});
