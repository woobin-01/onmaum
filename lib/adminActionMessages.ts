import type { AdminRecommendedAction } from '@/lib/adminTypes'

interface ActionMessage {
  title: string
  description: string
}

const ACTION_MESSAGE: Record<AdminRecommendedAction, ActionMessage> = {
  none: {
    title: '조치 없음',
    description: '현재는 추가 확인이 필요하지 않습니다.',
  },
  monitor: {
    title: '경과 확인',
    description: '현재 상태를 관찰하고 다음 측정 결과를 확인해보세요.',
  },
  short_break: {
    title: '짧은 휴식 권장',
    description: '다음 업무 전 1분 정도 짧은 휴식을 안내하는 것이 좋습니다.',
  },
  manager_check: {
    title: '관리자 상태 확인',
    description: '반복적인 스트레스 신호가 있어 가벼운 상태 확인이 필요할 수 있습니다.',
  },
  counseling_info: {
    title: '상담 정보 안내',
    description: '도움이 필요할 경우 이용 가능한 상담 정보를 안내할 수 있습니다.',
  },
  workload_review: {
    title: '업무 배분 검토',
    description: '특정 시간대에 스트레스 신호가 반복되면 업무 배분을 검토해볼 수 있습니다.',
  },
  data_check: {
    title: '측정 환경 확인',
    description: '얼굴 감지율이 낮아 카메라 위치나 측정 환경 확인이 필요합니다.',
  },
}

export function getAdminActionMessage(action: AdminRecommendedAction): ActionMessage {
  return ACTION_MESSAGE[action]
}
