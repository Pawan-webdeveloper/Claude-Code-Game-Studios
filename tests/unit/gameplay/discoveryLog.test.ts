import { describe, expect, it } from "vitest";
import { DiscoveryLog, type KeyValueStore } from "../../../src/gameplay/discoveryLog";

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
}
const IDS = new Set(["a", "b", "c"]);

describe("DiscoveryLog", () => {
  it("counts first discoveries only", () => {
    const log = new DiscoveryLog(new MemoryStore(), IDS);
    expect(log.discover("a")).toBe(true);
    expect(log.discover("a")).toBe(false);
    expect(log.count).toBe(1);
    expect(log.total).toBe(3);
  });
  it("ignores unknown ids", () => {
    const log = new DiscoveryLog(new MemoryStore(), IDS);
    expect(log.discover("zzz")).toBe(false);
    expect(log.count).toBe(0);
  });
  it("persists and restores through the store", () => {
    const store = new MemoryStore();
    new DiscoveryLog(store, IDS).discover("b");
    const again = new DiscoveryLog(store, IDS);
    expect(again.has("b")).toBe(true);
    expect(again.count).toBe(1);
  });
  it("survives corrupt or throwing storage", () => {
    const store = new MemoryStore();
    store.setItem("trainers-atlas:discovered", "{not json");
    expect(new DiscoveryLog(store, IDS).count).toBe(0);
    const throwing: KeyValueStore = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const log = new DiscoveryLog(throwing, IDS);
    expect(log.discover("a")).toBe(true);
    expect(log.count).toBe(1);
  });
  it("works with no storage at all", () => {
    const log = new DiscoveryLog(null, IDS);
    expect(log.discover("c")).toBe(true);
  });
});
