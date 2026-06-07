# 온마음 (ONMAUM)

얼굴 표정으로 일별 마음 상태를 살펴보는 웹앱. 감정 노동자가 자신의 표정 변화를 모니터링하고 위험 신호를 일찍 알아차릴 수 있도록 돕는 도구.

**모든 데이터는 사용자 디바이스에만 저장됩니다.** 서버 없이 브라우저 IndexedDB로만 동작 (프라이버시 우선).

## 주요 기능

- 📷 **실시간 감정 분석** — 웹캠으로 표정을 감지하여 4가지 감정(기쁨/평온/슬픔/화남) 확률 표시
- 💾 **1분 단위 자동 저장** — IndexedDB에 누적 (오프라인 가능)
- 📊 **일별 위험도 + 7일 추세** — 부정 비율과 평탄 정서 기반 자동 계산
- 🌿 **자기 돌봄 팁** — 일상에서 할 수 있는 작은 돌봄 권유
- 🔔 **위험 신호 모달 + 알림** — 위험 상태일 때 부드러운 권유 + 정신건강 hotline (1577-0199, 1393)
- 📱 **PWA** — 홈 화면에 설치, 오프라인에서도 동작
- 🧑‍💼 **관리자 케어 대시보드 (시연용)** — `/admin`에서 직원별 스트레스 요약·관리 필요 사유를 확인하고 휴식 권장 등 조치를 기록 (자세한 내용은 [관리자 대시보드](#관리자-대시보드-시연용) 참고)

## 기술 스택

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (디자인 토큰)
- **face-api.js** (SSD MobileNet + Face Landmark 68 + Face Expression)
- **Dexie 4** + **dexie-react-hooks** (IndexedDB)
- **Recharts** (추세 그래프)
- **Vitest** + **happy-dom** + **fake-indexeddb** (테스트)

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

### 처음 실행 시
- face-api.js 모델 약 5.4MB 자동 다운로드 (`public/models/`에서 정적 서빙)
- 카메라 권한 요청 → 허용 필요 (얼굴 분석은 모두 브라우저 내에서 처리)

### 페이지 구조
- `/` — 측정 (카메라 + 실시간 감정 표시)
- `/stats` — 통계 + 자기 돌봄 (일별 위험도, 7일 추세, 최근 기록, 알림 토글)
- `/admin` — 관리자 케어 대시보드 (시연용 코드 입력 후 접근, 자세한 내용은 아래 참고)

## 테스트

```bash
npm run test          # watch 모드
npm run test:run      # 단발 실행 (CI)
npm run test:ui       # 브라우저 UI
```

현재 테스트: **75 passed + 4 skipped** (관리자 대시보드 테스트 추가 후 `npm run test:run`으로 최신 결과 확인 필요)
- `lib/`: aggregator (12), repository (6), riskCalculator (15), selfCareTips (5)
- `hooks/`: useEmotionRecorder (1 + 4 skip), useWarningDismissal (6), useNotificationPermission (6), useRiskNotification (6)
- `components/`: RiskWarningModal (6), ContactsFooter (3), SelfCareTip (3), NotificationToggle (6)
- `lib/admin*` (`adminAuth`, `adminMetrics`, `adminActionMessages`) + `components/admin/*` (`AdminLoginForm`, `AdminGuard`, `AdminSummaryCards`, `CarePriorityList`, `AdminTodayActions`, `EmployeeStressTable`, `EmployeeDetailPanel`, `AdminPrivacyNotice`, `AdminDashboard`) — 관리자 대시보드 전용 테스트

## Production Build

```bash
npm run build
npm start
```

`/`, `/stats`가 static prerendered되어 정적 호스팅 가능.

## Vercel 배포

이 프로젝트는 별도 환경변수나 서버 의존성이 없어서 **Vercel에 그대로 배포**할 수 있습니다.

### 1. GitHub에 푸시

```bash
# 최초 1회: GitHub에 빈 레포 생성 후
git remote add origin https://github.com/<사용자명>/onmaum.git
git branch -M main
git push -u origin main
```

### 2. Vercel 연결 (둘 중 한 가지)

**A. Vercel 대시보드 (권장)**
1. [vercel.com/new](https://vercel.com/new) 접속
2. GitHub 레포 선택 → Import
3. Framework: **Next.js** 자동 감지
4. Build/Output 설정 그대로 → **Deploy**
5. 약 2분 후 배포 완료, `https://<프로젝트>.vercel.app` 자동 발급

**B. Vercel CLI**
```bash
npm install -g vercel
vercel              # 첫 실행 시 로그인 + 프로젝트 연결
vercel --prod       # production 배포
```

### 3. 배포 후 확인 사항
- 카메라 권한: **HTTPS 필수** (Vercel은 자동 HTTPS)
- PWA 설치 가능: 모바일/데스크톱 브라우저에서 "홈 화면에 추가"
- Service Worker 캐싱: 두 번째 진입부터 face-api 모델 즉시 로드
- 알림 권한: HTTPS에서만 동작 (자동 만족)

### 4. 환경변수
**없음.** 모든 처리는 클라이언트 사이드. 외부 API 키나 시크릿 불필요.

## 프로젝트 구조

```
app/
  layout.tsx           Navigation + ContactsFooter + SW 등록
  page.tsx             /        측정 페이지
  stats/
    page.tsx           /stats   통계 + 돌봄 페이지
  admin/
    page.tsx           /admin   관리자 케어 대시보드 (AdminGuard로 보호)
  globals.css          Tailwind v4 @theme + Pretendard

components/
  Navigation.tsx           상단 탭 (측정/통계)
  CameraView.tsx           웹캠 미리보기 + stream 관리
  EmotionDisplay.tsx       실시간 감정 막대 + dominant
  DailyRiskCard.tsx        오늘 위험도 큰 카드 (양호/주의/위험)
  TrendChart.tsx           최근 7일 막대 그래프 (recharts)
  RecentRecords.tsx        최근 5개 record 리스트
  SelfCareTip.tsx          자기 돌봄 한 줄 카드 (회전)
  RiskWarningModal.tsx     warning 시 자동 모달 + hotline
  ContactsFooter.tsx       페이지 푸터 (1577-0199 + 1393)
  NotificationToggle.tsx   브라우저 알림 토글
  ServiceWorkerRegistrar.tsx  SW 클라이언트 등록
  admin/
    AdminGuard.tsx           세션 유무에 따라 로그인 폼/대시보드 분기
    AdminLoginForm.tsx       데모 코드 로그인 폼
    AdminDashboard.tsx       필터/정렬 + 하위 컴포넌트 조합
    AdminSummaryCards.tsx    전체/단계별 인원수, 평균 스트레스 요약 카드
    CarePriorityList.tsx     관리 필요 직원 Top 3
    AdminTodayActions.tsx    오늘의 관리자 액션 (최대 5건)
    EmployeeStressTable.tsx  직원별 오늘 요약 테이블
    EmployeeDetailPanel.tsx  선택 직원 상세 + 조치 기록
    AdminPrivacyNotice.tsx   관리자 화면의 데이터 범위 안내

hooks/
  useEmotionRecorder.ts        분석 루프 + 1분 buffer + 자동 저장
  useWarningDismissal.ts       sessionStorage로 모달 dismiss 추적
  useNotificationPermission.ts 알림 권한 상태 + request
  useRiskNotification.ts       warning 진입 시 알림 표시
  useAdminAuth.ts              관리자 세션 상태 + 로그인/로그아웃

lib/
  emotionAnalysis.ts       face-api 모델 로드 + 분석 + dominant
  emotionAggregator.ts     500ms 샘플 → 1분 record 집계 (순수 함수)
  emotionRepository.ts     EmotionRecord CRUD (Dexie)
  db.ts                    Dexie 인스턴스 + 스키마
  riskCalculator.ts        DailyRisk 계산 (negativeRatio + flatAffectAvg)
  selfCareTips.ts          자기 돌봄 팁 정적 리스트 + 랜덤 select
  adminAuth.ts             관리자 데모 인증 (sessionStorage 기반)
  adminTypes.ts            관리자 화면 전용 표시용 타입
  adminMetrics.ts          관리 필요/데이터 확인 필요 판단, 정렬·필터, 라벨 변환
  adminActionMessages.ts   권장 조치 → 안내 문구 매핑
  adminDemoData.ts         발표 시연용 샘플 직원 5명 데이터
  adminDataAdapter.ts      직원 요약/상세 조회 어댑터 (서버 연동 시 내부만 교체)

public/
  models/              face-api 모델 6개 (5.4MB)
  manifest.json        PWA 메타
  icon.svg             앱 아이콘
  sw.js                Service Worker

docs/superpowers/
  specs/               설계 스펙 (Step 3, 6)
  plans/               implementation plan (Step 3, 6)
```

## 데이터 모델 요약

```typescript
type Emotion = 'happy' | 'calm' | 'sad' | 'angry'
type RiskLevel = 'good' | 'caution' | 'warning'

interface EmotionRecord {        // 1분 단위 집계
  id: number
  timestamp: Date
  duration: number               // 실제 얼굴 감지된 ms
  detectionRate: number          // 0~1
  happy/calm/sad/angry: number   // 평균 확률
  dominantEmotion: Emotion
  flatAffectScore: number        // 1 - (dominant 변화 / (감지샘플 - 1))
}

interface DailyRisk {            // 그날 record들의 집계 (lazy 계산)
  date: string                   // YYYY-MM-DD
  riskLevel: RiskLevel
  negativeRatio: number          // sad + angry × 1.5 (가중)
  flatAffectAvg: number
}
```

## 위험도 계산 로직

```
사용 record:  duration ≥ 10초인 record만 (노이즈 필터)
가중 평균:    duration 비례
negativeRatio = Σ((sad + angry × 1.5) × duration) / Σ(duration)
flatAffectAvg = Σ(flatAffectScore × duration) / Σ(duration)

riskLevel:
  good      negativeRatio < 0.3 AND flatAffectAvg < 0.85
  warning   negativeRatio ≥ 0.5 OR flatAffectAvg ≥ 0.95
  caution   그 외
```

화남(angry) 가중치 1.5는 face-api 표정 모델의 angry 인식률이 약하다는 점을 보정하기 위함.

## 관리자 대시보드 (시연용)

`/admin`은 회사 차원에서 휴식 권장이나 상태 확인이 필요한 대상을 파악할 수 있도록 직원별 요약 정보를 보여주는 **케어 지원 화면**입니다. 의료 진단이나 인사 평가 목적이 아니며, 직원의 얼굴 이미지나 원시 감정 로그는 화면 어디에도 노출하지 않습니다.

- **접근 방식**: 데모용 코드(`onmaum-admin`)를 입력하면 `sessionStorage`에 세션이 저장되고 `AdminGuard`가 대시보드를 노출합니다 (별도 로그인 서버 없음, 발표 시연 전용).
- **보여주는 정보**: 직원별 오늘 평균/최고 스트레스 지수, 현재 단계(양호/관심/주의/위험), 주의·위험 알림 횟수, 측정 시간·데이터 품질, 권장 조치, 관리 필요 사유 문장, 최근 7일 추이, 시간대별 요약, 최근 세션 요약, 관리자 조치 기록
- **숨기는 정보**: 카메라 영상·얼굴 이미지·표정 확률 같은 원시 데이터, 스트레스 점수의 계산식·내부 모델 출력
- **관리 필요 판단 기준**: 다음 중 하나라도 해당하면 "관리 필요"
  - 현재 단계가 위험(danger)
  - 오늘 최고 스트레스 지수 80점 이상
  - 위험 알림 2회 이상
  - 관리 필요 사유에 `high_max_score` / `danger_alert_repeated` / `recent_sessions_elevated` 포함
- **데이터 확인 필요 판단 기준** (위와 별개): 데이터 품질이 `low-detection`/`insufficient`이거나 오늘 측정 시간이 30분 미만
- **샘플 데이터**: 이 레포는 서버 없이 브라우저 IndexedDB에 "본인" 데이터만 저장하므로 여러 직원의 데이터를 실제로 모을 수 없습니다. 따라서 `lib/adminDemoData.ts`의 5명 샘플(`사원 1~5`, 익명화)로 시연하며, 추후 실제 직원별 요약 데이터를 받게 되면 `lib/adminDataAdapter.ts`의 내부 구현만 교체하면 됩니다.

## 안전 안내

이 앱은 의료기기가 아닙니다. 위험 신호는 자기 인식 보조 도구일 뿐, 진단/치료 목적이 아닙니다. 도움이 필요한 경우:

- **정신건강위기상담전화 1577-0199** (24시간)
- **자살예방상담전화 1393** (24시간)

## 라이선스

내부 학습/팀 프로젝트 — 별도 라이선스 미지정.
