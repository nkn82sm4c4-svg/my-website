import { img } from '../config/models'
import type { Offer } from '../types'

/** DEMO offers — illustrative only, not real Sinmar promotions. */
export const OFFERS: Offer[] = [
  {
    id: 'offer-meal',
    title: 'وجبة سنمار الكاملة',
    subtitle: 'الأكثر طلبًا اليوم',
    description: 'ضاربة كلاسيك + بطاطس + مشروب + صوص سنمار.',
    price: 29,
    originalPrice: 35,
    image: img('combo-meal'),
    model: 'burger',
    includes: ['ضاربة كلاسيك', 'بطاطس كلاسيك', 'مشروب غازي', 'صوص سنمار'],
    tag: 'وفّر 6 ر.س',
    accent: 'brand',
  },
  {
    id: 'offer-double',
    title: 'عرض الدبل للاثنين',
    subtitle: 'لك ولخويك',
    description: '2 دبل سنمار + بطاطس كبيرة للمشاركة.',
    price: 55,
    originalPrice: 69,
    image: img('double-deal'),
    model: 'double-burger',
    includes: ['2 × دبل سنمار', 'بطاطس كبيرة'],
    tag: 'خصم 20%',
    accent: 'ink',
  },
  {
    id: 'offer-family',
    title: 'بوكس العائلة',
    subtitle: 'يكفي 4 أشخاص',
    description: 'بيتزا ببروني + 2 شاورما + بطاطس + صوصات.',
    price: 75,
    originalPrice: 94,
    image: img('family-box'),
    model: 'pizza',
    includes: ['بيتزا ببروني', '2 × شاورما دجاج', 'بطاطس كبيرة', '2 × صوص'],
    tag: 'وفّر 19 ر.س',
    accent: 'gold',
  },
  {
    id: 'offer-members',
    title: 'عرض خاص لأعضاء الولاء',
    subtitle: 'حصري لأعضاء برنامج الولاء',
    description: 'سنمارية جبن + فطيرة زعتر + عصير برتقال بسعر خاص للأعضاء.',
    price: 19,
    originalPrice: 27,
    image: img('pie-boat'),
    model: 'pie-boat',
    includes: ['سنمارية جبن', 'فطيرة زعتر', 'عصير برتقال طازج'],
    tag: 'للأعضاء فقط',
    membersOnly: true,
    accent: 'gold',
  },
]

export const offerById = (id: string) => OFFERS.find((o) => o.id === id)
