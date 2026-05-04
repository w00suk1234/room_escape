# Room Escape: Who Remembers Echo

SF 기억 실험실을 배경으로 한 방탈출 비주얼노벨 게임입니다. 플레이어는 이름을 잃은 채 격리실에서 깨어나고, 관찰 기록과 비공식 통신, 불완전한 AI ECHO의 흔적을 따라 자신의 이름과 마지막 선택의 의미를 찾아갑니다.

배포 주소: https://roomescape-nine.vercel.app/game

## 주요 특징

- 4개 챕터 구성의 스토리형 방탈출 게임
- 오브젝트 조사, 대화 선택, 퍼즐 풀이를 결합한 비주얼노벨 진행
- Chapter 1~4에 이어지는 기억 조각, 사진 조각, 세린 경고 메모, 마지막 문장 단서 연동
- ECHO, 한세린, 차도윤, 이안, 서하의 관계를 중심으로 한 멀티 엔딩 구조
- 저장/이어하기는 브라우저 `localStorage` 기반으로 동작
- 챕터별 배경 이미지, 캐릭터 초상, 오디오 루프, 엔딩 이미지 적용

## 앱 구성

- `StartScreen`: 홈 타이틀 화면. 메인 비주얼, 시작/이어하기/저장 삭제 버튼을 표시합니다.
- `GameScene`: Chapter 1 격리실 조사 화면입니다.
- `Chapter2Scene`: 관찰실, 감시 피드, 전력 패널, 통신 콘솔, 보안 게이트 흐름을 담당합니다.
- `Chapter3Scene`: 기억 실험실 조사와 실험 순서 복원 퍼즐을 담당합니다.
- `Chapter4Scene`: 코어 룸, 마지막 문장 복원, 최종 선택과 엔딩 화면을 담당합니다.
- `DialogueBox`: 캐릭터 대화와 선택지를 표시합니다.
- `InvestigationModal` / `PuzzleModal`: 오브젝트 조사 결과와 퍼즐 UI를 표시합니다.
- `HudBar` / `InventoryBar` / `LogPanel`: 챕터 정보, 인벤토리, 조사 로그를 표시합니다.
- `useAudioManager`: BGM, 효과음, 엔딩 음악 재생을 관리합니다.
- `local-save`: 브라우저 저장/이어하기 데이터를 관리합니다.

## 챕터 구성

### Chapter 1. 깨어난 방

격리실에서 깨어난 이안은 한세린의 비공식 통신을 통해 방 안의 단서를 찾습니다. 책상 메모, 카드키, 이름 조각, 사진 조각, 세린 경고 메모가 이후 챕터의 감정선과 히든 엔딩 조건으로 이어집니다.

주요 퍼즐:
- 문 패널 접근 코드: `0427`

### Chapter 2. 관찰실

격리실을 빠져나온 줄 알았던 이안은 자신이 있던 방이 관찰 대상 공간이었다는 사실을 확인합니다. 감시 사각지대와 전력 분배, 통신 복구를 통해 보안 게이트를 엽니다.

주요 퍼즐:
- 감시 피드 정답: `B-04`
- 전력 패널 순서: `관찰 전력 → 통신 전력 → 게이트 전력`

### Chapter 3. 기억 실험실

이안이 단순한 피험자가 아니라 실험의 공동 설계자였다는 사실이 드러납니다. ECHO 원본 데이터에서 서하의 이름이 확인되고, 한세린이 박사를 믿었던 이유도 회수됩니다.

주요 퍼즐:
- 실험 순서 복원: `서하 진단 → 이안 동의 → ECHO 이식 → 기억 봉인`

### Chapter 4. 코어 룸

ECHO 코어와 마주하고 마지막 문장을 복원합니다. 플레이어가 모은 단서와 세린의 신뢰 상태에 따라 엔딩이 갈립니다.

주요 퍼즐:
- 마지막 문장: `나를 → 완성하지 말고 → 기억해줘`

## 엔딩

- 탈출
- 세린의 배신
- 박사의 완성
- 공존
- 서하의 이름

히든 엔딩인 `서하의 이름`은 이름 조각, 사진 조각, 세린 동기 이해, 서하 이름, 마지막 문장을 모두 연결했을 때 열리는 루트입니다.

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Playwright
- Vercel

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:3000/game
```

## 빌드

```bash
npm run build
```

## 테스트

```bash
npm run check:assets
npm run test:smoke -- --reporter=line
```

## 프로젝트 구조

```text
app/
  api/               힌트, ECHO 응답, 단서 분석용 mock API route
  game/page.tsx      전체 게임 상태, 챕터 진행, 퍼즐/엔딩 분기 제어
  layout.tsx         사이트 메타데이터와 루트 레이아웃
  globals.css        전역 스타일, 배경, 애니메이션, 공통 패널 스타일

components/
  StartScreen.tsx              홈 타이틀 화면
  GameScene.tsx                Chapter 1 씬
  Chapter2Scene.tsx            Chapter 2 씬
  Chapter3Scene.tsx            Chapter 3 씬
  Chapter4Scene.tsx            Chapter 4 씬과 엔딩 화면
  DialogueBox.tsx              대화창과 선택지
  InvestigationModal.tsx       조사 모달
  PuzzleModal.tsx              퍼즐 모달
  HudBar.tsx                   상단 HUD
  InventoryBar.tsx             인벤토리
  LogPanel.tsx                 조사 로그
  AudioControls.tsx            오디오 설정

data/
  chapter1.ts                  Chapter 1 오브젝트, 이미지, 텍스트 데이터
  chapter1Dialogues.ts         Chapter 1 통신 대화 데이터
  chapter2.ts                  Chapter 2 오브젝트, 이미지, 퍼즐 데이터
  chapter2Dialogues.ts         Chapter 2 대화 데이터
  chapter3.ts                  Chapter 3 오브젝트, 퍼즐, 시나리오 데이터
  chapter4.ts                  Chapter 4 오브젝트, 최종 문장, 선택 데이터
  endings.ts                   엔딩 본문, 이미지, 음악 데이터
  audio.ts                     BGM/SFX 경로
  characters.ts                캐릭터 초상 이미지 경로

hooks/
  useAudioManager.ts           BGM/SFX/엔딩 음악 재생 관리

lib/
  game-state.ts                초기 게임 상태, 상태 정규화, 아이템/로그 유틸
  local-save.ts                localStorage 저장/불러오기/삭제
  dialogue-engine.ts           데이터 기반 대화 처리 유틸
  mock-ai.ts                   mock AI 응답 유틸

public/
  assets/                      챕터 배경, 캐릭터, 엔딩, 오디오 에셋
  images/home-hero.png         홈 메인 비주얼 이미지

scripts/
  check-assets.mjs             데이터에 등록된 에셋 경로 검증

tests/
  roomescape-smoke.spec.ts     공개 배포판 기준 Playwright 스모크 테스트

types/
  game.ts                      게임 상태, 플래그, 아이템, 오브젝트 타입
```

## 저장 방식

이어하기 데이터는 서버가 아니라 각 브라우저의 `localStorage`에 저장됩니다.

- 저장 키: `echo-doesnt-know-save`
- 각 컴퓨터/브라우저에만 저장됩니다.
- 다른 사람의 진행도와 공유되지 않습니다.
- 홈 화면의 `저장 데이터 삭제` 버튼으로 삭제할 수 있습니다.

## 배포

현재 Vercel에 배포되어 있습니다.

```text
https://roomescape-nine.vercel.app/game
```

## 크레딧

스토리/시나리오/게임 구성: Who Remembers Echo 프로젝트
