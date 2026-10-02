import { LogoMark } from '../ui/Logo'

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-10 sm:px-5">
      <div className="flex flex-col items-center gap-3 border-t border-forest/10 pt-8 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-start">
        <span className="flex items-center gap-2">
          <LogoMark size={28} />
          <span>
            <b className="font-display text-forest">شجرة البيت</b> — كل جلسة هادئة تنبت شجرة جديدة 🌱
          </span>
        </span>
        <span>البيانات محفوظة على هذا الجهاز فقط</span>
      </div>
    </footer>
  )
}
