declare module 'fp-block' {
  interface GameState {
    [key: string]: any;
  }

  interface Block {
    color: string;
    count: number;
  }

  const fpBlock: {
    init: (width: number, height: number) => GameState;
    tick: (state: GameState) => GameState;
    key: (symbol: string, state: GameState) => GameState;
    join: (state: GameState) => Block[][];
  };

  export default fpBlock;
}

declare module 'keyboard-handler' {
  export function keyPressed(callback: (event: { which: number }) => void): void;
}