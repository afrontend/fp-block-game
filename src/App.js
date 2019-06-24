import * as keyboard from 'keyboard-handler';
import React, { Component } from 'react';
import _ from 'lodash';
import './App.css';
import fpBlock from 'fp-block';

const SPACE = 32;
const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;
const KEY_L = 76;
const KEY_S = 83;

const createBlocks = ary => (
  ary.map(
    (item, index) => (
      <Block color={item.color} key={index}>
        {item.count}
      </Block>
    )
  )
);

const blockClassName = props => {
  return 'block ' + (props.color === 'yellow' ? 'missile' : '');
}

const Block = props => (<div className={blockClassName(props)} style={{backgroundColor: props.color}}>{props.children}</div>);
const Blocks = props => (createBlocks(props.window));

const keyList = [
  { keyValue: SPACE, keySymbol: 'space'},
  { keyValue: LEFT, keySymbol: 'left' },
  { keyValue: UP, keySymbol: 'up' },
  { keyValue: RIGHT, keySymbol: 'right' },
  { keyValue: DOWN, keySymbol: 'down' }
];

const getKeySymbol = (keyValue) => {
  const found = _.find(keyList, key => (key.keyValue === keyValue));
  return found ? found.keySymbol : null;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = fpBlock.init(40, 30);
    this.state.timer = setInterval(() => {
      this.setState((state) => (fpBlock.tick(state)));
    }, 150);

    this.launchMissile = _.throttle((e) => {
      this.setState((state) => {
        const symbol = getKeySymbol(e.which);
        return symbol ? fpBlock.key(symbol, state) : state;
      });
    }, 500);

    keyboard.keyPressed(e => {
      if (e.which === UP) {
        this.launchMissile(e);
      } else if (e.which === KEY_L) {
        this.setState((state) => (state.savedState));
      } else if (e.which === KEY_S) {
        this.setState((state) => ({savedState: _.cloneDeep(state)}));
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

  render() {
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
