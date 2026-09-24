import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ProductRow } from '../components/product/ProductRow'
import { cx } from '../lib/format'
import { menuService } from '../services/menuService'
import { useUI } from '../store/UIContext'
import type { CategoryId } from '../types'

const HEADER_OFFSET = 64 + 60 // top bar + category bar

export function MenuPage() {
  const { route } = useUI()
  const categories = menuService.categories()
  const [active, setActive] = useState<CategoryId>((route.param as CategoryId) || 'best')
  const [query, setQuery] = useState('')
  const chipsRef = useRef<HTMLDivElement>(null)
  const lock = useRef(false)

  const results = menuService.search(query)

  // deep link: #/menu/pizza
  useEffect(() => {
    if (route.param) setTimeout(() => scrollTo(route.param as CategoryId, 'instant'), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.param])

  // scroll spy
  useEffect(() => {
    const onScroll = () => {
      if (lock.current) return
      let current: CategoryId = categories[0].id
      for (const c of categories) {
        const el = document.getElementById(`cat-${c.id}`)
        if (el && el.getBoundingClientRect().top - HEADER_OFFSET - 20 <= 0) current = c.id
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [categories])

  // keep the active chip visible
  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`)
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  function scrollTo(id: CategoryId, behavior: ScrollBehavior = 'smooth') {
    const el = document.getElementById(`cat-${id}`)
    if (!el) return
    lock.current = true
    setActive(id)
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior })
    setTimeout(() => (lock.current = false), 700)
  }

  return (
    <div className="pb-10">
      <div className="px-5 pt-3">
        <h1 className="text-3xl font-extrabold">المنيو</h1>
        <p className="text-sm text-muted">اختر، شاهد بالـ3D، واطلب من طاولتك</p>
        <label className="mt-3 flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-card">
          <Search className="size-5 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن وجبة… (برجر، شاورما، بيتزا)"
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="مسح">
              <X className="size-4 text-muted" />
            </button>
          )}
        </label>
      </div>

      {query ? (
        <section className="mt-5 space-y-3 px-5">
          <p className="text-sm text-muted">{results.length} نتيجة لـ "{query}"</p>
          {results.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
          {results.length === 0 && <p className="py-10 text-center text-muted">ما لقينا شي… جرّب كلمة ثانية 🙂</p>}
        </section>
      ) : (
        <>
          <div className="sticky top-16 z-30 mt-4 border-b border-line/70 bg-cream/90 backdrop-blur-xl">
            <div ref={chipsRef} className="flex gap-2 overflow-x-auto px-5 py-2.5 no-scrollbar">
              {categories.map((c) => (
                <button
                  key={c.id}
                  data-cat={c.id}
                  onClick={() => scrollTo(c.id)}
                  className={cx(
                    'tap flex h-10 shrink-0 items-center gap-1.5 rounded-2xl px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
                    active === c.id ? 'bg-ink text-cream shadow-card' : 'bg-white text-ink-soft',
                  )}
                >
                  <span>{c.emoji}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {categories.map((c) => {
            const items = menuService.byCategory(c.id)
            if (!items.length) return null
            return (
              <section key={c.id} id={`cat-${c.id}`} className="px-5 pt-6">
                <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
                  <span>{c.emoji}</span>
                  {c.name}
                  <span className="text-sm font-medium text-muted">({items.length})</span>
                </h2>
                <div className="space-y-3">
                  {items.map((p) => (
                    <ProductRow key={`${c.id}-${p.id}`} product={p} />
                  ))}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
