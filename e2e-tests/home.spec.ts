import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);

        const roleCards = await page.getByTestId('role-card').all();
        const roleTitles = await Promise.all(
            roleCards.map((card) => card.getByRole('heading', { level: 3 }).innerText()),
        );
        const matchingTitle = roleTitles[0].trim();
        const searchInput = page.getByRole('searchbox', { name: 'Search roles by title' });

        await test.step('filters to matching role titles', async () => {
            await searchInput.fill(matchingTitle);

            for (const [index, card] of roleCards.entries()) {
                const matchesQuery = roleTitles[index]
                    .toLowerCase()
                    .includes(matchingTitle.toLowerCase());

                if (matchesQuery) {
                    await expect(card).toBeVisible();
                } else {
                    await expect(card).toBeHidden();
                }
            }
        });

        await test.step('announces when no roles match', async () => {
            await searchInput.fill('no matching role title');
            await expect(page.getByRole('status')).toHaveText(
                'No roles match your search. Try a different title.',
            );

            for (const card of roleCards) {
                await expect(card).toBeHidden();
            }
        });

        await test.step('restores all roles when the query is cleared', async () => {
            await searchInput.fill('');
            await expect(page.getByRole('status')).toBeHidden();

            for (const card of roleCards) {
                await expect(card).toBeVisible();
            }
        });
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
