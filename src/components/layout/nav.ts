import type { RouteName } from '../../hooks/useHashRoute'

export const NAV_LINKS: { id: RouteName; label: string }[] = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'menu', label: 'المنيو' },
  { id: 'offers', label: 'العروض' },
  { id: 'loyalty', label: 'برنامج الولاء' },
  { id: 'scan', label: 'منيو QR' },
]
