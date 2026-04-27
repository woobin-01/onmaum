'use client'

import { useEffect, useState } from 'react'

interface StatBarProps {
  label: string
  percent: number
  color: string
}

function StatBar({ label, percent, color }: StatBarProps) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(percent))
    return () => cancelAnimationFrame(id)
  }, [percent])
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[10px] tracking-[0.06em] text-[rgba(240,237,230,0.38)]">
        <span>{label}</span>
        <span style={{ color }}>{percent}%</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: color,
            transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  )
}

const FEATURES = [
  {
    n: '01',
    title: '실시간 감정 분석',
    desc: '웹캠으로 기쁨·평온·슬픔·화남 4가지 감정을 실시간 감지. face-api.js 기반, 모든 분석은 브라우저 내에서만 처리됩니다.',
  },
  {
    n: '02',
    title: '1분 단위 자동 저장',
    desc: '500ms마다 샘플링하고 1분마다 자동 집계합니다. 백그라운드에서도 꾸준히 누적됩니다.',
  },
  {
    n: '03',
    title: '일별 위험도 계산',
    desc: '부정 비율과 평탄 정서를 기반으로 양호·주의·위험을 자동 분류합니다.',
  },
  {
    n: '04',
    title: '7일 추세 시각화',
    desc: '일주일 패턴을 한눈에 파악할 수 있어요. 언제 마음이 무거워졌는지 직관적으로 알 수 있습니다.',
  },
  {
    n: '05',
    title: '위험 신호 알림',
    desc: '위험 수준에 도달하면 브라우저 알림으로 부드럽게 알립니다. 24시간 상담 연결도 한 번에.',
  },
  {
    n: '06',
    title: '완전한 프라이버시',
    desc: '서버가 없습니다. 모든 데이터는 내 기기의 IndexedDB에만 저장되고 외부로 전송되지 않습니다.',
  },
] as const

export default function LandingFeatures() {
  return (
    <section
      id="features"
      className="border-t border-white/[0.06] px-[52px] py-[120px]"
    >
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-[100px] md:grid-cols-2">
        <div className="md:sticky md:top-[120px]">
          <p className="r mb-5 flex items-center gap-[10px] text-[10px] font-light uppercase tracking-[0.18em] text-[rgba(240,237,230,0.38)] before:block before:h-px before:w-5 before:bg-[rgba(240,237,230,0.38)] before:content-['']">
            Features
          </p>
          <h2
            className="r d1 font-thin leading-[1.1] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}
          >
            감정 노동자를
            <br />
            위해 설계했습니다
          </h2>

          <div className="mt-12 flex flex-col items-center gap-10">
            {/* 미니 Orb (정적 그라디언트, ReactiveOrb mini는 추후) */}
            <div
              aria-hidden="true"
              className="h-[220px] w-[220px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 35% 35%, rgba(190,225,210,0.92) 0%, rgba(140,190,175,0.85) 15%, rgba(80,140,128,0.78) 35%, rgba(30,58,52,0.88) 60%, rgba(10,22,18,0.94) 82%, rgba(4,8,6,0.98) 100%)',
                boxShadow:
                  '0 0 60px rgba(107,171,154,0.25), inset 0 0 60px rgba(107,171,154,0.05)',
              }}
            />
            <div className="r d2 flex w-full flex-col gap-4">
              <StatBar label="기쁨" percent={72} color="#6BAB9A" />
              <StatBar label="평온" percent={18} color="#6E6660" />
              <StatBar label="슬픔" percent={7} color="#D4A84B" />
              <StatBar label="화남" percent={3} color="#E8806A" />
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-0">
          {FEATURES.map((f, i) => (
            <div
              key={f.n}
              className={`r ${i > 0 && i < 4 ? `d${i}` : i === 4 ? 'd2' : i === 5 ? 'd3' : ''} group flex items-start gap-7 border-t border-white/[0.06] py-7 ${i === FEATURES.length - 1 ? 'border-b' : ''}`}
            >
              <div className="w-7 flex-shrink-0 pt-[5px] text-[10px] tracking-[0.1em] text-[rgba(240,237,230,0.14)]">
                {f.n}
              </div>
              <div className="flex-1">
                <div
                  className="mb-2.5 font-extralight tracking-[-0.01em] text-[rgba(240,237,230,0.65)] transition-colors duration-[250ms] group-hover:text-[#F0EDE6]"
                  style={{ fontSize: 'clamp(17px, 2vw, 22px)' }}
                >
                  {f.title}
                </div>
                <div className="max-w-[400px] text-[12px] font-light leading-[1.8] text-[rgba(240,237,230,0.38)]">
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
