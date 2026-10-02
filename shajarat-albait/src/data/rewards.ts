import type { Reward } from '../types'

/** المكافآت الافتراضية — يمكن للأسرة إضافة مكافآت مخصصة من صفحة المكافآت */
export const DEFAULT_REWARDS: Reward[] = [
  { id: 'r-outing', title: 'نزهة عائلية', emoji: '🧺', points: 200 },
  { id: 'r-movie', title: 'فيلم عائلي', emoji: '🎬', points: 300 },
  { id: 'r-meal', title: 'وجبة عائلية', emoji: '🍽️', points: 500 },
  { id: 'r-activity', title: 'نشاط عائلي كبير', emoji: '🏕️', points: 1000 },
]

export const REWARD_EMOJIS = ['🎁', '🧺', '🎬', '🍽️', '🏕️', '🍦', '🎳', '🏖️', '🎮', '📚', '🚲', '🎡', '☕', '🍕']
