// 관리자 화면용 직원 요약 데이터 어댑터.
//
// 지금은 서버/조직 계정이 없으므로 시연용 샘플 데이터(lib/adminDemoData.ts)를 그대로 반환한다.
// TODO: 향후 서버 기반 조직 계정이 추가되면, 이 함수의 내부 구현만
//       실제 직원별 요약 데이터를 받아오는 호출로 교체하면 된다.
//       (관리자 화면(AdminDashboard 등)은 이 함수의 반환 타입만 알면 되므로 변경이 필요 없다.)
//
// 주의: 현재 단계에서는 서버 fetch나 외부 API를 추가하지 않는다.

import { getDemoEmployeeDetail, getDemoEmployeeSummaries } from '@/lib/adminDemoData'
import type { EmployeeAdminDetail, EmployeeStressSummary } from '@/lib/adminTypes'

export async function getAdminEmployees(): Promise<EmployeeStressSummary[]> {
  return getDemoEmployeeSummaries()
}

export async function getAdminEmployeeDetail(employeeId: string): Promise<EmployeeAdminDetail | null> {
  return getDemoEmployeeDetail(employeeId)
}
