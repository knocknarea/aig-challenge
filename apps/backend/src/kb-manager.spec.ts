import * as fs from 'fs';
import { Kb } from 'shared';

jest.mock('engine', () => ({ loadKb: jest.fn() }));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  watch: jest.fn(),
}));

import { loadKb } from 'engine';
import { KbManager } from './kb-manager';

const mockLoadKb = loadKb as jest.MockedFunction<typeof loadKb>;
const mockWatch = fs.watch as jest.MockedFunction<typeof fs.watch>;

const makeKb = (version: string): Kb => ({
  version,
  basePremium: 300,
  coverageLoadFactor: 1.2,
  riskBands: {
    STANDARD: { min: 0, max: 25, riskMultiplier: 1.0 },
    ELEVATED: { min: 26, max: 60, riskMultiplier: 1.5 },
    HIGH_RISK: { min: 61, max: 999, riskMultiplier: 2.2 },
  },
  factors: [],
});

const KB_V1 = makeKb('1.0.0');
const KB_V2 = makeKb('2.0.0');

const createMockWatcher = () => ({
  close: jest.fn(),
  on: jest.fn().mockReturnThis(),
});

describe('KbManager', () => {
  let watchListener: () => void;
  let mockWatcher: ReturnType<typeof createMockWatcher>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockWatcher = createMockWatcher();
    (mockWatch as jest.Mock).mockImplementation((_path: unknown, _opts: unknown, cb: unknown) => {
      watchListener = cb as () => void;
      return mockWatcher as unknown as fs.FSWatcher;
    });
    mockLoadKb.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('initial load succeeds and getKb() returns the loaded KB', () => {
    mockLoadKb.mockReturnValue(KB_V1);
    const manager = new KbManager('/fake/risk-kb.json');
    expect(manager.getKb()).toBe(KB_V1);
  });

  it('getStatus() returns { state: "ok" } with version, path, and loadedAt', () => {
    mockLoadKb.mockReturnValue(KB_V1);
    const manager = new KbManager('/fake/risk-kb.json');
    const status = manager.getStatus();
    expect(status.state).toBe('ok');
    if (status.state === 'ok') {
      expect(status.version).toBe('1.0.0');
      expect(status.path).toBe('/fake/risk-kb.json');
      expect(status.loadedAt).toBeInstanceOf(Date);
    }
  });

  it('constructor throws a structured KB_LOAD_FAILED error when loadKb fails', () => {
    mockLoadKb.mockImplementation(() => { throw new Error('file not found'); });
    expect(() => new KbManager('/bad/path.json')).toThrow(/KB_LOAD_FAILED/);
  });

  it('file change with valid KB and new version swaps the KB', () => {
    mockLoadKb.mockReturnValueOnce(KB_V1).mockReturnValueOnce(KB_V2);
    const manager = new KbManager('/fake/risk-kb.json');
    manager.startWatching();

    watchListener();
    jest.advanceTimersByTime(200);

    expect(manager.getKb()).toBe(KB_V2);
    const status = manager.getStatus();
    expect(status.state).toBe('ok');
    if (status.state === 'ok') expect(status.version).toBe('2.0.0');
  });

  it('file change with same version is a no-op — original KB instance retained', () => {
    const kb1a = makeKb('1.0.0');
    mockLoadKb.mockReturnValueOnce(KB_V1).mockReturnValueOnce(kb1a);
    const manager = new KbManager('/fake/risk-kb.json');
    manager.startWatching();

    watchListener();
    jest.advanceTimersByTime(200);

    expect(manager.getKb()).toBe(KB_V1); // original instance, not kb1a
  });

  it('file change with invalid KB keeps last good KB and sets status to error', () => {
    mockLoadKb
      .mockReturnValueOnce(KB_V1)
      .mockImplementationOnce(() => { throw new Error('unexpected token'); });
    const manager = new KbManager('/fake/risk-kb.json');
    manager.startWatching();

    watchListener();
    jest.advanceTimersByTime(200);

    expect(manager.getKb()).toBe(KB_V1);
    const status = manager.getStatus();
    expect(status.state).toBe('error');
    if (status.state === 'error') {
      expect(status.lastGoodVersion).toBe('1.0.0');
      expect(status.reason).toContain('unexpected token');
    }
  });

  it('rapid saves are debounced — multiple events produce a single reload call', () => {
    mockLoadKb.mockReturnValueOnce(KB_V1).mockReturnValueOnce(KB_V2);
    const manager = new KbManager('/fake/risk-kb.json');
    manager.startWatching();

    watchListener();
    watchListener();
    watchListener();
    jest.advanceTimersByTime(200);

    // loadKb called twice total: once in constructor, once after debounce
    expect(mockLoadKb).toHaveBeenCalledTimes(2);
  });

  it('stopWatching() closes the FSWatcher and cancels a pending debounce timer', () => {
    mockLoadKb.mockReturnValue(KB_V1);
    const manager = new KbManager('/fake/risk-kb.json');
    manager.startWatching();

    watchListener(); // starts debounce timer
    manager.stopWatching(); // should cancel timer and close watcher
    jest.advanceTimersByTime(200);

    expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    // reload must NOT have fired — loadKb still called only once (constructor)
    expect(mockLoadKb).toHaveBeenCalledTimes(1);
  });
});
