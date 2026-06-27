const KEY_MAP = new Map([
  [32, 'space'],
  [37, 'left'],
  [38, 'up'],
  [39, 'right'],
  [40, 'down'],
]);

export const getKeySymbol = keyValue => KEY_MAP.get(keyValue) ?? null;
