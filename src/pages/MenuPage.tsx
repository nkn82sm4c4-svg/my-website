import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Container } from '../components/layout/Container'
import { ProductRow } from '../components/product/ProductRow'
import { cx } from '../lib/format'
import { menuService } from '../services/menuService'
import { useUI } from '../store/UIContext'
import type { CategoryId } from '../types'

/** Height of the sticky site header (+ the mobile category bar). */
const headerOffset = () => {
  const header = document.querySelector('header')?.getBoundingClientRect().height ?? 64
  return window.innerWidth >= 1024 ? header + 16 : header + 60
}

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
        if (el && el.getBoundingClientRect().top - headerOffset() - 20 <= 0) current = c.id
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [categories])

  // keep the active chip visible (mobile category bar)
  useEffect(() => {
    const bar = chipsRef.current
    const chip = bar?.querySelector<HTMLElement>(`[data-cat="${active}"]`)
    if (bar && chip && bar.offsetParent)
      bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  function scrollTo(id: CategoryId, behavior: ScrollBehavior = 'smooth') {
    const el = document.getElementById(`cat-${id}`)
    if (!el) return
    lock.current = true
    setActive(id)
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerOffset(), behavior })
    setTimeout(() => (lock.current = false), 700)
  }

  const chip = (c: (typeof categories)[number], vertical = false) => (
    <button
      key={c.id}
      data-cat={vertical ? undefined : c.id}
      onClick={() => scrollTo(c.id)}
      className={cx(
        'tap flex shrink-0 items-center gap-2 font-semibold whitespace-nowrap transition-colors',
        vertical ? 'w-full rounded-xl px-3 py-2.5 text-[15px]' : 'h-10 rounded-2xl px-3.5 text-sm',
        active === c.id ? 'bg-ink text-cream shadow-card' : vertical ? 'text-ink-soft hover:bg-sand' : 'bg-white text-ink-soft',
      )}
    >
      <span>{c.emoji}</span>
      {c.name}
    </button>
  )

  return (
    <div className="pb-6">
      {/* page header */}
      <div className="border-b border-line/60 bg-gradient-to-b from-sand/60 to-transparent">
        <Container className="pt-4 pb-5 md:flex md:items-end md:justify-between md:gap-8 md:pt-10 md:pb-8">
          <div>
            <h1 className="text-3xl font-extrabold md:text-5xl">المنيو</h1>
            <p className="mt-1 text-sm text-muted md:text-base">اختر، شاهد بالـ3D، واطلب من طاولتك</p>
          </div>
          <label className="mt-3 flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-card md:mt-0 md:w-[380px]">
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
        </Container>
      </div>

      {query ? (
        <Container className="mt-6">
          <p className="mb-3 text-sm text-muted">
            {results.length} نتيجة لـ "{query}"
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 2xl:grid-cols-3">
            {results.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
          {results.length === 0 && <p className="py-10 text-center text-muted">ما لقينا شي… جرّب كلمة ثانية 🙂</p>}
        </Container>
      ) : (
        <>
          {/* mobile / tablet category bar */}
          <div className="sticky top-16 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-xl md:top-[72px] lg:hidden">
            <div ref={chipsRef} className="flex gap-2 overflow-x-auto px-5 py-2.5 no-scrollbar md:px-8">
              {categories.map((c) => chip(c))}
            </div>
          </div>

          <Container className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
            {/* desktop category sidebar */}
            <aside className="hidden lg:block">
              <nav className="sticky top-[96px] mt-8 space-y-1 rounded-3xl bg-white p-3 shadow-card" aria-label="التصنيفات">
                <p className="px-3 pt-1 pb-2 text-xs font-bold text-muted">التصنيفات</p>
                {categories.map((c) => chip(c, true))}
              </nav>
            </aside>

            <div>
              {categories.map((c) => {
                const items = menuService.byCategory(c.id)
                if (!items.length) return null
                return (
                  <section key={c.id} id={`cat-${c.id}`} className="pt-7 md:pt-9">
                    <h2 className="mb-3 flex items-center gap-2 text-xl font-bold md:mb-4 md:text-2xl">
                      <span>{c.emoji}</span>
                      {c.name}
                      <span className="text-sm font-medium text-muted">({items.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 2xl:grid-cols-3">
                      {items.map((p) => (
                        <ProductRow key={`${c.id}-${p.id}`} product={p} />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </Container>
        </>
      )}
    </div>
  )
}
