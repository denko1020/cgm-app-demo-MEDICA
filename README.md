# CGM Test Logger — Medica (디자인 리스킨)

배포된 사이트: <https://denko1020.github.io/cgm-app-demo-MEDICA/>

CGM(연속혈당측정) 앱 화면의 기능을 브라우저에서 시험하기 위한 Expo(React Native) 프로토타입임. 한 코드베이스로 웹·iOS·Android를 모두 빌드하는 구조이며, 현재 단계는 웹에서 기능을 확인하는 구현 단계임.

이 저장소는 [`cgm-app-demo-basic`](https://github.com/denko1020/cgm-app-demo-basic)과 기능은 동일하고 **UI/UX만 의료기기 앱 느낌으로 다시 디자인한 변형**임.

- 배경은 화이트를 기본으로 하고, 카드·탭바·세그먼트 트랙 등 표면 요소에 연한 베이지/그레이 톤(`#F7F5F0`, `#EFEAE0`)을 포인트로 사용
- 선택·활성 상태(세그먼트 선택, 연결 버튼, 활성 탭, 뷰 모드/배속 토글 등)는 전부 `rgb(0, 100, 240)` 액센트 블루로 통일
- 혈당 상태(정상/고/저), 연결·업로드 상태, 시나리오 마커 등 **기능적 의미를 가진 빨강/주황/초록 색상은 원본 그대로 유지**
- 카드형 레이아웃(둥근 모서리 + 은은한 그림자)으로 iOS 기본 grouped-list 느낌의 하드 헤어라인을 대체
- 기능·데이터 모델·화면 구성은 `cgm-app-demo-basic`과 100% 동일함 (변경 없음)

## 실행

```powershell
npm install          # 최초 1회
npm run web          # http://localhost:8081 에서 확인
npm run typecheck    # TypeScript 검사
npm test             # 로컬 단위 테스트 (혈당 모델·건강 지수·CSV)
```

화면 좌측 상단의 보기 모드 칩으로 혈당 모드와 건강 지수 모드를 오감. 건강 지수(%)는 혈당 40~300 mg/dL을 0~100%에 선형 대응시킨 포만감 지수를 100에서 뺀 값(`healthIndex`)이며, 건강 모드에서는 Home 카드·차트와 Readings 목록이 그 값을 보임(Stats 요약과 CSV의 값 열은 mg/dL 그대로).

브라우저에서는 430px 폭의 휴대폰 프레임 안에 앱이 렌더링됨. 데이터는 브라우저 localStorage에 저장되므로 새로고침 후에도 페어링 상태와 측정값이 유지됨.

## 웹 배포 (GitHub Pages)

공개 주소는 <https://denko1020.github.io/cgm-app-demo-MEDICA/> 이며, 리포는 `github.com/denko1020/cgm-app-demo-MEDICA` 임. `app.json`의 `experiments.baseUrl`이 `/cgm-app-demo-MEDICA`로 잡혀 있어 하위 경로에서 번들이 로드되고, `404.html`을 `index.html` 사본으로 두어 `/settings` 같은 딥링크도 새로고침 후 렌더됨.

배포는 `.github/workflows/deploy-pages.yml`이 맡음. main에 푸시하면 Actions가 `npm ci` → `tsc --noEmit` → `expo export --platform web` → Pages 배포를 순서대로 돌리며, 타입 오류가 있으면 배포 전에 멈춤. Pages 소스는 "GitHub Actions"이고 `github-pages` 환경의 배포 허용 브랜치에 main이 등록되어 있음. 푸시 후 1~2분이면 반영됨.

```powershell
npm run deploy:web   # 예비 수단: 로컬에서 export 해 gh-pages 브랜치에 직접 올림
```

`scripts/deploy-web.mjs`는 Actions를 쓸 수 없을 때의 예비 경로임. Pages 소스가 Actions인 동안은 gh-pages 브랜치 푸시만으로는 반영되지 않으므로, 이 경로로 돌아가려면 리포 설정에서 Pages 소스를 gh-pages 브랜치로 되돌려야 함.

## 화면 구성

| 탭 | 기능 |
|---|---|
| Home | 실시간 데이터·배터리·연결·업로드 상태 표시, 현재 혈당(또는 건강 지수)·추세 화살표, 최근 측정값 차트(최근 180개, 목표 범위 띠와 시나리오 변경 세로 마커, 보기 모드에 따라 mg/dL 또는 건강 지수) |
| Readings | CGM/BGM 측정값 목록, 업로드 여부 표시, `+`로 BGM(혈당측정기) 값 수동 입력, 내려받기 아이콘으로 전체 측정값 CSV 내보내기. 시뮬레이터 시나리오를 바꾼 시점이 목록 사이에 표시됨 |
| Devices | `+`로 센서 검색, 연결, 페어링 목록. 항목 선택 시 기기 프로필 |
| Device Profile | 일반 정보, 알고리즘 파라미터(보정 기울기·오프셋·평활화 윈도) 편집, 제조사·펌웨어·IEEE·배터리·센서 시작 시각·사용 기간·잔여 기간, 연결 해제·연결 끊김 시뮬레이션·기기 삭제 |
| Stats | CGM/BGM 측정값 수와 미업로드 수, 최근 24시간 요약, 건강 지수 절(활동 분·걸음 수·식후 상승폭·목표 범위 유지율과 그 위의 지수), 수동 업로드, 업로드 실패 시뮬레이션, 측정값 CSV 내보내기, 측정값 전체 삭제 |
| Settings | 언어(영문/한글), 혈당 단위, 목표 범위, 자동 업로드, 시뮬레이터 간격·시나리오, 데이터 전체 초기화, 앱 정보 |

## 가상 센서 시뮬레이터

실제 BLE 센서 대신 앱 내부의 `SimulatedTransport`가 혈당값을 생성함.

- 검색 시 가상 기기 2대(CGM S1, S2)가 나타남
- 연결 후 설정한 간격(5·10·30·60·300초)마다 원시 혈당값을 발행하며, 저장소가 보정·평활화를 적용해 표시값을 계산함
- 시나리오: 정상(105 mg/dL 부근), 식사(약 +90 mg/dL 상승 후 복귀), 저혈당(55 부근), 고혈당(260 부근). 시나리오를 바꾸면 가상 시계 시각으로 변경 이벤트가 기록되어 Readings 목록과 CSV에 `scenario` 행으로 들어감
- 걸음 수는 `ActivityTransport`(`src/core/activity/`)의 시뮬레이터 구현이 가상 시계 1분마다 한 창씩 발행함(일상 걸음 분당 0~8보). 배속·일시정지를 CGM 과 같이 따르므로 100x 에서 하루치 활동이 약 15분에 쌓임. 웹에는 걸음 API 가 없고, 네이티브 만보기(expo-sensors Pedometer·HealthKit·Health Connect)는 `createActivityTransport.ts` 에서 갈아 끼움
- 배터리는 50회 측정마다 1% 감소함
- 화면 우측 상단 배속 토글로 시뮬레이션 속도를 1x·2x·5x·10x·50x·100x로 조절함. 그 왼쪽의 ⏸/▶ 칩은 가상 시계와 센서 발행을 함께 멈추고 재개함(연결은 유지되며, 재개 시 측정값이 즉시 한 번 발행됨). 배속을 올리면 측정 간격이 실제 시간 기준으로 짧아지고, 측정값 시각·센서 사용 기간·24시간 통계가 가상 시계 기준으로 빠르게 진행됨 (100x에서 15일 착용 기간이 3.6시간에 끝남)
- 기기 프로필의 「연결 끊김 시뮬레이션」으로 링크 손실 처리 확인 가능
- Stats의 「다음 업로드 실패 처리」로 업로드 실패 경로 확인 가능

## 건강 지수

Stats 탭의 「건강 지수」 절은 재료를 먼저 보이고 지수를 그 위에 얹는 구조임. 재료는 최근 24시간(가상 시계 기준)의 관측값 — 활동 분, 걸음 수, 식후 상승폭(마지막 식사 시나리오 전환 직전 값 대비 2시간 안 최고값), 목표 범위 유지율 — 이고, 지수는 `src/core/util/healthIndex.ts` 의 `healthScore()` 한 함수임. 현재 가중치는 유지율 40 %, 활동 분 30 %(하루 30분이면 만점), 식후 상승폭 30 %(30 mg/dL 이하 만점, 120 이상 0점, 식사 없으면 감점 없음)이며 정의가 바뀌면 그 함수만 고치면 됨. 좌측 상단 보기 모드의 건강 지수(측정값 하나를 100−포만감 지수로 바꾼 값)와는 다른 것으로, 이쪽은 하루 단위 요약임.

활동 분은 운동 축이 사라진 자리를 걸음 속도로 대신 판정함 — 한 창(가상 시계 1분)의 걸음이 분당 60보 이상이면 활동한 것으로 셈(`ACTIVE_STEPS_PER_MIN`). 가상 만보기는 일상 걸음만 내보내므로 시뮬레이터에서는 이 값이 0분으로 유지되며, 네이티브 만보기를 붙이면 실제 걸음 속도로 채워짐. 걸음 수 자체는 창 전부를 더함.

검증은 `src/core/cgm/glucoseModel.test.ts`(정상·식사·저혈당·고혈당 궤적), `src/core/util/healthIndex.test.ts`(걸음 속도 판정과 지수), `src/core/util/csv.test.ts`(타임라인 병합과 열 구성)가 맡음.

## 구조

```
app/                      expo-router 화면 (파일 = 라우트)
  _layout.tsx             루트 스택, 전송 계층 부트스트랩, 웹용 휴대폰 프레임
  (tabs)/                 하단 탭 5개
  device/[id].tsx         기기 프로필
src/core/                 플랫폼 독립 도메인 계층
  types.ts                도메인 타입
  cgm/CgmTransport.ts     센서 링크 인터페이스 (scan/connect/disconnect/onReading/onStatus)
  cgm/SimulatedTransport.ts  가상 센서 구현
  cgm/createTransport.ts  전송 구현 선택 지점
  cgm/cgmController.ts    전송·업로드·저장소 연결
  cgm/glucoseModel.ts     시나리오를 받는 순수 혈당 생성 모델 (테스트 대상)
  activity/               ActivityTransport 인터페이스, 가상 만보기, 팩토리, 컨트롤러
  upload/UploadService.ts 업로드 인터페이스 + Mock 구현
  store/appStore.ts       zustand 상태 (AsyncStorage 영속)
  i18n/                   영문·한글 사전
  util/                   서식·24시간 요약·CSV 직렬화·파일 내보내기·건강 지수 재료 유틸
src/ui/                   테마, 공통 컴포넌트, SVG 차트
```

## iOS/Android 확장 경로

1. 실제 BLE 전송 추가: `CgmTransport` 인터페이스를 구현하는 클래스(예: react-native-ble-plx 기반)를 작성하고 `createTransport.ts`에서 플랫폼별로 반환함. 화면·저장소 코드는 변경하지 않음
2. 서버 업로드: `UploadService` 인터페이스를 HTTP 구현으로 교체함
3. 네이티브 빌드: `npx expo run:android` / `npx expo run:ios` (Android Studio 또는 Xcode 필요) 또는 EAS Build 사용. `app.json`의 `bundleIdentifier`·`package`는 이미 지정되어 있음

## 기술 스택

Expo SDK 57, React Native 0.86, React 19.2, expo-router, zustand, react-native-svg, @react-native-async-storage/async-storage, TypeScript strict.
