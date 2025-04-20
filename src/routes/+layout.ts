import type { LayoutServerLoad } from './$types';
import type { ClientSafeCriticalAlert } from '$lib/types';

// Type for the data loaded in +layout.server.ts
export type LayoutServerData = Awaited<ReturnType<LayoutServerLoad>>;

// Type for the data available in +layout.svelte
// Use a type alias with intersection instead of extending an interface
export type LayoutData = LayoutServerData & {
	criticalAlerts: ClientSafeCriticalAlert[];
};
