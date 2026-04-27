'use client'

import Link from 'next/link'

export default function LandingCTA() {
  return (
    <section
      id="cta"
      className="relative flex min-h-[70dvh] flex-col items-center justify-center overflow-hidden border-t border-white/[0.06] px-[52px] py-[120px]"
    >
      {/* 단순 글로우 배경 (Canvas 대체) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(107,171,154,0.12) 0%, rgba(107,171,154,0.04) 40%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-[600px] text-center">
        <p className="r flex justify-center gap-[10px] text-[10px] font-light uppercase tracking-[0.18em] text-[rgba(240,237,230,0.38)]">
          <span className="block h-px w-5 self-center bg-[rgba(240,237,230,0.38)]" />
          지금 시작하기
        </p>
        <h2
          className="r d1 mt-6 font-thin leading-[1.05] tracking-[-0.04em]"
          style={{ fontSize: 'clamp(40px, 6vw, 84px)' }}
        >
          지금 마음을
          <br />
          살펴보세요.
        </h2>
        <p className="r d2 mt-8 text-[13px] font-light leading-[1.85] text-[rgba(240,237,230,0.38)]">
          카메라 권한 하나면 충분해요. 설치 없이 브라우저에서 바로.
        </p>
        <div className="r d3 mt-12 flex items-center justify-center gap-[14px]">
          <Link
            href="/measure"
            className="rounded-full bg-[#F0EDE6] px-[30px] py-[13px] text-[12px] font-normal uppercase tracking-[0.08em] text-[#050503] transition-all hover:-translate-y-0.5"
          >
            앱 시작하기
          </Link>
          <a
            href="https://github.com/woobin-01/onmaum"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/[0.14] px-[30px] py-[13px] text-[12px] font-light uppercase tracking-[0.08em] text-[rgba(240,237,230,0.65)] transition-all hover:border-white/[0.3] hover:text-[#F0EDE6]"
          >
            GitHub →
          </a>
        </div>
      </div>
    </section>
  )
}
