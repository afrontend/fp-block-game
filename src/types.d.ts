declare module 'fp-block' {
  // 각 셀 하나를 나타내는 블록
  interface Block {
    color: string;
    count?: number;
    zeroPoint?: boolean; // 셔틀·미사일의 기준점 마커
  }

  // init()이 반환하고 tick()/key()가 받고 반환하는 게임 상태
  interface GameState {
    bgPanel:        Block[][];  // 배경 패널
    shuttlePanel:   Block[][];  // 셔틀(플레이어)
    missilePanel:   Block[][];  // 미사일
    meteoritePanel: Block[][];  // 운석(적)
    savedState?:    GameState;  // S 키로 저장한 스냅샷
  }

  const fpBlock: {
    init: (rows: number, columns: number) => GameState;
    tick: (state: GameState) => GameState;
    key: (symbol: string, state: GameState) => GameState;
    join: (state: GameState) => Block[][];
  };

  export default fpBlock;
}

declare module 'keyboard-handler' {
  export function keyPressed(callback: (event: { which: number }) => void): void;
}