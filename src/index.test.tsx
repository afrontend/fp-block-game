import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('fp-block', () => ({
  default: {
    init: vi.fn(() => ({})),
    tick: vi.fn((s) => s),
    key: vi.fn((_, s) => s),
    join: vi.fn(() => []),
  },
}));
vi.mock('keyboard-handler', () => ({ keyPressed: vi.fn() }));

// ─── index.tsx — root element null 체크 ─────────────────────────────────────

describe('index.tsx — root element null 체크', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('#root 요소가 없으면 명시적 에러를 throw', async () => {
    vi.spyOn(document, 'getElementById').mockReturnValue(null);

    await expect(import('./index')).rejects.toThrow(
      'Root element "#root" not found in document',
    );
  });
});
