import type { Actions, PageServerLoad } from './$types.js';

let count = 0;
export const load: PageServerLoad = async () => {
	console.log('foo load runs');
	count++;
	return { fooCount: count };
};

export const actions: Actions = {
	default: () => {
		return { ok: true };
	}
};
