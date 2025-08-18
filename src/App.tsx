import * as keyboard from "keyboard-handler";
import React, { useState, useEffect, useCallback, useRef } from "react";
import _ from "lodash";
import "./App.css";
import fpBlock from "fp-block";

interface Block {
  color: string;
  count: number;
}

interface GameState {
  [key: string]: any;
  savedState?: GameState;
}

interface BlockProps {
  color: string;
  children: React.ReactNode;
}

interface BlocksProps {
  window: Block[];
}

interface KeyMapping {
  keyValue: number;
  keySymbol: string;
}

const SPACE = 32;
const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;
const KEY_L = 76;
const KEY_S = 83;

const createBlocks = (ary: Block[]): React.ReactElement[] =>
  ary.map((item, index) => (
    <BlockComponent color={item.color} key={index}>
      {item.count}
    </BlockComponent>
  ));

const blockClassName = (props: BlockProps): string => {
  return "block " + (props.color === "yellow" ? "missile" : "");
};

const BlockComponent: React.FC<BlockProps> = (props) => (
  <div
    className={blockClassName(props)}
    style={{ backgroundColor: props.color }}
  >
    {props.children}
  </div>
);

const Blocks: React.FC<BlocksProps> = (props) => createBlocks(props.window);

const keyList: KeyMapping[] = [
  { keyValue: SPACE, keySymbol: "space" },
  { keyValue: LEFT, keySymbol: "left" },
  { keyValue: UP, keySymbol: "up" },
  { keyValue: RIGHT, keySymbol: "right" },
  { keyValue: DOWN, keySymbol: "down" },
];

const getKeySymbol = (keyValue: number): string | null => {
  const found = _.find(keyList, (key) => key.keyValue === keyValue);
  return found ? found.keySymbol : null;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() =>
    fpBlock.init(40, 30),
  );
  const timerRef = useRef<NodeJS.Timeout>();

  const launchMissile = useCallback(
    _.throttle((e: { which: number }) => {
      setGameState((state) => {
        const symbol = getKeySymbol(e.which);
        return symbol ? fpBlock.key(symbol, state) : state;
      });
    }, 500),
    [],
  );

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setGameState((state) => fpBlock.tick(state));
    }, 150);

    const handleKeyPress = (e: { which: number }) => {
      if (e.which === UP) {
        launchMissile(e);
      } else if (e.which === KEY_L) {
        setGameState((state) => state.savedState || state);
      } else if (e.which === KEY_S) {
        setGameState((state) => ({
          ...state,
          savedState: _.cloneDeep(state),
        }));
      } else {
        setTimeout(() => {
          setGameState((state) => {
            const symbol = getKeySymbol(e.which);
            return symbol ? fpBlock.key(symbol, state) : state;
          });
        });
      }
    };

    keyboard.keyPressed(handleKeyPress);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [launchMissile]);

  return (
    <div className="container">
      <div className="App">
        <Blocks window={_.flatten(fpBlock.join(gameState))} />
      </div>
    </div>
  );
};

export default App;
