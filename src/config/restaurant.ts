/** Restaurant-level settings. In production these would come from the backend / CMS. */
export const RESTAURANT = {
  name: 'سِنمار',
  nameLatin: 'SINMAR',
  city: 'بريدة',
  tagline: 'منيوك، عروضك، ومكافآتك في مكان واحد',
  currency: 'ر.س',
  vatRate: 0.15,
  loyalty: {
    goal: 5,
    rewardTitle: 'بطاطس كلاسيك + مشروب مجانًا',
    rewardValue: 14,
  },
  /** Seed state used for the demo (and by "reset demo"). */
  demo: {
    memberName: 'ضيف سنمار',
    initialStamps: 3,
    defaultTable: '7',
  },
} as const

/** QR placements shown in the demo (future rollout). */
export const QR_PLACEMENTS = [
  { id: 'tables', label: 'على الطاولات', hint: 'يطلب العميل وهو جالس' },
  { id: 'cashier', label: 'عند الكاشير', hint: 'بدل انتظار الطابور' },
  { id: 'packaging', label: 'على التغليف', hint: 'يعيد الطلب من البيت' },
  { id: 'posters', label: 'على الملصقات', hint: 'عروض اليوم بمسحة واحدة' },
] as const
