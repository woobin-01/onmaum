import type { StressLevel } from '@/lib/stressTypes'

interface StressAlertCopy {
  title: string
  message: string
  recommendation: string
}

const COPY_BY_LEVEL: Record<Exclude<StressLevel, 'danger'>, StressAlertCopy> = {
  good: {
    title: '안정적인 상태입니다',
    message: '현재는 특별한 스트레스 신호가 크지 않습니다.',
    recommendation: '지금의 리듬을 유지해보세요.',
  },
  watch: {
    title: '상태를 한 번 체크해보세요',
    message: '스트레스 신호가 조금 보입니다.',
    recommendation: '물 한 잔을 마시고 자세를 가볍게 풀어보세요.',
  },
  caution: {
    title: '천천히 호흡해볼까요?',
    message: '스트레스가 높아지고 있어요.',
    recommendation: '30초 동안 어깨와 목을 풀고 천천히 호흡해보세요.',
  },
}

const DANGER_TITLE = '잠시 쉬어갈 시간이에요'
const DANGER_RECOMMENDATION =
  '지금은 1분 휴식을 권장합니다. 잠시 화면에서 눈을 떼고 호흡해보세요.'

function dangerMessage(score?: number | null): string {
  if (score === null || score === undefined) {
    return '스트레스 신호가 높게 유지되고 있어요.'
  }
  return `스트레스 지수가 ${score}점으로 높게 유지되고 있어요.`
}

export function getStressAlertCopy(
  level: StressLevel | null,
  score?: number | null,
): StressAlertCopy {
  if (level === 'danger') {
    return {
      title: DANGER_TITLE,
      message: dangerMessage(score),
      recommendation: DANGER_RECOMMENDATION,
    }
  }

  if (level === 'good' || level === 'watch' || level === 'caution') {
    return COPY_BY_LEVEL[level]
  }

  return COPY_BY_LEVEL.good
}
