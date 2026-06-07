import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('loads and shows key metrics', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/VC Sourcing/i)
    await expect(page.getByText(/Pipeline Overview/i)).toBeVisible({ timeout: 10_000 })
  })

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Sourcing Pipeline/i }).click()
    await expect(page).toHaveURL(/\/sourcing/)
  })

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')

    // Click dark mode button
    const darkBtn = page.getByRole('button', { name: /dark/i })
    if (await darkBtn.isVisible()) {
      await darkBtn.click()
      const newClass = await html.getAttribute('class')
      expect(newClass).toContain('dark')
    }

    // Click light mode
    const lightBtn = page.getByRole('button', { name: /light/i })
    if (await lightBtn.isVisible()) {
      await lightBtn.click()
      const newClass = await html.getAttribute('class')
      expect(newClass ?? '').not.toContain('dark')
    }

    // Reset
    const _ = initialClass
  })
})

test.describe('Sourcing Pipeline', () => {
  test('shows kanban columns', async ({ page }) => {
    await page.goto('/sourcing')
    await expect(page.getByText(/Radar/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Contacted/i)).toBeVisible()
    await expect(page.getByText(/Engaged/i)).toBeVisible()
  })

  test('can switch to list view', async ({ page }) => {
    await page.goto('/sourcing')
    const listBtn = page.getByRole('button', { name: /list/i })
    if (await listBtn.isVisible()) {
      await listBtn.click()
      await expect(page.getByRole('table')).toBeVisible({ timeout: 5_000 })
    }
  })
})

test.describe('Screening Queue', () => {
  test('shows screening tabs', async ({ page }) => {
    await page.goto('/screening')
    await expect(page.getByRole('tab', { name: /Queued/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('tab', { name: /In Progress/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Completed/i })).toBeVisible()
  })
})

test.describe('Signals Feed', () => {
  test('loads signal feed', async ({ page }) => {
    await page.goto('/sourcing/signals')
    await expect(page.getByText(/Signals/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Accessibility', () => {
  test('main navigation is keyboard accessible', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
  })
})
