# ECHO DOESN'T KNOW QA Report

## 테스트 대상 URL

- https://roomescape-nine.vercel.app/game

## 실행 명령어

```bash
npm run build
npm run test:smoke
npm run test:e2e
```

로컬 개발 서버 기준 기존 스모크를 돌리고 싶으면:

```bash
npm run test:local
```

## 테스트 항목

- `/game` 페이지 로드
- 시작 화면의 게임 제목, 시작 버튼, 저장 데이터 삭제 버튼 표시
- `localStorage.setItem("debugMode", "true")` 후 DebugPanel 표시
- DebugPanel의 Chapter 1~4 이동 버튼 동작
- 엔딩 4종 바로 보기 버튼 동작
- 엔딩 이미지 로드 상태 확인
- Chapter 3 / Chapter 4 장면 이미지 로드 상태 확인
- localStorage 게임 진행 저장 초기화
- console error / page runtime error 수집

## Chapter 이동 테스트 결과

DebugPanel을 통해 아래 이동을 검증한다.

- Chapter 1
- Chapter 2
- Chapter 3
- Chapter 4

각 이동 후 저장된 `chapter` 값과 화면 텍스트를 함께 확인한다.

## 엔딩 5종 테스트 결과

DebugPanel 엔딩 바로 보기 버튼으로 아래 엔딩 화면을 검증한다.

- `doctor_completion`: 박사의 완성
- `escape_alone`: 탈출
- `coexistence`: 공존
- `hidden_seoha_name`: 서하의 이름
- `serin_betrayal`: 세린의 배신

각 엔딩은 `ending-screen`, `ending-title`, `ending-image`를 기준으로 검사한다.

## 이미지 깨짐 검사 결과

현재 화면의 모든 `img` 태그에 대해 아래 조건을 검사한다.

- `complete === true`
- `naturalWidth > 0`

검사 대상:

- 시작 화면
- Chapter 3
- Chapter 4
- 엔딩 4종

## Console Error 검사 결과

각 테스트에서 Playwright `console` 이벤트와 `pageerror` 이벤트를 수집한다.
`console.error` 또는 런타임 예외가 발생하면 테스트가 실패한다.

## localStorage 초기화 테스트 결과

테스트는 `echo-doesnt-know-save` 키에 임의 진행 상태를 저장한 뒤, 저장 데이터 삭제 버튼으로 해당 키가 제거되는지 확인한다.
오디오 설정 키는 진행 저장과 별개이므로 초기화 필수 대상이 아니다.

## 발견된 문제

- 시작 화면에서는 DebugPanel이 렌더링되지 않아, `debugMode=true`를 설정해도 곧바로 디버그 버튼을 찾기 어려웠다.
- 엔딩 화면 전용 test id가 부족해 엔딩 제목과 이미지 검증이 다소 불안정했다.

## 수정된 문제

- 시작 화면에서도 `debugMode=true`일 때 DebugPanel이 표시되도록 했다.
- 엔딩 화면에 `ending-screen`, `ending-title`, `ending-image` test id를 추가했다.
- 원격 배포 URL 전용 Playwright smoke spec을 추가했다.
- `test:smoke`와 `test:e2e`가 배포 URL 기준 테스트를 실행하도록 정리했다.

## 남은 TODO

- 실제 플레이 순서로 Chapter 1부터 Chapter 4까지 모든 퍼즐을 직접 클릭해 완주하는 장기 E2E 테스트는 별도 작성 대상이다.
- 현재 테스트는 DebugPanel을 활용한 smoke test이며, 빠른 회귀 검증에 초점을 둔다.
