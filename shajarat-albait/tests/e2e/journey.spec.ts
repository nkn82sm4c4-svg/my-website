import { expect, test, type Page } from '@playwright/test'

/** Full family journey in Demo mode (15 min = 30 s) */

async function fresh(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

async function setupSession(page: Page, family: string) {
  await page.getByTestId('start-session').click()
  await expect(page).toHaveURL(/#\/setup/)
  await page.getByLabel('اسم الأسرة').fill(family)
  await page.getByRole('radio', { name: /^15/ }).click()
  const code = (await page.getByTestId('setup-code').textContent())!.trim()
  expect(code).toMatch(/^\d{4}$/)
  await page.getByTestId('create-session').click()
  await expect(page).toHaveURL(/#\/lobby/)
  await expect(page.getByTestId('lobby-code')).toHaveText(code)
  return code
}

test('session from setup to garden, with a member leaving', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'long journey runs once')
  await fresh(page)
  await expect(page.getByRole('status').first()).toContainText('وضع العرض Demo')
  await expect(page.getByRole('heading', { name: 'شجرة البيت' })).toBeVisible()
  await noHorizontalScroll(page)

  const code = await setupSession(page, 'آل الاختبار')

  // Cannot start before anyone joins
  await expect(page.getByTestId('start-live')).toBeDisabled()
  await page.getByLabel('أدخل رمز الجلسة').fill(code === '1234' ? '4321' : '1234')
  await page.getByRole('button', { name: 'انضمام', exact: true }).click()
  await expect(page.getByText('الرمز غير صحيح')).toBeVisible()
  await page.getByLabel('أدخل رمز الجلسة').fill(code)
  await page.getByRole('button', { name: 'انضمام', exact: true }).click()
  await expect(page.getByTestId('lobby-count')).toContainText('1 / 4')
  await expect(page.getByTestId('start-live')).toBeEnabled()
  await page.getByText('محاكاة انضمام الجميع').click()
  await expect(page.getByTestId('lobby-count')).toContainText('4 / 4')

  // Add then remove a member
  await page.getByLabel('اسم الفرد').fill('سارة')
  await page.getByRole('button', { name: 'إضافة', exact: true }).click()
  await expect(page.getByTestId('lobby-count')).toContainText('5 / 5')
  await page.getByRole('button', { name: 'إزالة سارة' }).click()
  await expect(page.getByTestId('lobby-count')).toContainText('4 / 4')
  await noHorizontalScroll(page)

  await page.getByTestId('start-live').click()
  await expect(page).toHaveURL(/#\/live/)
  await expect(page.getByTestId('present-count')).toContainText('4 / 4')
  await expect(page.getByTestId('timer')).toHaveText(/00:(2\d|30)/)

  // New dialog card
  const firstCard = await page.getByTestId('live-card').textContent()
  await page.getByRole('button', { name: 'بطاقة جديدة' }).click()
  await expect(page.getByTestId('live-card')).not.toHaveText(firstCard!)

  // Pause freezes the timer
  await page.getByTestId('pause').click()
  const paused = await page.getByTestId('timer').textContent()
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('timer')).toHaveText(paused!)
  await page.getByTestId('resume').click()

  // A member leaves → alert, growth frozen, then returns
  await page.getByRole('button', { name: 'محاكاة مغادرة الابن', exact: true }).click()
  await expect(page.getByTestId('block-alert')).toContainText('غادر أحد أفراد الأسرة الجلسة')
  await expect(page.getByTestId('present-count')).toContainText('3 / 4')
  const frozen = await page.getByTestId('timer').textContent()
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('timer')).toHaveText(frozen!)
  await page.getByRole('button', { name: 'عودة الابن', exact: true }).click()
  await expect(page.getByTestId('present-count')).toContainText('4 / 4')
  await expect(page.getByText('فُقدت مكافأة الالتزام')).toBeVisible()

  // Session completes → result
  await expect(page).toHaveURL(/#\/result/, { timeout: 60_000 })
  await expect(page.getByTestId('result-title')).toContainText('أحسنتم يا أسرة آل الاختبار')
  await expect(page.getByTestId('session-points')).toHaveText('+20')
  await expect(page.getByTestId('new-balance')).toHaveText('180', { timeout: 5000 })
  await expect(page.getByTestId('reward-remaining')).toContainText('متبقي 20 نقطة')

  // Garden has the new tree
  await page.getByTestId('to-garden').click()
  await expect(page.getByTestId('stat-trees')).toHaveText('7', { timeout: 5000 })
  await expect(page.getByTestId('stat-sessions')).toHaveText('7')
  await expect(page.getByTestId('stat-points')).toHaveText('180')
  await noHorizontalScroll(page)

  // Data survives a reload (localStorage)
  await page.reload()
  await expect(page.getByTestId('stat-trees')).toHaveText('7')
})

test('perfect session earns 30 points; custom reward', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'runs once on desktop')
  await fresh(page)
  await setupSession(page, 'آل سالم')
  await page.getByText('محاكاة انضمام الجميع').click()
  await page.getByTestId('start-live').click()
  await expect(page.getByTestId('stage')).toBeVisible()
  await expect(page).toHaveURL(/#\/result/, { timeout: 60_000 })
  await expect(page.getByTestId('session-points')).toHaveText('+30')
  await expect(page.getByTestId('new-balance')).toHaveText('190', { timeout: 5000 })
  await expect(page.getByTestId('reward-remaining')).toContainText('متبقي 10 نقاط')

  await page.goto('/#/rewards')
  await expect(page.getByTestId('rewards-balance')).toHaveText('190')
  await page.getByLabel('اسم المكافأة').fill('رحلة إلى البحر')
  await page.getByLabel('النقاط المطلوبة').fill('250')
  await page.getByTestId('add-reward').click()
  await expect(page.getByTestId('rewards-list')).toContainText('رحلة إلى البحر')
  await noHorizontalScroll(page)
})
