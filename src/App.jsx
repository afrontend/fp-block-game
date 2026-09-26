import * as keyboard from 'keyboard-handler';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import fpBlock from 'fp-block';
import { getKeySymbol } from './utils/keyMap';

export const GAME_CONFIG = {
  GRID_ROWS: 40,
  GRID_COLUMNS: 30,
  MISSILE_COOLDOWN_TICKS: 3,
};

const MISSILE_COLOR = 'yellow';

const HELP_ITEMS = [
  { key: '← →', action: '좌우 이동' },
  { key: '↑', action: '미사일 발사' },
  { key: 'Space', action: '일시정지 / 재개' },
  { key: 'S', action: '빠른 저장' },
  { key: 'L', action: '빠른 불러오기' },
  { key: 'D', action: '디버그 모드 전환' },
  { key: 'H', action: '도움말 열기 / 닫기' },
  { key: '좌우 스와이프', action: '좌우 이동' },
  { key: '위로 스와이프', action: '미사일 발사' },
  { key: '화면 탭', action: '일시정지 / 재개' },
];

const Block = React.memo(({ color }) => (
  <div
    aria-hidden="true"
    className={['block', color !== 'grey' ? 'block--filled' : '', color === MISSILE_COLOR ? 'missile' : ''].filter(Boolean).join(' ')}
    style={color !== 'grey' ? { '--c': color } : undefined}
  />
));

const Blocks = ({ blocks }) =>
  blocks.map((item, index) => <Block color={item.color} key={index} />);

function App() {
  const [gameState, setGameState] = useState(() =>
    fpBlock.init({
      rows: GAME_CONFIG.GRID_ROWS,
      columns: GAME_CONFIG.GRID_COLUMNS,
      missileCooldownTicks: GAME_CONFIG.MISSILE_COOLDOWN_TICKS,
    }),
  );
  const [showHelp, setShowHelp] = useState(false);
  const [isDebug, setIsDebug] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [message, setMessage] = useState('');
  const savedState = useRef(null);
  const showHelpRef = useRef(false);
  const countdownRef = useRef(3);
  const messageTimer = useRef(null);
  const appRef = useRef(null);

  const showStatus = useCallback((text) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), 2000);
  }, []);

  useEffect(() => () => clearTimeout(messageTimer.current), []);

  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCountdown(2), 1000),
      setTimeout(() => setCountdown(1), 2000),
      setTimeout(() => setCountdown(null), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (countdown !== null) return undefined;
    const timer = setInterval(() => {
      setGameState((state) => showHelpRef.current ? state : fpBlock.tick(state));
    }, fpBlock.getTickInterval(gameState));
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const removeKeyListener = keyboard.keyPressed((event) => {
      if (countdownRef.current !== null) return;
      const symbol = getKeySymbol(event.which);
      if (symbol === 'help') {
        showHelpRef.current = !showHelpRef.current;
        setShowHelp((value) => !value);
        return;
      }
      if (symbol === 'debug') {
        setIsDebug((value) => !value);
        return;
      }
      if (symbol === 'save') {
        setGameState((state) => {
          savedState.current = fpBlock.serializeState(state);
          return state;
        });
        showStatus('빠르게 저장했습니다.');
        return;
      }
      if (symbol === 'load') {
        if (!savedState.current) {
          showStatus('저장된 상태가 없습니다.');
          return;
        }
        try {
          setGameState(fpBlock.restoreState(savedState.current));
          showStatus('저장된 상태를 불러왔습니다.');
        } catch (error) {
          console.error(error);
          showStatus('저장된 상태를 불러올 수 없습니다.');
        }
        return;
      }
      if (showHelpRef.current) return;
      setTimeout(() => {
        setGameState((state) => (symbol ? fpBlock.key(symbol, state) : state));
      });
    });
    return () => removeKeyListener();
  }, [showStatus]);

  useEffect(() => {
    const element = appRef.current;
    if (!element || !('ontouchstart' in window)) return undefined;
    let startX = 0;
    let startY = 0;
    const onTouchStart = (event) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      event.preventDefault();
    };
    const onTouchEnd = (event) => {
      if (countdownRef.current !== null || showHelpRef.current) return;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      let symbol = null;
      if (absDx < 10 && absDy < 10) symbol = 'space';
      else if (Math.max(absDx, absDy) > 30) {
        if (absDx > absDy) symbol = dx > 0 ? 'right' : 'left';
        else if (dy < 0) symbol = 'up';
      }
      if (symbol) {
        setTimeout(() => setGameState((state) => fpBlock.key(symbol, state)));
      }
      event.preventDefault();
    };
    element.addEventListener('touchstart', onTouchStart, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDebug]);

  if (isDebug) {
    const panels = [...fpBlock.toArray(gameState), fpBlock.join(gameState)];
    const labels = ['블록 배경 패널', '블록 우주선 패널', '블록 미사일 패널', '블록 운석 패널', '블록 합성 패널'];
    return (
      <div className="debug-layout">
        {panels.map((panel, index) => (
          <div className="container" key={labels[index]}>
            <div className="App" role="application" aria-label={labels[index]} tabIndex={0}>
              <Blocks blocks={panel.flat()} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="App-wrapper">
        <a href="https://github.com/afrontend/fp-block-game" title="fp-block-game" style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
          <img style={{ width: 20, height: 20 }} src="https://agvim.files.wordpress.com/2015/08/github-mark-32px.png?w=685" alt="GitHub" />
        </a>
        <div ref={appRef} aria-label="블록 게임" className="App" role="application" tabIndex={0}>
          {countdown !== null ? <div className="status-overlay">{countdown}</div> : null}
          {gameState.paused && !showHelp ? <div className="pause-overlay">일시정지</div> : null}
          {message ? <div className="message-overlay" role="status">{message}</div> : null}
          {showHelp ? (
            <div className="help-overlay" role="dialog" aria-label="도움말">
              <table><tbody>
                {HELP_ITEMS.map(({ key, action }) => (
                  <tr key={key}><td>{key}</td><td>{action}</td></tr>
                ))}
              </tbody></table>
            </div>
          ) : null}
          <Blocks blocks={fpBlock.join(gameState).flat()} />
        </div>
      </div>
    </div>
  );
}

export default App;
