import { expect, test } from '@playwright/test';

const sleep = (duration: number) => new Promise((res) => setTimeout(() => res(''), duration));

test('all counts to be 1', async ({ page }) => {
	await page.goto('/');

	const reset = page.getByTestId('reset');
	const gotoFoo = page.getByTestId('gotoFoo');
	const gotoLayout = page.getByTestId('gotoLayout');
	const incrementRootCount = page.getByTestId('incrementRootCount');
	await reset.click();

	const dataLayoutCount = page.getByTestId('dataLayoutCount');
	const dataRootCount = page.getByTestId('dataRootCount');
	const polledDataRootCount = page.getByTestId('polledDataRootCount');
	const dataRootOtherCount = page.getByTestId('dataRootOtherCount');
	const polledDataOtherRootCount = page.getByTestId('polledDataOtherRootCount');

	await expect(dataLayoutCount).toHaveText('1');
	await expect(dataRootCount).toHaveText('1');
	await expect(polledDataRootCount).toHaveText('1');
	await expect(dataRootOtherCount).toHaveText('3');
	await expect(polledDataOtherRootCount).toHaveText('3');

	await sleep(1000);
	await expect(dataLayoutCount).toHaveText('1');
	await expect(dataRootCount).toHaveText('1');
	await expect(polledDataRootCount).toHaveText('2');
	await sleep(1000);
	await expect(dataRootCount).toHaveText('1');
	await expect(polledDataRootCount).toHaveText('3');

	await gotoFoo.click();
	await gotoLayout.click();
	await expect(dataRootCount).toHaveText('2');
	await expect(polledDataRootCount).toHaveText('2');

	await incrementRootCount.click();
	await expect(dataRootCount).toHaveText('3');
	await expect(polledDataRootCount).toHaveText('3');
	await sleep(1000);
	await expect(dataRootCount).toHaveText('3');
	await expect(polledDataRootCount).toHaveText('4');
});
