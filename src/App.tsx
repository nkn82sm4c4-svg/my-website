import { useEffect } from 'react'
import { UpsellSheet } from './components/cart/UpsellSheet'
import { BottomNav } from './components/layout/BottomNav'
import { DesktopPanels } from './components/layout/DesktopPanels'
import { TopBar } from './components/layout/TopBar'
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
import { RESTAURANT } from './config/restaurant'
import { CartProvider } from './store/CartContext'
import { LoyaltyProvider } from './store/LoyaltyContext'
import { UIProvider, useUI } from './store/UIContext'

function Screens() {
  const { route, navigate, table, toast } = useUI()

  // Journey entry: opened from a real table QR (?table=7) → straight to the menu
  // home with a welcome; otherwise the first visit starts at the QR scan screen.
  useEffect(() => {
    const first = !sessionStorage.getItem('sinmar.visited')
    sessionStorage.setItem('sinmar.visited', '1')
    if (table && first) toast(`مرحبًا بك في سنمار 👋 طاولة ${table}`)
    else if (first && !window.location.hash) navigate('scan')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (route.name === 'scan') return <ScanPage />

  return (
    <>
      <TopBar transparent={route.name === 'home'} />
      <main key={route.name} className="min-h-[calc(100dvh-4rem)] animate-fade pb-32">
        {route.name === 'home' && <HomePage />}
        {route.name === 'menu' && <MenuPage />}
        {route.name === 'offers' && <OffersPage />}
        {route.name === 'loyalty' && <LoyaltyPage />}
        {route.name === 'cart' && <CartPage />}
      </main>
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <UIProvider>
      <LoyaltyProvider>
        <CartProvider>
          <div className="min-h-dvh bg-[#f1e8dc]">
            <DesktopPanels />
            <div className="relative mx-auto min-h-dvh max-w-[480px] bg-cream shadow-[0_0_60px_-20px_rgb(26_15_12/0.25)]" aria-label={RESTAURANT.name}>
              <Screens />
            </div>
          </div>
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
