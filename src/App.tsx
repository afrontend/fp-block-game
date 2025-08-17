import * as keyboard from 'keyboard-handler';
import React, { Component } from 'react';
import _ from 'lodash';
import './App.css';
import fpBlock from 'fp-block';

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

const createBlocks = (ary: Block[]): React.ReactElement[] => (
  ary.map(
    (item, index) => (
      <BlockComponent color={item.color} key={index}>
        {item.count}
      </BlockComponent>
    )
  )
);

const blockClassName = (props: BlockProps): string => {
  return 'block ' + (props.color === 'yellow' ? 'missile' : '');
}

const BlockComponent: React.FC<BlockProps> = (props) => (
  <div className={blockClassName(props)} style={{backgroundColor: props.color}}>
    {props.children}
  </div>
);

const Blocks: React.FC<BlocksProps> = (props) => (createBlocks(props.window));

const keyList: KeyMapping[] = [
  { keyValue: SPACE, keySymbol: 'space'},
  { keyValue: LEFT, keySymbol: 'left' },
  { keyValue: UP, keySymbol: 'up' },
  { keyValue: RIGHT, keySymbol: 'right' },
  { keyValue: DOWN, keySymbol: 'down' }
];

const getKeySymbol = (keyValue: number): string | null => {
  const found = _.find(keyList, key => (key.keyValue === keyValue));
  return found ? found.keySymbol : null;
}

class App extends Component<{}, GameState> {
  private launchMissile: (e: { which: number }) => void;
  private timer?: NodeJS.Timeout;

  constructor(props: {}) {
    super(props);
    this.state = fpBlock.init(40, 30);
    this.timer = setInterval(() => {
      this.setState((state) => (fpBlock.tick(state)));
    }, 150);

    this.launchMissile = _.throttle((e: { which: number }) => {
      this.setState((state) => {
        const symbol = getKeySymbol(e.which);
        return symbol ? fpBlock.key(symbol, state) : state;
      });
    }, 500);

    keyboard.keyPressed((e: { which: number }) => {
      if (e.which === UP) {
        this.launchMissile(e);
      } else if (e.which === KEY_L) {
        this.setState((state) => (state.savedState || state));
      } else if (e.which === KEY_S) {
        this.setState((state) => ({...state, savedState: _.cloneDeep(state)}));
      } else {
        setTimeout(() => {
          this.setState((state) => {
            const symbol = getKeySymbol(e.which);
            return symbol ? fpBlock.key(symbol, state) : state;
          });
        });
      }
    });
  }

  render(): React.ReactElement {
    return (
      <div className="container">
        <div className="App">
          <Blocks window={_.flatten(fpBlock.join(this.state))} />
        </div>
      </div>
    );
  }
}

export default App;
