import type { RequestHandler } from '@sveltejs/kit';
import { beingPolled, pollingResponse } from '$lib/Polling.js';

let count = 1;
export const GET: RequestHandler = async ({ url, cookies }) => {
	const reset = cookies.get('reset') !== undefined;
	console.log('reset', reset);
	if (reset) {
		cookies.delete('reset');
		count = 1;
	}

	if (beingPolled(url)) {
		count++;
		return pollingResponse({ rootCount: count, layoutCount: count + 1 });
	}

	return new Response();
};
