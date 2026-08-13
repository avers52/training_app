import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/ver1/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('creates, searches, persists, edits, and deletes a workout', async ({ page }) => {
  await page.getByRole('button', { name: '+ Тренировка' }).click();
  await page.getByLabel('Название').fill('Тяжёлый жим');
  await page.getByLabel('Дата').fill('2026-08-13');
  await page.getByRole('combobox', { name: 'Упражнение' }).fill('Жим лёжа');
  await page.getByLabel('Подходы').fill('5');
  await page.getByLabel('Повторы').fill('3');
  await page.getByLabel('Вес, кг').first().fill('100');
  await page.getByRole('button', { name: 'Сохранить тренировку' }).click();

  await expect(page.getByText('Тяжёлый жим')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Тяжёлый жим')).toBeVisible();
  await page.getByPlaceholder('Дата, название или упражнение').fill('становая');
  await expect(page.getByText('Ничего не найдено')).toBeVisible();
  await page.getByPlaceholder('Дата, название или упражнение').fill('жим');
  await page.getByRole('button', { name: 'Изменить' }).click();
  await page.getByLabel('Название').fill('Лёгкий жим');
  await page.getByRole('button', { name: 'Сохранить тренировку' }).click();
  await expect(page.getByText('Лёгкий жим')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Удалить' }).click();
  await expect(page.getByText('Дневник пока пуст')).toBeVisible();
});

test('saves the athlete profile locally', async ({ page }) => {
  await page.getByRole('button', { name: 'Профиль' }).click();
  await page.getByLabel('Имя').fill('Алексей');
  await page.getByLabel('Цель').selectOption('Набор массы');
  await page.getByRole('button', { name: 'Сохранить профиль' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Профиль' }).click();
  await expect(page.getByLabel('Имя')).toHaveValue('Алексей');
  await expect(page.getByLabel('Цель')).toHaveValue('Набор массы');
});
