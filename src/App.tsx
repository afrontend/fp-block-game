import * as keyboard from "keyboard-handler";
import React, { useState, useEffect, useRef } from "react";
import { cloneDeep, throttle } from "lodash";
import "./App.css";
import fpBlock, { type Block, type GameState } from "fp-block";

interface BlockProps {
  color: string;
  children: React.ReactNode;
}

interface BlocksProps {
  blocks: Block[];
}

interface KeyMapping {
  keyValue: number;
  keySymbol: string;
}

// 키보드 키 코드 상수
const KEY_CODES = {
  SPACE: 32,
  LEFT: 37,
  UP: 38,    // 미사일 발사 (쓰로틀 적용)
  RIGHT: 39,
  DOWN: 40,
  SAVE: 83,  // S — 현재 상태 저장
  LOAD: 76,  // L — 저장된 상태 불러오기
} as const;

// 게임 초기화 및 루프 설정값
export const GAME_CONFIG = {
  GRID_WIDTH: 40,
  GRID_HEIGHT: 30,
  TICK_INTERVAL_MS: 150,   // 게임 틱 주기 (ms)
  MISSILE_THROTTLE_MS: 500, // 미사일 연사 제한 (ms)
} as const;

// 노란색 블록이 미사일을 나타냄 (fp-block 라이브러리 규약)
const MISSILE_COLOR = "yellow";

const createBlocks = (ary: Block[]): React.ReactElement[] =>
  ary.map((item, index) => (
    <BlockComponent color={item.color} key={index}>
      {item.count}
    </BlockComponent>
  ));

const blockClassName = (props: BlockProps): string => {
  return "block " + (props.color === MISSILE_COLOR ? "missile" : "");
};

const BlockComponent: React.FC<BlockProps> = (props) => (
  <div
    aria-hidden="true"
    className={blockClassName(props)}
    style={{ backgroundColor: props.color }}
  >
    {props.children}
  </div>
);

const Blocks: React.FC<BlocksProps> = (props) => createBlocks(props.blocks);

const keyList: KeyMapping[] = [
  { keyValue: KEY_CODES.SPACE, keySymbol: "space" },
  { keyValue: KEY_CODES.LEFT,  keySymbol: "left" },
  { keyValue: KEY_CODES.UP,    keySymbol: "up" },
  { keyValue: KEY_CODES.RIGHT, keySymbol: "right" },
  { keyValue: KEY_CODES.DOWN,  keySymbol: "down" },
];

export const getKeySymbol = (keyValue: number): string | null => {
  const found = keyList.find((key) => key.keyValue === keyValue);
  return found ? found.keySymbol : null;
};

// 키 입력을 게임 상태에 적용. 매핑되지 않은 키는 상태를 그대로 반환.
export const applyKeyToState = (keyCode: number, state: GameState): GameState => {
  const symbol = getKeySymbol(keyCode);
  return symbol ? fpBlock.key(symbol, state) : state;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() =>
    fpBlock.init(GAME_CONFIG.GRID_WIDTH, GAME_CONFIG.GRID_HEIGHT),
  );
  const timerRef = useRef<NodeJS.Timeout>(null);

  // UP 키는 연사 방지를 위해 쓰로틀 적용. useRef로 인스턴스를 한 번만 생성.
  const launchMissileRef = useRef(
    throttle((e: { which: number }) => {
      setGameState((state) => applyKeyToState(e.which, state));
    }, GAME_CONFIG.MISSILE_THROTTLE_MS),
  );

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setGameState((state) => fpBlock.tick(state));
    }, GAME_CONFIG.TICK_INTERVAL_MS);

    const handleKeyPress = (e: { which: number }) => {
      if (e.which === KEY_CODES.UP) {
        launchMissileRef.current(e);
      } else if (e.which === KEY_CODES.LOAD) {
        setGameState((state) => state.savedState || state);
      } else if (e.which === KEY_CODES.SAVE) {
        setGameState((state) => ({
          ...state,
          savedState: cloneDeep(state),
        }));
      } else {
        // setTimeout으로 다음 이벤트 루프에서 처리해
        // 방향키 입력이 setInterval 틱과 겹치지 않도록 함
        setTimeout(() => {
          setGameState((state) => applyKeyToState(e.which, state));
        });
      }
    };

    keyboard.keyPressed(handleKeyPress);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="container">
      <div
        aria-label="Block game"
        className="App"
        role="application"
      >
        <Blocks blocks={fpBlock.join(gameState).flat()} />
      </div>
    </div>
  );
};

export default App;
