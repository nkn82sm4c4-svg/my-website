const nf = new Intl.NumberFormat('ar-SA-u-nu-latn')

export const num = (n: number) => nf.format(n)

/** 24:35 */
export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function dateLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long' }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

export function minutesLabel(min: number): string {
  if (min === 1) return 'دقيقة'
  if (min === 2) return 'دقيقتان'
  if (min >= 3 && min <= 10) return `${num(min)} دقائق`
  return `${num(min)} دقيقة`
}

export function pointsLabel(p: number): string {
  return `${num(p)} نقطة`
}

/** Arabic counted noun: شجرة واحدة / شجرتان / ٣ أشجار / ٢٥ شجرة */
export function treesLabel(n: number): string {
  if (n === 1) return 'شجرة واحدة'
  if (n === 2) return 'شجرتان'
  if (n >= 3 && n <= 10) return `${num(n)} أشجار`
  return `${num(n)} شجرة`
}

/** ٣ نقاط / ٢٥ نقطة */
export function pointsCount(n: number): string {
  if (n === 1) return 'نقطة واحدة'
  if (n === 2) return 'نقطتان'
  if (n >= 3 && n <= 10) return `${num(n)} نقاط`
  return `${num(n)} نقطة`
}
