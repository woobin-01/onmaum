'use client'

// rPPG spike 실험 페이지 (메뉴 미노출, 검증 후 폐기 예정).
// 웹캠 → face-api 랜드마크(현행 부하 그대로: SSD+랜드마크+표정) → 이마/이마+볼 ROI 피부 평균 RGB(매 프레임)
// → POS 심박 추정을 1초마다. 옆 사람이 스마트워치 BPM을 입력하면 앱 추정과 짝지어 조건별 오차를 낸다.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import * as faceapi from 'face-api.js'
import { loadFaceApiModels } from '@/lib/emotionAnalysis'
import {
  estimateHeartRate,
  meanSkinRgb,
  roiRects,
  summarizePairs,
  type Condition,
  type HeartRate,
  type PairRow,
  type Rect,
  type RgbSample,
} from '@/lib/rppg'

const WINDOW_MS = 10_000
const BUFFER_MS = 12_000
const STALE_MS = 2_000
const MIN_SKIN_RATIO = 0.3
const ROI_EMA = 0.5
const ROWS_KEY = 'onmaum_rppg_lab_rows'

const DETECTOR_OPTIONS = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })

const CONDITIONS: { key: Condition; label: string; target: number | null }[] = [
  { key: 'quiet', label: '조용히', target: 5 },
  { key: 'talk', label: '말하며', target: 8 },
  { key: 'move', label: '움직이며', target: null },
]

interface Rois {
  forehead: Rect
  leftCheek: Rect
  rightCheek: Rect
}

interface Live {
  forehead: HeartRate | null
  all: HeartRate | null
  fps: number
  skin: number
  face: boolean
}

type LabRow = PairRow & { t: number; fps: number }

const EMPTY_LIVE: Live = { forehead: null, all: null, fps: 0, skin: 0, face: false }

function smoothRect(prev: Rect, next: Rect): Rect {
  const mix = (a: number, b: number) => a + ROI_EMA * (b - a)
  return { x: mix(prev.x, next.x), y: mix(prev.y, next.y), w: mix(prev.w, next.w), h: mix(prev.h, next.h) }
}

function sampleRoi(ctx: CanvasRenderingContext2D, rect: Rect, w: number, h: number) {
  const x = Math.max(0, Math.round(rect.x))
  const y = Math.max(0, Math.round(rect.y))
  const rw = Math.min(w - x, Math.round(rect.w))
  const rh = Math.min(h - y, Math.round(rect.h))
  if (rw < 4 || rh < 4) return null
  const m = meanSkinRgb(ctx.getImageData(x, y, rw, rh).data)
  if (!m || m.skinRatio < MIN_SKIN_RATIO) return null
  return { ...m, count: m.skinRatio * rw * rh }
}

function windowed(buf: RgbSample[]): RgbSample[] {
  if (buf.length === 0) return buf
  const from = buf[buf.length - 1].t - WINDOW_MS
  return buf.filter((s) => s.t >= from)
}

function fmt(v: number | null | undefined, digits = 1): string {
  return v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toFixed(digits)
}

function toCsv(rows: LabRow[]): string {
  const head = 't_s,condition,watch_bpm,forehead_bpm,forehead_snr_db,all_bpm,all_snr_db,fps'
  const lines = rows.map((r) =>
    [
      r.t.toFixed(1),
      r.condition,
      r.watch,
      fmt(r.forehead?.bpm),
      fmt(r.forehead?.snrDb),
      fmt(r.all?.bpm),
      fmt(r.all?.snrDb),
      r.fps.toFixed(0),
    ].join(','),
  )
  return [head, ...lines].join('\n')
}

export default function RppgLabPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)

  const [modelReady, setModelReady] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectMs, setDetectMs] = useState(500)
  const [condition, setCondition] = useState<Condition>('quiet')
  const [conditionStart, setConditionStart] = useState(0)
  const [clock, setClock] = useState(0)
  const [gateDb, setGateDb] = useState(0)
  const [live, setLive] = useState<Live>(EMPTY_LIVE)
  const [rows, setRows] = useState<LabRow[]>([])
  const [rowsLoaded, setRowsLoaded] = useState(false)
  const [watchInput, setWatchInput] = useState('')

  const liveRef = useRef<Live>(EMPTY_LIVE)
  const detectMsRef = useRef(detectMs)
  const startRef = useRef(0)

  useEffect(() => {
    detectMsRef.current = detectMs
  }, [detectMs])

  useEffect(() => {
    let cancelled = false
    loadFaceApiModels()
      .then(() => {
        if (!cancelled) setModelReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(`모델 로드 실패: ${err instanceof Error ? err.message : String(err)}`)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 새로고침해도 측정 기록이 날아가지 않게 (localStorage는 mount 후 — hydration mismatch 방지)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROWS_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setRows(JSON.parse(saved) as LabRow[])
    } catch {
      // 저장소 접근 불가 — 메모리에서만 유지
    }
    setRowsLoaded(true)
  }, [])

  useEffect(() => {
    if (!rowsLoaded) return
    try {
      localStorage.setItem(ROWS_KEY, JSON.stringify(rows))
    } catch {
      // 무시
    }
  }, [rows, rowsLoaded])

  useEffect(() => {
    const id = setInterval(() => setClock(performance.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!running) return
    const video = videoRef.current
    const overlay = overlayRef.current
    if (!video || !overlay) return

    let stopped = false
    let stream: MediaStream | null = null
    let estimateTimer: ReturnType<typeof setInterval> | undefined
    let rois: Rois | null = null
    let skin = 0
    let face = false
    let lastPushWall = 0
    const buffers: { forehead: RgbSample[]; all: RgbSample[] } = { forehead: [], all: [] }
    const frameWalls: number[] = []

    const drawOverlay = () => {
      const octx = overlay.getContext('2d')
      if (!octx) return
      octx.clearRect(0, 0, overlay.width, overlay.height)
      if (!rois) return
      octx.lineWidth = 3
      octx.strokeStyle = '#6BAB9A'
      const f = rois.forehead
      octx.strokeRect(f.x, f.y, f.w, f.h)
      octx.strokeStyle = '#D4A84B'
      for (const c of [rois.leftCheek, rois.rightCheek]) octx.strokeRect(c.x, c.y, c.w, c.h)
    }

    const run = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
        audio: false,
      })
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      video.srcObject = stream
      await video.play()
      if (stopped) return

      const w = video.videoWidth
      const h = video.videoHeight
      overlay.width = w
      overlay.height = h
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('캔버스를 만들 수 없어요')
      startRef.current = performance.now()

      // 얼굴 위치: face-api (현행 측정과 같은 부하)
      const detectLoop = async () => {
        while (!stopped) {
          try {
            const det = await faceapi
              .detectSingleFace(video, DETECTOR_OPTIONS)
              .withFaceLandmarks()
              .withFaceExpressions()
            if (stopped) break
            if (det) {
              const next = roiRects(det.landmarks.positions)
              rois = rois
                ? {
                    forehead: smoothRect(rois.forehead, next.forehead),
                    leftCheek: smoothRect(rois.leftCheek, next.leftCheek),
                    rightCheek: smoothRect(rois.rightCheek, next.rightCheek),
                  }
                : next
              face = true
            } else {
              rois = null
              face = false
            }
            drawOverlay()
          } catch (err) {
            console.error('얼굴 검출 실패:', err)
          }
          await new Promise((r) => setTimeout(r, detectMsRef.current))
        }
      }

      // 피부색: 매 프레임
      let lastT = -1
      const onFrame = (now: DOMHighResTimeStamp, meta: VideoFrameCallbackMetadata) => {
        if (stopped) return
        const t = meta.captureTime ?? now
        if (rois && t !== lastT) {
          lastT = t
          ctx.drawImage(video, 0, 0, w, h)
          const f = sampleRoi(ctx, rois.forehead, w, h)
          const parts = [f, sampleRoi(ctx, rois.leftCheek, w, h), sampleRoi(ctx, rois.rightCheek, w, h)].filter(
            (p): p is NonNullable<typeof p> => p !== null,
          )
          if (f) buffers.forehead.push({ t, r: f.r, g: f.g, b: f.b })
          if (parts.length > 0) {
            const total = parts.reduce((s, p) => s + p.count, 0)
            buffers.all.push({
              t,
              r: parts.reduce((s, p) => s + p.r * p.count, 0) / total,
              g: parts.reduce((s, p) => s + p.g * p.count, 0) / total,
              b: parts.reduce((s, p) => s + p.b * p.count, 0) / total,
            })
            lastPushWall = now
          }
          skin = f?.skinRatio ?? 0
          frameWalls.push(now)
          for (const buf of [buffers.forehead, buffers.all]) {
            while (buf.length > 0 && buf[0].t < t - BUFFER_MS) buf.shift()
          }
          while (frameWalls.length > 0 && frameWalls[0] < now - 2000) frameWalls.shift()
        }
        video.requestVideoFrameCallback(onFrame)
      }
      video.requestVideoFrameCallback(onFrame)
      void detectLoop()

      estimateTimer = setInterval(() => {
        const nowWall = performance.now()
        const fresh = nowWall - lastPushWall < STALE_MS
        while (frameWalls.length > 0 && frameWalls[0] < nowWall - 2000) frameWalls.shift()
        const next: Live = {
          forehead: fresh ? estimateHeartRate(windowed(buffers.forehead)) : null,
          all: fresh ? estimateHeartRate(windowed(buffers.all)) : null,
          fps: frameWalls.length / 2,
          skin,
          face,
        }
        liveRef.current = next
        setLive(next)
      }, 1000)
    }

    run().catch((err: unknown) => {
      if (stopped) return
      setError(`카메라 실패: ${err instanceof Error ? err.message : String(err)}`)
      setRunning(false)
    })

    return () => {
      stopped = true
      if (estimateTimer) clearInterval(estimateTimer)
      stream?.getTracks().forEach((t) => t.stop())
      video.srcObject = null
      overlay.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height)
      liveRef.current = EMPTY_LIVE
      setLive(EMPTY_LIVE)
    }
  }, [running])

  // 이벤트 timeStamp는 performance.now()와 같은 기준 시각
  const handleCondition = (c: Condition, at: number) => {
    setCondition(c)
    setConditionStart(at)
  }

  const handleWatch = (e: FormEvent) => {
    e.preventDefault()
    const v = Number(watchInput)
    if (!Number.isFinite(v) || v < 30 || v > 220) return
    const l = liveRef.current
    setRows((rs) => [
      ...rs,
      {
        t: (performance.now() - startRef.current) / 1000,
        condition,
        watch: v,
        forehead: l.forehead,
        all: l.all,
        fps: l.fps,
      },
    ])
    setWatchInput('')
  }

  const downloadCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `rppg-lab-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const summary = summarizePairs(rows, gateDb)
  const elapsed = conditionStart > 0 ? Math.max(0, Math.floor((clock - conditionStart) / 1000)) : 0

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto w-full max-w-2xl space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">spike · 검증 후 폐기</p>
          <h1 className="text-2xl font-bold text-ink-900">rPPG 실험실</h1>
          <p className="mt-1 text-sm text-ink-500">
            워치는 운동 모드로 켜고, 옆 사람이 15초마다 워치 BPM을 입력하세요. 조건별로 2분씩.
          </p>
        </header>

        {error && <p className="rounded-lg bg-risk-warning/10 p-3 text-sm text-risk-warning">{error}</p>}

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-ink-900">
          <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
          <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!modelReady}
            onClick={() => {
              setError(null)
              setRunning((r) => !r)
            }}
            className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {!modelReady ? '모델 로딩 중…' : running ? '정지' : '측정 시작'}
          </button>
          <label className="flex items-center gap-2 text-sm text-ink-600">
            얼굴 검출 간격
            <select
              value={detectMs}
              onChange={(e) => setDetectMs(Number(e.target.value))}
              className="rounded border border-ink-300 px-2 py-1"
            >
              <option value={500}>500ms (현행)</option>
              <option value={200}>200ms</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="이마 BPM" value={fmt(live.forehead?.bpm, 0)} sub={`SNR ${fmt(live.forehead?.snrDb)} dB`} />
          <Stat label="이마+볼 BPM" value={fmt(live.all?.bpm, 0)} sub={`SNR ${fmt(live.all?.snrDb)} dB`} />
          <Stat label="처리 fps" value={fmt(live.fps, 0)} sub="목표 ≈ 30" />
          <Stat
            label="얼굴 / 이마 피부"
            value={live.face ? '감지' : '없음'}
            sub={`피부 비율 ${Math.round(live.skin * 100)}%`}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-ink-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={(e) => handleCondition(c.key, e.timeStamp)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  condition === c.key ? 'bg-risk-good text-white' : 'bg-ink-100 text-ink-600'
                }`}
              >
                {c.label}
              </button>
            ))}
            <span className="ml-auto font-mono text-sm text-ink-500">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </span>
          </div>
          <form onSubmit={handleWatch} className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={watchInput}
              onChange={(e) => setWatchInput(e.target.value)}
              placeholder="워치 BPM 입력 후 Enter"
              className="flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-risk-good px-4 py-2 text-sm font-semibold text-white">
              기록
            </button>
          </form>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-ink-900">조건별 오차 (워치 기준)</h2>
            <label className="ml-auto flex items-center gap-2 text-sm text-ink-600">
              품질 게이트 SNR ≥
              <input
                type="number"
                step={0.5}
                value={gateDb}
                onChange={(e) => setGateDb(Number(e.target.value))}
                className="w-16 rounded border border-ink-300 px-2 py-1"
              />
              dB
            </label>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-ink-500">
                <th className="py-2">조건</th>
                <th>ROI</th>
                <th>n</th>
                <th>평균오차</th>
                <th>게이트 통과율</th>
                <th>통과 구간 오차</th>
                <th>목표</th>
              </tr>
            </thead>
            <tbody>
              {CONDITIONS.flatMap((c) =>
                (['forehead', 'all'] as const).map((roi) => {
                  const s = summary[c.key][roi]
                  return (
                    <tr key={`${c.key}-${roi}`} className="border-b border-ink-100">
                      <td className="py-2">{c.label}</td>
                      <td>{roi === 'forehead' ? '이마' : '이마+볼'}</td>
                      <td>{s.n}</td>
                      <td>{fmt(s.mae)}</td>
                      <td>{s.n > 0 ? `${Math.round(s.coverage * 100)}%` : '—'}</td>
                      <td>{fmt(s.gatedMae)}</td>
                      <td>{c.target === null ? '참고' : `≤ ${c.target}`}</td>
                    </tr>
                  )
                }),
              )}
            </tbody>
          </table>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              disabled={rows.length === 0}
              className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              CSV 저장 ({rows.length}행)
            </button>
            <button
              type="button"
              onClick={() => setRows((rs) => rs.slice(0, -1))}
              disabled={rows.length === 0}
              className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              마지막 행 취소
            </button>
            <button
              type="button"
              onClick={() => setRows([])}
              disabled={rows.length === 0}
              className="ml-auto rounded-lg border border-risk-warning/40 px-3 py-1.5 text-sm text-risk-warning disabled:opacity-40"
            >
              전체 초기화
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-ink-200 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">{sub}</p>
    </div>
  )
}
