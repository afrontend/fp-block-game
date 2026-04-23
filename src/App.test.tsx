import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App, { getKeySymbol, applyKeyToState, GAME_CONFIG } from './App';

// fp-block과 keyboard-handler는 외부 라이브러리이므로 mock 처리
vi.mock('fp-block', () => ({
  default: {
    init: vi.fn(() => ({ blocks: [], score: 0 })),
    tick: vi.fn((state) => state),
    key: vi.fn((symbol, state) => ({ ...state, lastKey: symbol })),
    join: vi.fn(() => [[{ color: 'red', count: 1 }]]),
  },
}));

vi.mock('keyboard-handler', () => ({
  keyPressed: vi.fn(),
}));

// ─── getKeySymbol ──────────────────────────────────────────────────────────

describe('getKeySymbol', () => {
  it('SPACE(32) → "space"', () => {
    expect(getKeySymbol(32)).toBe('space');
  });

  it('LEFT(37) → "left"', () => {
    expect(getKeySymbol(37)).toBe('left');
  });

  it('UP(38) → "up"', () => {
    expect(getKeySymbol(38)).toBe('up');
  });

  it('RIGHT(39) → "right"', () => {
    expect(getKeySymbol(39)).toBe('right');
  });

  it('DOWN(40) → "down"', () => {
    expect(getKeySymbol(40)).toBe('down');
  });

  it('매핑되지 않은 키(예: 65 = A) → null', () => {
    expect(getKeySymbol(65)).toBeNull();
  });

  it('SAVE(83), LOAD(76)는 keyList에 없으므로 null 반환', () => {
    expect(getKeySymbol(83)).toBeNull();
    expect(getKeySymbol(76)).toBeNull();
  });
});

// ─── applyKeyToState ───────────────────────────────────────────────────────

describe('applyKeyToState', () => {
  const baseState = { blocks: [], score: 0 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('매핑된 키(SPACE=32)는 fpBlock.key를 호출하고 새 상태를 반환', async () => {
    const fpBlock = (await import('fp-block')).default;
    applyKeyToState(32, baseState);
    expect(fpBlock.key).toHaveBeenCalledWith('space', baseState);
  });

  it('매핑되지 않은 키는 fpBlock.key를 호출하지 않고 기존 상태를 반환', async () => {
    const fpBlock = (await import('fp-block')).default;
    const result = applyKeyToState(65, baseState);
    expect(fpBlock.key).not.toHaveBeenCalled();
    expect(result).toBe(baseState);
  });
});

// ─── GAME_CONFIG ───────────────────────────────────────────────────────────

describe('GAME_CONFIG', () => {
  it('GRID_WIDTH와 GRID_HEIGHT가 정의되어 있어야 함', () => {
    expect(GAME_CONFIG.GRID_WIDTH).toBe(40);
    expect(GAME_CONFIG.GRID_HEIGHT).toBe(30);
  });

  it('TICK_INTERVAL_MS와 MISSILE_THROTTLE_MS가 정의되어 있어야 함', () => {
    expect(GAME_CONFIG.TICK_INTERVAL_MS).toBe(150);
    expect(GAME_CONFIG.MISSILE_THROTTLE_MS).toBe(500);
  });
});

// ─── BlockComponent className ──────────────────────────────────────────────

describe('BlockComponent — blockClassName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('노란색 블록은 "missile" 클래스를 가짐', async () => {
    const fpBlock = (await import('fp-block')).default;
    vi.mocked(fpBlock.join).mockReturnValue([[{ color: 'yellow', count: 0 }]]);
    render(<App />);
    const block = document.querySelector('.missile');
    expect(block).toBeInTheDocument();
  });

  it('노란색이 아닌 블록은 "missile" 클래스를 가지지 않음', async () => {
    const fpBlock = (await import('fp-block')).default;
    vi.mocked(fpBlock.join).mockReturnValue([[{ color: 'red', count: 1 }]]);
    render(<App />);
    const block = document.querySelector('.missile');
    expect(block).not.toBeInTheDocument();
  });
});

// ─── Blocks 컴포넌트 — blocks prop (rename from window) ───────────────────

describe('Blocks 컴포넌트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('join()이 반환한 2D 배열을 flat하여 블록을 렌더링', async () => {
    const fpBlock = (await import('fp-block')).default;
    vi.mocked(fpBlock.join).mockReturnValue([
      [{ color: 'red', count: 1 }, { color: 'blue', count: 2 }],
      [{ color: 'green', count: 3 }],
    ]);
    render(<App />);
    const blocks = document.querySelectorAll('.block');
    expect(blocks).toHaveLength(3);
  });

  it('join()이 빈 배열을 반환하면 블록이 없음', async () => {
    const fpBlock = (await import('fp-block')).default;
    vi.mocked(fpBlock.join).mockReturnValue([]);
    render(<App />);
    const blocks = document.querySelectorAll('.block');
    expect(blocks).toHaveLength(0);
  });
});

// ─── App 컴포넌트 마운트 ───────────────────────────────────────────────────

describe('App 컴포넌트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('마운트 시 fpBlock.init이 GRID_WIDTH, GRID_HEIGHT로 호출됨', async () => {
    const fpBlock = (await import('fp-block')).default;
    render(<App />);
    expect(fpBlock.init).toHaveBeenCalledWith(
      GAME_CONFIG.GRID_WIDTH,
      GAME_CONFIG.GRID_HEIGHT,
    );
  });

  it('TICK_INTERVAL_MS마다 fpBlock.tick이 호출됨', async () => {
    const fpBlock = (await import('fp-block')).default;
    render(<App />);
    vi.advanceTimersByTime(GAME_CONFIG.TICK_INTERVAL_MS * 3);
    expect(fpBlock.tick).toHaveBeenCalledTimes(3);
  });

  it('언마운트 시 인터벌이 정리됨', async () => {
    const fpBlock = (await import('fp-block')).default;
    const { unmount } = render(<App />);
    unmount();
    vi.advanceTimersByTime(GAME_CONFIG.TICK_INTERVAL_MS * 5);
    expect(fpBlock.tick).not.toHaveBeenCalled();
  });
});
