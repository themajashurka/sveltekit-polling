import type { LayoutServerLoad } from './$types.js';

let count = 0;
let otherCount = 1;
export const load: LayoutServerLoad = async () => {
	console.log('layout load runs');
	count++;
	otherCount *= 2;
	return { layoutCount: count, layoutOtherCount: otherCount };
};
