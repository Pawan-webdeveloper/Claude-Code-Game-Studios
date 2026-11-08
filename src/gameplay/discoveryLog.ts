/**
 * Which landmarks the player has discovered, persisted through an injected storage so it can be
 * unit-tested without a browser.
 */

/** Minimal key-value storage (window.localStorage satisfies it). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class DiscoveryLog {
  private readonly found = new Set<string>();

  /**
   * @param store storage backend; may throw (private mode), which is tolerated
   * @param validIds only these ids are counted; unknown saved ids are ignored
   * @param key storage key
   */
  constructor(
    private readonly store: KeyValueStore | null,
    private readonly validIds: ReadonlySet<string>,
    private readonly key = "trainers-atlas:discovered",
  ) {
    try {
      const raw = store?.getItem(key);
      const ids: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(ids)) for (const id of ids) if (typeof id === "string" && validIds.has(id)) this.found.add(id);
    } catch {
      /* corrupt or unavailable storage: start fresh */
    }
  }

  /** Marks a landmark discovered. Returns true only the first time. */
  discover(id: string): boolean {
    if (!this.validIds.has(id) || this.found.has(id)) return false;
    this.found.add(id);
    try {
      this.store?.setItem(this.key, JSON.stringify([...this.found]));
    } catch {
      /* storage full or blocked: progress stays in memory */
    }
    return true;
  }

  /** Whether a landmark has been discovered. */
  has(id: string): boolean {
    return this.found.has(id);
  }

  /** Number discovered. */
  get count(): number {
    return this.found.size;
  }

  /** Total number of landmarks. */
  get total(): number {
    return this.validIds.size;
  }
}
