import React from 'react';
import './App.css';
import fpBlock from 'fp-block';
import useGame, { swipeToSymbol } from './useGame';

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

// 블록 게임에는 아래로 움직이는 키가 없어 아래 스와이프는 무시한다.
const blockSwipeToSymbol = (swipe) => {
  const symbol = swipeToSymbol(swipe);
  return symbol === 'down' ? null : symbol;
};

const Blocks = ({ blocks }) =>
  blocks.map((item, index) => <Block color={item.color} key={index} />);

function App() {
  const { gameState, showHelp, isDebug, countdown, message, appRef } = useGame(fpBlock, {
    createState: () =>
      fpBlock.init({
        rows: GAME_CONFIG.GRID_ROWS,
        columns: GAME_CONFIG.GRID_COLUMNS,
        missileCooldownTicks: GAME_CONFIG.MISSILE_COOLDOWN_TICKS,
      }),
    toSymbol: blockSwipeToSymbol,
  });

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
