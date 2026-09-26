import React from 'react';
import { render, act } from '@testing-library/react';
import App, { GAME_CONFIG } from './App';
import { getKeySymbol } from './utils/keyMap';

function fireTouch(el, type, x, y) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  event.touches = [{ clientX: x, clientY: y }];
  event.changedTouches = [{ clientX: x, clientY: y }];
  el.dispatchEvent(event);
}

function swipe(el, x1, y1, x2, y2) {
  fireTouch(el, 'touchstart', x1, y1);
  fireTouch(el, 'touchend', x2, y2);
}

vi.mock('fp-block', () => ({
  default: {
    init: vi.fn(() => ({ paused: false })),
    tick: vi.fn((state) => state),
    key: vi.fn((symbol, state) => ({ ...state, lastKey: symbol })),
    join: vi.fn(() => [[{ color: 'red' }]]),
    toArray: vi.fn(() => [[], [], [], []]),
    getTickInterval: vi.fn(() => 150),
    serializeState: vi.fn(state => ({ game: 'fp-block', version: 1, state })),
    restoreState: vi.fn(snapshot => snapshot.state),
  },
}));

vi.mock('keyboard-handler', () => ({
  keyPressed: vi.fn(() => vi.fn()),
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

  it('DOWN(40)은 매핑되지 않는다', () => {
    expect(getKeySymbol(40)).toBeNull();
  });

  it('매핑되지 않은 키(예: 65 = A) → null', () => {
    expect(getKeySymbol(65)).toBeNull();
  });

  it('SAVE(83), LOAD(76)는 시스템 기능으로 매핑된다', () => {
    expect(getKeySymbol(83)).toBe('save');
    expect(getKeySymbol(76)).toBe('load');
  });
});

// ─── GAME_CONFIG ───────────────────────────────────────────────────────────

describe('GAME_CONFIG', () => {
  it('행, 열, 미사일 대기 tick이 정의되어 있어야 함', () => {
    expect(GAME_CONFIG.GRID_ROWS).toBe(40);
    expect(GAME_CONFIG.GRID_COLUMNS).toBe(30);
    expect(GAME_CONFIG.MISSILE_COOLDOWN_TICKS).toBe(3);
  });
});

// ─── BlockComponent className ──────────────────────────────────────────────

describe('BlockComponent — blockClassName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('노란색 블록은 "missile" 클래스를 가짐', async () => {
    const fpBlock = (await import('fp-block')).default;
    fpBlock.join.mockReturnValue([[{ color: 'yellow', count: 0 }]]);
    render(<App />);
    const block = document.querySelector('.missile');
    expect(block).toBeInTheDocument();
  });

  it('노란색이 아닌 블록은 "missile" 클래스를 가지지 않음', async () => {
    const fpBlock = (await import('fp-block')).default;
    fpBlock.join.mockReturnValue([[{ color: 'red', count: 1 }]]);
    render(<App />);
    const block = document.querySelector('.missile');
    expect(block).not.toBeInTheDocument();
  });
});

// ─── Blocks 컴포넌트 ───────────────────────────────────────────────────────

describe('Blocks 컴포넌트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('join()이 반환한 2D 배열을 flat하여 블록을 렌더링', async () => {
    const fpBlock = (await import('fp-block')).default;
    fpBlock.join.mockReturnValue([
      [{ color: 'red', count: 1 }, { color: 'blue', count: 2 }],
      [{ color: 'green', count: 3 }],
    ]);
    render(<App />);
    const blocks = document.querySelectorAll('.block');
    expect(blocks).toHaveLength(3);
  });

  it('join()이 빈 배열을 반환하면 블록이 없음', async () => {
    const fpBlock = (await import('fp-block')).default;
    fpBlock.join.mockReturnValue([]);
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

  it('마운트 시 fpBlock.init이 객체 설정으로 호출됨', async () => {
    const fpBlock = (await import('fp-block')).default;
    render(<App />);
    expect(fpBlock.init).toHaveBeenCalledWith({
      rows: GAME_CONFIG.GRID_ROWS,
      columns: GAME_CONFIG.GRID_COLUMNS,
      missileCooldownTicks: GAME_CONFIG.MISSILE_COOLDOWN_TICKS,
    });
  });

  it('카운트다운 후 라이브러리 tick 주기마다 fpBlock.tick이 호출됨', async () => {
    const fpBlock = (await import('fp-block')).default;
    render(<App />);
    act(() => { vi.advanceTimersByTime(3000); });
    fpBlock.tick.mockClear();
    act(() => { vi.advanceTimersByTime(450); });
    expect(fpBlock.tick).toHaveBeenCalledTimes(3);
  });

  it('언마운트 시 인터벌이 정리됨', async () => {
    const fpBlock = (await import('fp-block')).default;
    const { unmount } = render(<App />);
    unmount();
    vi.advanceTimersByTime(5000);
    expect(fpBlock.tick).not.toHaveBeenCalled();
  });
});

// ─── 터치/스와이프 동작 ─────────────────────────────────────────────────────

describe('터치/스와이프 동작', () => {
  function mountApp() {
    const { unmount } = render(<App />);
    act(() => { vi.advanceTimersByTime(3000); });
    const el = document.querySelector('.App');
    return { el, unmount };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    window.ontouchstart = null;
  });

  afterEach(() => {
    delete window.ontouchstart;
    vi.useRealTimers();
  });

  it('제자리 탭(움직임 10px 미만)은 일시정지(space)로 처리된다', async () => {
    const fpBlock = (await import('fp-block')).default;
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 2, 2); vi.advanceTimersByTime(0); });
    expect(fpBlock.key).toHaveBeenCalledWith('space', expect.anything());
  });

  it('오른쪽으로 스와이프하면 right 이동이 호출된다', async () => {
    const fpBlock = (await import('fp-block')).default;
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 50, 0); vi.advanceTimersByTime(0); });
    expect(fpBlock.key).toHaveBeenCalledWith('right', expect.anything());
  });

  it('왼쪽으로 스와이프하면 left 이동이 호출된다', async () => {
    const fpBlock = (await import('fp-block')).default;
    const { el } = mountApp();
    act(() => { swipe(el, 50, 0, 0, 0); vi.advanceTimersByTime(0); });
    expect(fpBlock.key).toHaveBeenCalledWith('left', expect.anything());
  });

  it('위로 스와이프하면 미사일이 발사된다', async () => {
    const fpBlock = (await import('fp-block')).default;
    const { el } = mountApp();
    act(() => { swipe(el, 0, 50, 0, 0); vi.advanceTimersByTime(0); });
    expect(fpBlock.key).toHaveBeenCalledWith('up', expect.anything());
  });

  it('아래로 스와이프해도 아무 동작도 일어나지 않는다', async () => {
    const fpBlock = (await import('fp-block')).default;
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 0, 50); vi.advanceTimersByTime(0); });
    expect(fpBlock.key).not.toHaveBeenCalled();
  });

  it('10~30px 사이의 애매한 움직임은 무시된다', async () => {
    const fpBlock = (await import('fp-block')).default;
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 20, 0); vi.advanceTimersByTime(0); });
    expect(fpBlock.key).not.toHaveBeenCalled();
  });

  it('터치를 지원하지 않는 환경에서는 스와이프가 동작하지 않는다', async () => {
    const fpBlock = (await import('fp-block')).default;
    delete window.ontouchstart;
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 100, 0); vi.advanceTimersByTime(0); });
    expect(fpBlock.key).not.toHaveBeenCalled();
  });

  it('언마운트 시 터치 리스너가 정리된다', () => {
    const { el, unmount } = mountApp();
    const removeSpy = vi.spyOn(el, 'removeEventListener');
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    removeSpy.mockRestore();
  });
});
