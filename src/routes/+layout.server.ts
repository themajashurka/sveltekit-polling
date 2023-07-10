import type { LayoutServerLoad } from './$types.js';

let count = 0;
export const load: LayoutServerLoad = async ({ cookies }) => {
	console.log('layout load runs');
	const reset = cookies.get('reset') !== undefined;
	if (reset) {
		count = 0;
	}

	count++;
	return { layoutCount: count };
};
