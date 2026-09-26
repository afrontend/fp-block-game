import { getKeySymbol } from './keyMap';

describe('getKeySymbol - 키 매핑', () => {
  it('Space(32)는 space로 매핑된다', () => {
    expect(getKeySymbol(32)).toBe('space');
  });

  it('지원하는 화살표 키만 매핑된다', () => {
    expect(getKeySymbol(37)).toBe('left');
    expect(getKeySymbol(38)).toBe('up');
    expect(getKeySymbol(39)).toBe('right');
    expect(getKeySymbol(40)).toBeNull();
  });

  it('H키(72)는 help로 매핑된다', () => {
    expect(getKeySymbol(72)).toBe('help');
  });

  it('S, L, D 키가 시스템 기능으로 매핑된다', () => {
    expect(getKeySymbol(83)).toBe('save');
    expect(getKeySymbol(76)).toBe('load');
    expect(getKeySymbol(68)).toBe('debug');
  });

  it('매핑되지 않은 키는 null을 반환한다', () => {
    expect(getKeySymbol(999)).toBeNull();
  });
});
