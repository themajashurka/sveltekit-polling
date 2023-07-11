import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

let count = 0,
	otherCount = 0;
export const load: PageServerLoad = async ({ cookies }) => {
	console.log('root load runs');

	const reset = cookies.get('reset') !== undefined;
	console.log('reset', reset);
	if (reset) {
		count = 0;
		otherCount = 1;
	}

	count++;
	otherCount += 2;
	return { rootCount: count, rootOtherCount: otherCount };
};

export const actions: Actions = {
	_default: async () => {
		return { ok: true };
	},
	reset: async ({ cookies }) => {
		cookies.set('reset', 'true', { secure: false });
		count = 0;
		otherCount = 0;
		return { ok: true };
	}
};
