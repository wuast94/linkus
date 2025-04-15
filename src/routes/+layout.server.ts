import { getConfig } from '$lib/utils/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	// console.log('[LayoutServerLoad] Loading appConfig for layout...'); // Removed log
	const config = getConfig();
	return {
		appConfig: config.app
	};
};
