import { watch, FSWatcher } from 'fs';
import { join } from 'path';
import { Kb } from 'shared';
import { loadKb } from 'engine';

export type KbLoadStatus =
  | { state: 'ok'; version: string; loadedAt: Date; path: string }
  | { state: 'error'; reason: string; lastGoodVersion: string; lastGoodAt: Date; path: string };

export class KbManager {
  private readonly kbPath: string;
  private kb: Kb;
  private status: KbLoadStatus;
  private watcher: FSWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(kbPath?: string) {
    this.kbPath = kbPath ?? process.env['AIG_KB_PATH'] ?? join(process.cwd(), 'risk-kb.json');
    try {
      this.kb = loadKb(this.kbPath);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`KB_LOAD_FAILED ${JSON.stringify({ path: this.kbPath, reason })}`);
    }
    this.status = { state: 'ok', version: this.kb.version, loadedAt: new Date(), path: this.kbPath };
  }

  getKb(): Kb { return this.kb; }
  getStatus(): KbLoadStatus { return this.status; }

  startWatching(): void {
    if (this.watcher) return;
    // persistent: false so the watcher does not prevent clean process exit
    this.watcher = watch(this.kbPath, { persistent: false }, () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      // Debounce: editors often fire 2–4 events per save; coalesce into one reload
      this.debounceTimer = setTimeout(() => this.reload(), 200);
    });
    this.watcher.on('error', (err: Error) => {
      console.error('KbManager: watcher error', err.message);
    });
  }

  stopWatching(): void {
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); this.debounceTimer = null; }
    if (this.watcher) { this.watcher.close(); this.watcher = null; }
  }

  private reload(): void {
    try {
      const newKb = loadKb(this.kbPath);
      if (newKb.version === this.kb.version) {
        console.info(`KbManager: reload skipped, version unchanged (${newKb.version})`);
        return;
      }
      const prev = this.kb.version;
      this.kb = newKb;
      this.status = { state: 'ok', version: newKb.version, loadedAt: new Date(), path: this.kbPath };
      console.info(`KbManager: hot-reloaded ${prev} → ${newKb.version}`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const lastGoodVersion = this.status.state === 'ok' ? this.status.version : this.status.lastGoodVersion;
      const lastGoodAt = this.status.state === 'ok' ? this.status.loadedAt : this.status.lastGoodAt;
      this.status = { state: 'error', reason, lastGoodVersion, lastGoodAt, path: this.kbPath };
      console.error(`KbManager: reload failed, keeping v${lastGoodVersion}: ${reason}`);
      // this.kb is NOT updated — last good KB stays in memory
    }
  }
}
