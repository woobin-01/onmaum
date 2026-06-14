'use client'

const RISKS = [
  {
    color: '#6BAB9A',
    glow: 'rgba(107,171,154,0.5)',
    name: '양호',
    desc: '부정 비율 < 30%',
    label: 'Good',
  },
  {
    color: '#D4A84B',
    glow: 'rgba(212,168,75,0.4)',
    name: '주의',
    desc: '부정 비율 30 – 50%',
    label: 'Caution',
  },
  {
    color: '#E8806A',
    glow: 'rgba(232,128,106,0.4)',
    name: '위험',
    desc: '부정 비율 ≥ 50% 또는 평탄도 ≥ 0.95',
    label: 'Warning',
  },
] as const

export default function LandingRisk() {
  return (
    <section
      id="risk"
      className="border-t border-ink-200 px-[52px] py-[120px]"
    >
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-20">
        <div className="flex-1 min-w-[280px]">
          <p className="r flex items-center gap-[10px] text-[10px] font-light uppercase tracking-[0.18em] text-ink-400 before:block before:h-px before:w-5 before:bg-ink-300 before:content-['']">
            Risk Levels
          </p>
          <h2
            className="r d1 mb-5 mt-5 font-thin leading-[1.1] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}
          >
            세 가지 상태로
            <br />
            마음을 읽어요
          </h2>
          <p className="r d2 max-w-[380px] text-[13px] font-light leading-[1.8] text-ink-500">
            부정 비율과 평탄 정서를 기반으로 오늘의 마음 상태를 자동
            분류합니다. 위험 수준이 되면 부드럽게 알려드려요.
          </p>
        </div>

        <div className="flex flex-1 min-w-[320px] flex-col gap-3">
          {RISKS.map((r, i) => (
            <div
              key={r.name}
              className={`r ${i > 0 ? `d${i}` : ''} flex items-center justify-between rounded-2xl border border-ink-200 bg-white px-7 py-6 transition-all duration-300 hover:translate-x-1.5 hover:border-ink-300 hover:bg-ink-50`}
            >
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="block h-2.5 w-2.5 rounded-full"
                  style={{
                    background: r.color,
                    boxShadow: `0 0 10px ${r.glow}`,
                  }}
                />
                <div>
                  <div className="text-[15px] font-light text-ink-900">
                    {r.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-light text-ink-500">
                    {r.desc}
                  </div>
                </div>
              </div>
              <div
                className="text-[24px] font-thin"
                style={{ color: r.color }}
              >
                {r.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
