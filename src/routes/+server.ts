import type { RequestHandler } from '@sveltejs/kit';
import { beingPolled, pollingResponse } from '$lib/Polling.js';

let count = 1;
export const GET: RequestHandler = async ({ url }) => {
	if (beingPolled(url)) {
		count++;
		return pollingResponse({ layoutCount: count });
	}

	return new Response();
};
