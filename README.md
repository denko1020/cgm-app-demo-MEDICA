# CGM Test Logger — Medica (디자인 리스킨)

배포된 사이트: <https://denko1020.github.io/cgm-app-demo-MEDICA/>

CGM(연속혈당측정) 앱 화면의 기능을 브라우저에서 시험하기 위한 Expo(React Native) 프로토타입임. 한 코드베이스로 웹·iOS·Android를 모두 빌드하는 구조이며, 현재 단계는 웹에서 기능을 확인하는 구현 단계임.

이 저장소는 [`cgm-app-demo-basic`](https://github.com/denko1020/cgm-app-demo-basic)과 기능은 동일하고 **UI/UX만 다시 디자인한 변형**임. 현재 화면은 **OHC UI Design System Guide (Rev.2026-10)** 를 따르며, 규칙과 토큰은 `@design/DESIGN.md` 에 정리되어 있음.

- **컬러**: 배경 화이트, 면은 블루 틴트 뉴트럴(`#F3F3F5`, `#F9F9F9`, `#F8F9FD`), 포인트는 CARE BLUE `#0064F0`. 따뜻한 계열의 중립색은 쓰지 않음(가이드의 안티 레퍼런스)
- **상태색은 쌍으로 관리**: 채움(`#81B86E`/`#FF5B5B`/`#FFAA2A`)은 아이콘·마커·차트에만 쓰고, 글자가 같은 의미를 전달할 때는 진한 ink(`#2E5E1F`/`#B42323`/`#8A5A00`)를 쓴다. 전송/미전송은 가이드가 고정한 대로 블루/주황
- **형태**: 그림자 없음. 면과 1px 테두리로 구분하고, 라운드는 역할별로 고정(컨트롤 4, 팝업 8, 카드 12, 칩 pill). 모든 터치 타겟 44px 이상
- **타이포**: Pretendard 한 패밀리, 굵기로만 위계를 만든다. 수치는 전부 `tabular-nums`
- **구조**: 카드 안에 카드를 넣지 않음. Home 의 측정값 패널은 한 면을 구분선으로 나눠 측정값·추세 다이얼 / 기록 버튼으로 배치
- **다크 모드**: 가이드는 라이트 테마만 정의하고 다크는 결정 보류 항목(DESIGN.md 13.6)임. 기존 기능을 유지하되 같은 방법으로 파생시켰음 — 중립색은 블루 색상각을 유지하고, 액센트는 같은 색상각을 밝기만 올린 `#3D8EFF`
- 기능·데이터 모델·화면 구성은 `cgm-app-demo-basic` 과 동일함 (변경 없음)

## 실행

```powershell
npm install          # 최초 1회
npm run web          # http://localhost:8081 에서 확인
npm run typecheck    # TypeScript 검사
npm test             # 로컬 단위 테스트 (혈당 모델·건강 지수·CSV)
```

### 색 접근성

가이드가 정한 라이트 토큰은 그대로 쓰고, 직접 정한 다크 토큰은 계산해서 맞추었음. 앱이 실제로 함께 렌더하는 조합(본문/면, muted 텍스트/카드, 상태 ink/배지, 버튼 글자/채움)은 **두 테마 전부 WCAG AA 통과** — 최저값이 라이트 4.64:1(카드 위 블루), 다크 4.88:1임.

이전 리스킨에 남아 있던 라이트 테마의 AA 미달 조합(In range 녹색 2.22:1, 식사 마커 주황 1.97:1, 보조 설명 회색 1.94:1)은 상태색 쌍(ink/fill)과 `#6B6B6B` muted 규칙으로 해소됨. 탭바 활성 라벨은 CARE LIGHT BLUE 바탕에 `#0064F0` 이 4.12:1 밖에 안 나와서 가이드가 지정한 `#013ECC` 를 쓴다.

검증용 스크린샷은 `@design/preview/` 에 있음(라이트·다크, 390px·430px).

화면 좌측 상단의 보기 모드 칩으로 **GLU / KET / LAC / A1c** 를 오감. 앞의 셋은 센서가 직접 재는 분석물(혈당 mg/dL, 케톤·락테이트 mmol/L)이고, HbA1c 는 평균 혈당에서 추정한 값임. 모드를 바꾸면 Home 카드·차트와 Readings 목록이 그 분석물의 값·기준범위·추세를 보임(CSV 는 세 분석물을 모두 열로 내보냄).

브라우저에서는 430px 폭의 휴대폰 프레임 안에 앱이 렌더링됨. 데이터는 브라우저 localStorage에 저장되므로 새로고침 후에도 페어링 상태와 측정값이 유지됨.

## 웹 배포 (GitHub Pages)

공개 주소는 <https://denko1020.github.io/cgm-app-demo-MEDICA/> 이며, 리포는 `github.com/denko1020/cgm-app-demo-MEDICA` 임. `app.json`의 `experiments.baseUrl`이 `/cgm-app-demo-MEDICA`로 잡혀 있어 하위 경로에서 번들이 로드되고, `404.html`을 `index.html` 사본으로 두어 `/settings` 같은 딥링크도 새로고침 후 렌더됨.

리포 루트의 `index.html` 은 그 공개 주소로 보내는 바로가기임 — 파일을 더블클릭하면 브라우저가 열리며 배포된 앱으로 넘어감. 앱의 실제 HTML 템플릿은 `public/index.html` 이고, 루트 파일은 빌드(`expo export`)에도 배포 산출물에도 들어가지 않음.

배포는 `.github/workflows/deploy-pages.yml`이 맡음. main에 푸시하면 Actions가 `npm ci` → `tsc --noEmit` → `expo export --platform web` → Pages 배포를 순서대로 돌리며, 타입 오류가 있으면 배포 전에 멈춤. Pages 소스는 "GitHub Actions"이고 `github-pages` 환경의 배포 허용 브랜치에 main이 등록되어 있음. 푸시 후 1~2분이면 반영됨.

```powershell
npm run deploy:web   # 예비 수단: 로컬에서 export 해 gh-pages 브랜치에 직접 올림
```

`scripts/deploy-web.mjs`는 Actions를 쓸 수 없을 때의 예비 경로임. Pages 소스가 Actions인 동안은 gh-pages 브랜치 푸시만으로는 반영되지 않으므로, 이 경로로 돌아가려면 리포 설정에서 Pages 소스를 gh-pages 브랜치로 되돌려야 함.

## 홈 화면 아이콘 · 전체화면 실행 (영업사원 배포용)

`public/manifest.webmanifest`(PWA, `display: fullscreen`)와 `public/index.html`(iOS 홈 화면 메타 태그)이 들어 있어, 휴대폰에서 홈 화면에 추가하면 아이콘으로 열리고 브라우저 주소창 없이 실행됨. 아이콘 원본은 `assets/icon-source.svg`이며 `public/icons/`의 PNG는 여기서 만든 것임.

- **Android (Chrome)**: 주소 접속 → 우측 상단 ⋮ → 「홈 화면에 추가」 또는 「앱 설치」. 상태바까지 숨긴 완전 전체화면으로 열림
- **iPhone (Safari)**: 주소 접속 → 하단 공유 버튼 → 「홈 화면에 추가」. 주소창 없이 열리며, iOS 정책상 시계·배터리 상태바는 남음. 상태바 자리는 앱 배경이 칠함(위 「iOS 26 상단 흐림 제거」 참고). 메타 태그를 고친 뒤에는 기존 아이콘을 지우고 다시 추가해야 반영됨

## 화면 구성

| 탭 | 기능 |
|---|---|
| Home | 프로필 카드(누르면 Settings 프로필로 이동), 실시간 데이터·배터리·연결·업로드 상태, 현재 값·상태(정상/높음/낮음)와 추세 다이얼, 식사·운동·수면·복약 기록 버튼, Reports·Find ER 버튼, 최근 측정값 차트(최근 180개, 기준범위 띠와 시나리오·이벤트 세로 마커) |
| Readings | CGM/BGM 측정값 목록, 업로드 여부 표시, `+`로 BGM(혈당측정기) 값 수동 입력, 내려받기 아이콘으로 전체 측정값 CSV 내보내기. 시나리오 전환과 사용자가 기록한 이벤트가 목록 사이에 표시됨 |
| Devices | `+`로 센서 검색, 연결, 페어링 목록. 항목 선택 시 기기 프로필 |
| Device Profile | 일반 정보, 알고리즘 파라미터(보정 기울기·오프셋·평활화 윈도) 편집, 제조사·펌웨어·IEEE·배터리·센서 시작 시각·사용 기간·잔여 기간, 연결 해제·연결 끊김 시뮬레이션·기기 삭제 |
| Stats | CGM/BGM 측정값 수와 미업로드 수, 최근 24시간 요약, 건강 지수 절(활동 분·걸음 수·식후 상승폭·목표 범위 유지율과 그 위의 지수), 수동 업로드, 업로드 실패 시뮬레이션, 측정값 CSV 내보내기, 측정값 전체 삭제 |
| Settings | 다크 모드, 언어(English/한국어/Español), 혈당·HbA1c 단위, 프로필, 비상 연락처, 목표 범위·알림, 자동 업로드, 시뮬레이터 간격·시나리오, 데이터 전체 초기화, 앱 정보 |

## 가상 센서 시뮬레이터

실제 BLE 센서 대신 앱 내부의 `SimulatedTransport`가 혈당값을 생성함.

- 검색 시 가상 기기 2대(CGM S1, S2)가 나타남
- 연결 후 설정한 간격(5·10·30·60·300초)마다 원시 혈당값을 발행하며, 저장소가 보정·평활화를 적용해 표시값을 계산함
- 시나리오: 정상(105 mg/dL 부근), 식사(약 +90 mg/dL 상승 후 복귀), 저혈당(55 부근), 고혈당(260 부근). 어느 시나리오든 기준선이 주기가 다른 두 사인파(95분·35분, 최대 ±8 mg/dL)로 천천히 흔들려서, 쉬는 구간에서도 차트가 직선이 아니라 완만한 물결로 보임(`GlucoseModel` 의 `drift` 옵션, 0 이면 끔). 시나리오를 바꾸면 가상 시계 시각으로 변경 이벤트가 기록되어 Readings 목록과 CSV에 `scenario` 행으로 들어감
- 걸음 수는 `ActivityTransport`(`src/core/activity/`)의 시뮬레이터 구현이 가상 시계 1분마다 한 창씩 발행함(일상 걸음 분당 0~8보). 배속·일시정지를 CGM 과 같이 따르므로 100x 에서 하루치 활동이 약 15분에 쌓임. 웹에는 걸음 API 가 없고, 네이티브 만보기(expo-sensors Pedometer·HealthKit·Health Connect)는 `createActivityTransport.ts` 에서 갈아 끼움
- 배터리는 50회 측정마다 1% 감소함
- 화면 우측 상단 배속 토글로 시뮬레이션 속도를 1x·2x·5x·10x·50x·100x로 조절함. 그 왼쪽의 ⏸/▶ 칩은 가상 시계와 센서 발행을 함께 멈추고 재개함(연결은 유지되며, 재개 시 측정값이 즉시 한 번 발행됨). 배속을 올리면 측정 간격이 실제 시간 기준으로 짧아지고, 측정값 시각·센서 사용 기간·24시간 통계가 가상 시계 기준으로 빠르게 진행됨 (100x에서 15일 착용 기간이 3.6시간에 끝남)
- 기기 프로필의 「연결 끊김 시뮬레이션」으로 링크 손실 처리 확인 가능
- Stats의 「다음 업로드 실패 처리」로 업로드 실패 경로 확인 가능

## 건강 지수

Stats 탭의 「건강 지수」 절은 재료를 먼저 보이고 지수를 그 위에 얹는 구조임. 재료는 최근 24시간(가상 시계 기준)의 관측값 — 활동 분, 걸음 수, 식후 상승폭(마지막 식사 직전 값 대비 2시간 안 최고값 — 식사는 Settings의 시나리오 전환이나 Home에서 기록한 식사 이벤트 둘 다 인정), 목표 범위 유지율 — 이고, 지수는 `src/core/util/healthIndex.ts` 의 `healthScore()` 한 함수임. 현재 가중치는 유지율 40 %, 활동 분 30 %(하루 30분이면 만점), 식후 상승폭 30 %(30 mg/dL 이하 만점, 120 이상 0점, 식사 없으면 감점 없음)이며 정의가 바뀌면 그 함수만 고치면 됨. 좌측 상단 보기 모드(GLU/KET/LAC/A1c)가 측정값 하나를 보여주는 것과 달리, 이쪽은 하루 단위 요약임.

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
  i18n/                   영문·한글·스페인어 사전
  util/                   서식·24시간 요약·CSV 직렬화·파일 내보내기·건강 지수 재료 유틸
src/ui/                   테마, 공통 컴포넌트, SVG 차트
```

### iOS 26 상단 흐림 제거

iOS 26 은 화면 위쪽에 Liquid Glass 페이드(scroll edge effect)를 자동으로 그린다. 보기 모드·배속 칩이 그 구간에 들어가 흐려 보였다. Android 에는 대응 효과가 없어 iOS 에서만 보였고, 경로가 둘이라 양쪽을 각각 뜸.

**홈 화면 PWA (현재 시연 경로)**: 실측값은 아이폰 16 Pro 기준 화면 위에서 **98pt**(상태바 62pt + 36pt)였고, 그 구간이 끝나는 지점에서야 앱 배경색 `#141311` 이 나왔다. 효과 자체는 끌 수 없으므로 **그 띄에 아무것도 두지 않는** 방향으로 해결함 — `app/_layout.tsx` 의 프레임이 `IOS_WEB_APP_FOG`(40pt) 만큼 아래로 밀어서 칩까지 전부 띄 밖에 두고, 그 띄에는 프레임 배경색만 남긴다. 단색을 흐리면 같은 단색이므로 효과가 보이지 않는다.

`public/index.html` 의 `apple-mobile-web-app-status-bar-style=black-translucent` 는 그래서 유지함. 이걸 빼면 iOS 가 불투명 시스템 상태바를 올리는데, 그 흰색 띄는 다크 모드를 따라가지 못해 더 눈에 띄었다(theme-color 를 런타임에 바꿔도 iOS 가 무시함). 반면 translucent 상태바는 그 자리를 앱 배경이 칠하므로 테마를 그대로 따른다. 문서 배경·`color-scheme` 도 다크 스위치에 맞춰 갱신함(React Native Web 은 앱 내부만 칠하고 문서는 건드리지 않음).

**iOS 는 이 메타 태그를 홈 화면에 추가할 때만 읽는다** — 깔아둔 아이콘은 삭제 후 다시 추가해야 반영됨.

**네이티브 빌드**: UIKit 이 모든 스크롤 뷰의 위쪽 가장자리에 같은 효과를 걸어 둔다. `src/ui/components/NoScrollEdgeEffect.ios.tsx` 가 react-native-screens 의 `ScrollViewMarker` 로 위쪽 효과만 끄고, 다른 플랫폼에서는 뷰를 더하지 않고 그대로 통과시킨다. 공용 `Screen` 과 Readings 의 `FlatList` 에 적용됨. Stack `screenOptions` 의 `scrollEdgeEffects` 는 중첩 내비게이터 안의 스크롤 뷰에는 적용되지 않아 쓰지 않았다.

## iOS/Android 확장 경로

1. 실제 BLE 전송 추가: `CgmTransport` 인터페이스를 구현하는 클래스(예: react-native-ble-plx 기반)를 작성하고 `createTransport.ts`에서 플랫폼별로 반환함. 화면·저장소 코드는 변경하지 않음
2. 서버 업로드: `UploadService` 인터페이스를 HTTP 구현으로 교체함
3. 네이티브 빌드: `npx expo run:android` / `npx expo run:ios` (Android Studio 또는 Xcode 필요) 또는 EAS Build 사용. `app.json`의 `bundleIdentifier`·`package`는 이미 지정되어 있음

## 기술 스택

Expo SDK 57, React Native 0.86, React 19.2, expo-router, zustand, react-native-svg, @react-native-async-storage/async-storage, TypeScript strict.
