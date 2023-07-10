import type { LayoutServerLoad } from './$types.js';

let count = 0;
export const load: LayoutServerLoad = async () => {
	console.log('layout load runs');
	count++;
	return { layoutCount: count };
};
