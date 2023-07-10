import type { Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async () => {
		return { ok: true };
	}
};
