import { DemoBanner } from './components/layout/DemoBanner'
import { NatureBackground } from './components/layout/NatureBackground'
import { SiteFooter } from './components/layout/SiteFooter'
import { SiteHeader } from './components/layout/SiteHeader'
import { Toasts } from './components/ui/Toasts'
import { useHashRoute, type RouteName } from './hooks/useHashRoute'
import { GardenPage } from './pages/GardenPage'
import { HomePage } from './pages/HomePage'
import { HowPage } from './pages/HowPage'
import { JoinPage } from './pages/JoinPage'
import { LivePage } from './pages/LivePage'
import { LobbyPage } from './pages/LobbyPage'
import { ResultPage } from './pages/ResultPage'
import { RewardsPage } from './pages/RewardsPage'
import { SetupPage } from './pages/SetupPage'
import { GameProvider } from './store/GameContext'
import { ToastProvider } from './store/ToastContext'

const PAGES: Record<RouteName, () => React.ReactElement> = {
  home: HomePage,
  setup: SetupPage,
  lobby: LobbyPage,
  live: LivePage,
  result: ResultPage,
  garden: GardenPage,
  rewards: RewardsPage,
  how: HowPage,
  join: JoinPage,
}

export default function App() {
  const { route } = useHashRoute()
  const Current = PAGES[route]
  return (
    <ToastProvider>
      <GameProvider>
        <NatureBackground />
        <SiteHeader route={route} />
        <DemoBanner />
        <div key={route} className="animate-fade">
          <Current />
        </div>
        <SiteFooter />
        <Toasts />
      </GameProvider>
    </ToastProvider>
  )
}
