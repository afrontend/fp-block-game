import * as keyboard from 'keyboard-handler';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import fpBlock from 'fp-block';
import { getKeySymbol } from './utils/keyMap';

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

// 키보드 키 코드 상수 (getKeySymbol 범위 밖에서 직접 비교하는 키만 정의)
const KEY_CODES = {
  UP: 38,   // 미사일 발사 (쓰로틀 적용)
  SAVE: 83, // S — 현재 상태 저장
  LOAD: 76, // L — 저장된 상태 불러오기
};

// 게임 초기화 및 루프 설정값
export const GAME_CONFIG = {
  GRID_WIDTH: 40,
  GRID_HEIGHT: 30,
  TICK_INTERVAL_MS: 150,    // 게임 틱 주기 (ms)
  MISSILE_THROTTLE_MS: 500, // 미사일 연사 제한 (ms)
};

// 노란색 블록이 미사일을 나타냄 (fp-block 라이브러리 규약)
const MISSILE_COLOR = 'yellow';

const HELP_ITEMS = [
  { key: '← →', action: '좌우 이동' },
  { key: '↑',   action: '미사일 발사' },
  { key: 'S',   action: '상태 저장' },
  { key: 'L',   action: '상태 불러오기' },
  { key: 'H',   action: '도움말 닫기' },
];


const Block = React.memo(({ color, children }) => (
  <div
    aria-hidden="true"
    className={['block', color !== 'grey' ? 'block--filled' : '', color === MISSILE_COLOR ? 'missile' : ''].filter(Boolean).join(' ')}
    style={color !== 'grey' ? { '--c': color } : undefined}
  >
    {children}
  </div>
));

const Blocks = ({ blocks }) =>
  blocks.map((item, index) => (
    <Block color={item.color} key={index}>
      {item.count}
    </Block>
  ));

function App() {
  const [gameState, setGameState] = useState(() =>
    fpBlock.init(GAME_CONFIG.GRID_WIDTH, GAME_CONFIG.GRID_HEIGHT),
  );
  const [showHelp, setShowHelp] = useState(false);
  const savedState = useRef(null);
  const showHelpRef = useRef(false);

  // UP 키는 연사 방지를 위해 쓰로틀 적용. useRef로 인스턴스를 한 번만 생성.
  const launchMissileRef = useRef(
    throttle((e) => {
      const symbol = getKeySymbol(e.which);
      setGameState((s) => symbol ? fpBlock.key(symbol, s) : s);
    }, GAME_CONFIG.MISSILE_THROTTLE_MS),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((s) => showHelpRef.current ? s : fpBlock.tick(s));
    }, GAME_CONFIG.TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const removeKeyListener = keyboard.keyPressed((e) => {
      if (e.which === KEY_CODES.UP) {
        launchMissileRef.current(e);
      } else if (e.which === KEY_CODES.LOAD) {
        if (savedState.current) setGameState(structuredClone(savedState.current));
      } else if (e.which === KEY_CODES.SAVE) {
        setGameState((s) => {
          savedState.current = structuredClone(s);
          return s;
        });
      } else {
        const symbol = getKeySymbol(e.which);
        if (symbol === 'help') {
          showHelpRef.current = !showHelpRef.current;
          setShowHelp(h => !h);
        } else {
          // setTimeout으로 다음 이벤트 루프에서 처리해
          // 방향키 입력이 setInterval 틱과 겹치지 않도록 함
          setTimeout(() => {
            setGameState((s) => symbol ? fpBlock.key(symbol, s) : s);
          });
        }
      }
    });
    return () => removeKeyListener();
  }, []);

  return (
    <div className="container">
      <div className="App-wrapper">
        <a href="https://github.com/afrontend/fp-block-game" title="fp-block-game" style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
          <img style={{ width: 20, height: 20 }} src="https://agvim.files.wordpress.com/2015/08/github-mark-32px.png?w=685" alt="GitHub" />
        </a>
        <div
          aria-label="Block game"
          className="App"
          role="application"
        >
        {showHelp ? (
          <div className="help-overlay" role="dialog" aria-label="도움말">
            <table>
              <tbody>
                {HELP_ITEMS.map(({ key, action }) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <Blocks blocks={fpBlock.join(gameState).flat()} />
        </div>
      </div>
    </div>
  );
}

export default App;
