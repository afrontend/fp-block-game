import * as keyboard from 'keyboard-handler';
import React, { Component } from 'react';
import _ from 'lodash';
import './App.css';
import fpBlock from 'fp-block';

const createBlocks = ary => (
  ary.map(
    (item, index) => (
      <Block color={item.color} key={index}>
        {item.count}
      </Block>
    )
  )
);

const Block = props => (<div className="block" style={{backgroundColor: props.color}}>{props.children}</div>);
const Blocks = props => (createBlocks(props.window));

const keyList = [
  { keyValue: 32, keySymbol: 'space'},
  { keyValue: 37, keySymbol: 'left' },
  { keyValue: 38, keySymbol: 'up' },
  { keyValue: 39, keySymbol: 'right' },
  { keyValue: 40, keySymbol: 'down' }
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
      if (e.which === 38) {
        this.launchMissile(e);
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
