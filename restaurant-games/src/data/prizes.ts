import { Prize } from '../types';

export const STANDARD_PRIZES: Prize[] = [
  {
    id: 'cashback-10',
    name: 'كاش باك 10 ريال',
    type: 'cashback',
    icon: '💵',
    color: '#7C3AED', // violet
    valueText: '10 ر.س رصيد في المحفظة',
    code: 'CASH-10SR',
  },
  {
    id: 'free-meal',
    name: 'وجبة مجانية',
    type: 'free_meal',
    icon: '🍔',
    color: '#9333EA', // purple
    valueText: 'وجبة برجر مميزة مجاناً',
    code: 'FREE-MEAL-VIP',
  },
  {
    id: 'discount-15',
    name: 'خصم 15%',
    type: 'discount',
    icon: '🏷️',
    color: '#C026D3', // fuchsia purple
    valueText: 'خصم 15% على إجمالي الفاتورة',
    code: 'SAVE-15PCT',
  },
  {
    id: 'free-drink',
    name: 'مشروب مجاني',
    type: 'free_drink',
    icon: '🥤',
    color: '#6366F1', // indigo
    valueText: 'مشروب غازي أو موخيتو منعش مجاناً',
    code: 'FREE-DRINK',
  },
  {
    id: 'discount-20',
    name: 'خصم 20%',
    type: 'discount',
    icon: '🎁',
    color: '#A855F7', // bright purple
    valueText: 'خصم 20% للطلب القادم',
    code: 'VIP-20PCT',
  },
  {
    id: 'better-luck',
    name: 'حظ أوفر',
    type: 'none',
    icon: '🍀',
    color: '#94A3B8', // soft slate
    valueText: 'جرّب مرة أخرى في زيارتك القادمة!',
    code: '',
  },
];

export function getRandomPrize(includeBetterLuck = true): Prize {
  const pool = includeBetterLuck 
    ? STANDARD_PRIZES 
    : STANDARD_PRIZES.filter(p => p.type !== 'none');
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
