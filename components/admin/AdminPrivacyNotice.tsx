export default function AdminPrivacyNotice() {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="text-sm font-semibold text-ink-900">관리자 화면의 데이터 범위</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-500">
        관리자는 직원의 얼굴 이미지나 원시 감정 로그를 보지 않습니다. 이 화면은 직원별
        스트레스 신호를 요약해 휴식과 케어가 필요한 상황을 확인하기 위한 보조 화면입니다.
        <br />
        본 화면은 의료 진단이나 인사 평가 목적이 아니라, 업무 중 스트레스 신호를 조기에
        확인하고 적절한 휴식을 권장하기 위한 관리 보조 화면입니다.
      </p>
    </div>
  )
}
