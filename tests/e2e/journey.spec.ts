import { expect, test, type Page } from '@playwright/test'

const SHOTS = process.env.SHOTS_DIR

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/')
})

test('QR scan → home', async ({ page }) => {
  await expect(page.getByText('امسح QR للوصول إلى منيو سنمار')).toBeVisible()
  await shot(page, '01-scan')
  await page.getByRole('button', { name: 'محاكاة مسح QR' }).click()
  await expect(page.getByRole('heading', { name: 'سِنمار', level: 1 })).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('منيوك، عروضك، ومكافآتك في مكان واحد').first()).toBeVisible()
  for (const label of ['عروض اليوم', 'الأكثر طلبًا', 'برنامج الولاء', 'منتجات مميزة', 'ابدأ الطلب']) {
    await expect(page.getByRole('button', { name: new RegExp(label) }).first()).toBeVisible()
  }
  await page.waitForTimeout(1500)
  await shot(page, '02-home')
})

test('loyalty: simulate orders 3/5 → 5/5 → reward → free item in cart', async ({ page }) => {
  await page.goto('/#/loyalty')
  const card = page.locator('section').filter({ hasText: 'برنامج ولاء سنمار' }).first()
  await expect(card).toContainText('3')
  await expect(card).toContainText('بقي لك طلبان للحصول على مكافأتك 🎁')
  await card.getByRole('button', { name: 'محاكاة طلب' }).click()
  await expect(card).toContainText('بقي لك طلب واحد')
  await shot(page, '03-loyalty-4of5')
  await card.getByRole('button', { name: 'محاكاة طلب' }).click()
  await expect(page.getByText('مبروك!')).toBeVisible()
  await expect(page.getByText('مكافأتك أصبحت جاهزة')).toBeVisible()
  await page.waitForTimeout(600)
  await shot(page, '04-reward')
  await page.getByRole('dialog').getByRole('button', { name: 'استخدم المكافأة' }).click()
  await expect(page.getByText('كود المكافأة')).toBeVisible()
  await expect(page.getByText(/SN-[A-Z0-9]{4}/)).toBeVisible()
  await page.getByRole('button', { name: 'اذهب للسلة' }).click()
  await expect(page.getByText('مكافأة الولاء')).toBeVisible()
  await expect(page.getByText('مجانًا').first()).toBeVisible()
  // card restarted
  await page.goto('/#/loyalty')
  await expect(page.getByText('بقي لك 5 طلبات للحصول على مكافأتك 🎁')).toBeVisible()
})

test('menu → add → upsell → cart edit → confirm → +1 loyalty point', async ({ page }) => {
  await page.goto('/#/menu')
  await expect(page.getByRole('heading', { name: 'المنيو' })).toBeVisible()
  // all requested categories exist
  for (const c of ['الأكثر مبيعًا', 'ضاربات', 'صواريخ', 'دبلها ما تملها', 'مشاركة', 'منصفات', 'شاورما', 'بيتزا', 'سنمارية فطيرة', 'فطائر يومية', 'بطاطس', 'مشروبات']) {
    await expect(page.locator(`[data-cat]`, { hasText: c })).toHaveCount(1)
  }
  await page.locator('[data-cat]', { hasText: 'ضاربات' }).click()
  await page.waitForTimeout(800)
  await shot(page, '05-menu')
  const row = page.locator('#cat-darbat article').filter({ hasText: 'ضاربة كلاسيك' })
  await row.getByRole('button', { name: 'أضف' }).click()

  // upsell
  await expect(page.getByRole('heading', { name: /أكمل وجبتك؟/ })).toBeVisible()
  await expect(page.getByText('حوّلها وجبة كاملة')).toBeVisible()
  await page.waitForTimeout(500)
  await shot(page, '06-upsell')
  await page.getByText('حوّلها وجبة كاملة').click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('div.rounded-2xl').filter({ hasText: 'صوص سنمار' }).getByRole('button').click()
  await expect(dialog.getByText('أُضيف').first()).toBeVisible()
  await dialog.getByRole('button', { name: /السلة/ }).click()

  // cart
  await expect(page.getByRole('heading', { name: 'سلتك' })).toBeVisible()
  const burgerLine = page.locator('li').filter({ hasText: 'ضاربة كلاسيك' })
  await expect(burgerLine).toBeVisible()
  const total = page.getByText('الإجمالي', { exact: true }).locator('..')
  const before = await total.textContent()
  await burgerLine.getByRole('button', { name: 'زيادة' }).click()
  await expect(burgerLine.getByText('2', { exact: true })).toBeVisible()
  await burgerLine.getByRole('button', { name: /جبنة إضافية/ }).click()
  await expect(total).not.toHaveText(before ?? '')
  await expect(page.getByText(/من اقتراحات/).first()).toBeVisible()
  // remove the sauce line
  const sauceLine = page.locator('main li').filter({ has: page.getByText('صوص سنمار', { exact: true }) })
  await expect(sauceLine).toHaveCount(1)
  await sauceLine.getByRole('button', { name: 'حذف' }).first().click()
  await expect(sauceLine).toHaveCount(0)
  await expect(burgerLine).toBeVisible()
  await expect(page.getByText('+1 نقطة ولاء')).toBeVisible()
  await shot(page, '07-cart')

  await page.getByRole('button', { name: /تأكيد الطلب/ }).click()
  await expect(page.getByText('🎉 تم تسجيل طلبك')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('+1 نقطة ولاء')).toBeVisible()
  await expect(page.getByText('بقي لك طلب واحد للحصول على مكافأتك 🎁')).toBeVisible()
  await page.waitForTimeout(800)
  await shot(page, '08-success')

  await page.getByRole('button', { name: 'بطاقة الولاء' }).click()
  await expect(page.getByText(/طلب #S-/)).toBeVisible()
})

test('3D viewer loads the GLB and responds to controls', async ({ page }) => {
  await page.goto('/#/menu')
  await page.locator('#cat-darbat article').first().getByRole('button').first().click()
  await page.getByRole('button', { name: 'تجربة 3D' }).click()
  const mv = page.locator('model-viewer')
  await expect(mv).toHaveCount(1)
  await expect.poll(async () => mv.evaluate((el) => (el as unknown as { loaded: boolean }).loaded), { timeout: 30000 }).toBe(true)
  await expect(page.getByText('اسحب للتدوير')).toBeVisible()
  await page.getByRole('button', { name: 'علوي' }).click()
  await expect.poll(() => mv.evaluate((el) => (el as unknown as { cameraOrbit: string }).cameraOrbit)).toContain('12deg')
  await page.getByRole('button', { name: 'تكبير' }).click()
  await page.getByRole('button', { name: 'ملء الشاشة' }).click()
  await page.waitForTimeout(1200)
  await shot(page, '09-3d')
  await page.getByRole('button', { name: 'تصغير', exact: true }).click()
  // drag to rotate
  const box = (await mv.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await page.getByRole('button', { name: /أضف للسلة/ }).click()
  await expect(page.getByRole('heading', { name: /أكمل وجبتك؟/ })).toBeVisible()
})

test('offers: order now + members offer', async ({ page }) => {
  await page.goto('/#/offers')
  await expect(page.getByRole('heading', { name: '🔥 عروض سنمار' })).toBeVisible()
  await expect(page.getByText('عرض خاص لأعضاء الولاء').first()).toBeVisible()
  await page.waitForTimeout(600)
  await shot(page, '10-offers')
  await page.getByRole('button', { name: 'اطلب الآن' }).first().click()
  await expect(page.getByRole('button', { name: 'أضف مرة أخرى' })).toBeVisible()
  await page.getByRole('button', { name: /عرض السلة/ }).click()
  await expect(page.locator('main li').filter({ hasText: 'وجبة سنمار الكاملة' })).toBeVisible()
})

test('manager view explains value + live stats', async ({ page }) => {
  await page.goto('/#/')
  await page.getByRole('button', { name: 'للمدير' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('زيادة عودة العملاء')).toBeVisible()
  await expect(dialog.getByText('رفع متوسط قيمة الطلب')).toBeVisible()
  await expect(dialog.getByText('أرقام هذه التجربة')).toBeVisible()
  await page.waitForTimeout(500)
  await shot(page, '11-manager')
})
