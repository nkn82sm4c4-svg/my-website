import { Play } from 'lucide-react'
import { Page } from '../components/layout/Page'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { navigate } from '../hooks/useHashRoute'

export function EmptySession() {
  return (
    <Page className="max-w-xl">
      <Card className="p-8 text-center">
        <div className="text-6xl animate-sway">🌱</div>
        <h1 className="mt-4 text-2xl font-bold text-forest">لا توجد جلسة حالية</h1>
        <p className="mt-2 text-ink-soft">ابدؤوا جلسة جديدة لتنبت شجرتكم التالية.</p>
        <Button size="lg" className="mt-6" onClick={() => navigate('setup')} icon={<Play size={20} fill="currentColor" />}>
          ابدأ جلسة
        </Button>
      </Card>
    </Page>
  )
}
