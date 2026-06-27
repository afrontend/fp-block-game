import { getKeySymbol } from './keyMap';

describe('getKeySymbol - 키 매핑', () => {
  it('Space(32)는 space로 매핑된다', () => {
    expect(getKeySymbol(32)).toBe('space');
  });

  it('화살표 키가 올바르게 매핑된다', () => {
    expect(getKeySymbol(37)).toBe('left');
    expect(getKeySymbol(38)).toBe('up');
    expect(getKeySymbol(39)).toBe('right');
    expect(getKeySymbol(40)).toBe('down');
  });

  it('H키(72)는 help로 매핑된다', () => {
    expect(getKeySymbol(72)).toBe('help');
  });

  it('SAVE(83), LOAD(76)는 getKeySymbol 범위 밖이므로 null을 반환한다', () => {
    expect(getKeySymbol(83)).toBeNull();
    expect(getKeySymbol(76)).toBeNull();
  });

  it('매핑되지 않은 키는 null을 반환한다', () => {
    expect(getKeySymbol(999)).toBeNull();
  });
});
