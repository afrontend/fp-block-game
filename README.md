# Block Game
> 블럭을 미사일로 맞추는 자바스크립트 게임

[![block game demo](https://github.com/afrontend/fp-block-game/releases/download/screenshots/demo.gif "block game demo")](https://afrontend.github.io/fp-block-game/)

[블로그](https://agvim.wordpress.com/2019/03/25/block-game-with-javascript/)에서 간단한 설명을 볼 수 있으며 아래 라이브러리를 사용했다.

* [fp-block](https://www.npmjs.com/package/fp-block)
* [vite](https://vite.dev/)
* [keyboard-handler](https://github.com/emiljohansson/keyboard-handler)
* [react](https://react.dev/)

# 조작

| 입력 | 동작 |
|------|------|
| `←` `→` / 좌우 스와이프 | 좌우 이동 |
| `↑` / 위로 스와이프 | 미사일 발사 |
| `Space` / 화면 탭 | 일시정지 / 재개 |
| `S` / `L` | 빠른 저장 / 빠른 불러오기 |
| `D` | 디버그 모드 전환 |
| `H` | 도움말 열기 / 닫기 |

게임은 3초 카운트다운 후 시작한다. 빠른 저장 상태는 페이지를 새로 고치면 사라진다.

# Debug Mode

`D`를 누르면 배경·우주선·미사일·운석·합성 패널을 각각 확인할 수 있다.

# Installation

    git clone https://github.com/afrontend/fp-block-game
    cd fp-block-game
    npm install

# Run

    npm start

# Test

    npm test

# Build

    npm run build

# Preview

    npm run preview

# Deploy

`master`에 push하면 GitHub Actions가 테스트를 통과한 뒤 자동으로 GitHub Pages에 배포한다.

수동/로컬 배포가 필요하면:

    npm run deploy

# Web

https://afrontend.github.io/fp-block-game/

# License
MIT © [Bob Hwang](https://afrontend.github.io)
