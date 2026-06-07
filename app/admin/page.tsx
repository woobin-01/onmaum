'use client'

import { useEffect, useState } from 'react'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminGuard from '@/components/admin/AdminGuard'
import { getAdminEmployees } from '@/lib/adminDataAdapter'
import type { EmployeeStressSummary } from '@/lib/adminTypes'

function AdminDashboardContent({ logout }: { logout: () => void }) {
  const [employees, setEmployees] = useState<EmployeeStressSummary[]>([])

  useEffect(() => {
    let cancelled = false
    // TODO: 서버 기반 조직 계정이 추가되면 lib/adminDataAdapter.ts의 내부 구현만
    // 실제 직원별 요약 데이터를 받아오도록 교체한다 (이 화면은 변경할 필요가 없다).
    getAdminEmployees().then((result) => {
      if (!cancelled) setEmployees(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">관리자 대시보드</h1>
            <p className="mt-2 text-sm text-ink-500">
              직원별 스트레스 신호를 요약해 휴식과 케어가 필요한 상황을 확인합니다.
            </p>
            <p className="mt-1 text-xs text-ink-400">
              이 화면은 의료 진단이나 직원 평가 목적이 아니라, 업무 중 스트레스 신호를 조기에
              확인하고 적절한 휴식을 권장하기 위한 관리 보조 화면입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-ink-300 px-4 py-2 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100"
          >
            로그아웃
          </button>
        </header>

        <p className="rounded-xl bg-ink-100 px-4 py-2 text-xs text-ink-500">
          현재 관리자 화면은 발표 시연을 위해 일부 샘플 직원을 포함합니다.
        </p>

        <AdminDashboard employees={employees} />
      </section>
    </main>
  )
}

export default function AdminPage() {
  return <AdminGuard>{(logout) => <AdminDashboardContent logout={logout} />}</AdminGuard>
}
