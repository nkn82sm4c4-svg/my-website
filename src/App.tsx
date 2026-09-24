import { useEffect } from 'react'
import { UpsellSheet } from './components/cart/UpsellSheet'
import { CartBar } from './components/layout/CartBar'
import { SiteFooter } from './components/layout/SiteFooter'
import { SiteHeader } from './components/layout/SiteHeader'
import { RewardModal } from './components/loyalty/RewardModal'
import { ManagerSheet } from './components/manager/ManagerSheet'
import { ProductSheet } from './components/product/ProductSheet'
import { Toasts } from './components/ui/Toasts'
import { CartPage } from './pages/CartPage'
import { HomePage } from './pages/HomePage'
import { LoyaltyPage } from './pages/LoyaltyPage'
import { MenuPage } from './pages/MenuPage'
import { OffersPage } from './pages/OffersPage'
import { ScanPage } from './pages/ScanPage'
import { CartProvider } from './store/CartContext'
import { LoyaltyProvider } from './store/LoyaltyContext'
import { UIProvider, useUI } from './store/UIContext'

function Site() {
  const { route, table, toast } = useUI()

  // Opened from a real table QR (?table=7): welcome the guest once per visit.
  useEffect(() => {
    const first = !sessionStorage.getItem('sinmar.visited')
    sessionStorage.setItem('sinmar.visited', '1')
    if (table && first) toast(`مرحبًا بك في سنمار 👋 طاولة ${table}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main key={route.name} className="flex-1 animate-fade">
        {route.name === 'home' && <HomePage />}
        {route.name === 'menu' && <MenuPage />}
        {route.name === 'offers' && <OffersPage />}
        {route.name === 'loyalty' && <LoyaltyPage />}
        {route.name === 'cart' && <CartPage />}
        {route.name === 'scan' && <ScanPage />}
      </main>
      <SiteFooter />
      <CartBar />
    </div>
  )
}

export default function App() {
  return (
    <UIProvider>
      <LoyaltyProvider>
        <CartProvider>
          <Site />
          <ProductSheet />
          <UpsellSheet />
          <RewardModal />
          <ManagerSheet />
          <Toasts />
        </CartProvider>
      </LoyaltyProvider>
    </UIProvider>
  )
}
