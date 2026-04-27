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

## 테스트

```bash
npm run test          # watch 모드
npm run test:run      # 단발 실행 (CI)
npm run test:ui       # 브라우저 UI
```

현재 테스트: **75 passed + 4 skipped**
- `lib/`: aggregator (12), repository (6), riskCalculator (15), selfCareTips (5)
- `hooks/`: useEmotionRecorder (1 + 4 skip), useWarningDismissal (6), useNotificationPermission (6), useRiskNotification (6)
- `components/`: RiskWarningModal (6), ContactsFooter (3), SelfCareTip (3), NotificationToggle (6)

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

hooks/
  useEmotionRecorder.ts        분석 루프 + 1분 buffer + 자동 저장
  useWarningDismissal.ts       sessionStorage로 모달 dismiss 추적
  useNotificationPermission.ts 알림 권한 상태 + request
  useRiskNotification.ts       warning 진입 시 알림 표시

lib/
  emotionAnalysis.ts       face-api 모델 로드 + 분석 + dominant
  emotionAggregator.ts     500ms 샘플 → 1분 record 집계 (순수 함수)
  emotionRepository.ts     EmotionRecord CRUD (Dexie)
  db.ts                    Dexie 인스턴스 + 스키마
  riskCalculator.ts        DailyRisk 계산 (negativeRatio + flatAffectAvg)
  selfCareTips.ts          자기 돌봄 팁 정적 리스트 + 랜덤 select

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

## 안전 안내

이 앱은 의료기기가 아닙니다. 위험 신호는 자기 인식 보조 도구일 뿐, 진단/치료 목적이 아닙니다. 도움이 필요한 경우:

- **정신건강위기상담전화 1577-0199** (24시간)
- **자살예방상담전화 1393** (24시간)

## 라이선스

내부 학습/팀 프로젝트 — 별도 라이선스 미지정.
