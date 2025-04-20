// Represents the config object within a Service of type 'plugin'
// Using unknown for plugin-specific values provides flexibility.
export interface PluginSpecificConfig {
	update_interval?: number; // Optional common config for plugins
	[key: string]: unknown;
}

// Combined interface for all items in the 'services' list
export interface Service {
	name: string;
	icon?: string; // Optional icon
	url?: string; // URL for the service (required for link/http_check, optional for plugin)
	check_url?: string; // Optional: Separate URL specifically for health checks
	type: 'http_check' | 'plugin' | 'link'; // Renamed 'ping' to 'http_check'
	category?: string; // Optional category
	description?: string; // Optional description
	plugin?: string; // Required if type is 'plugin'
	headers?: Record<string, string>; // Optional: Custom headers for http_check
	config?: PluginSpecificConfig; // Optional plugin-specific config
	groups?: string[]; // Optional: Restrict visibility by group
	user?: string[]; // Optional: Restrict visibility by user
	// Ping-specific
	ping_interval?: number; // In seconds
}

export interface Category {
	id: string;
	name: string;
	icon: string; // Simple string icon name
}

export interface User {
	user: string;
	name: string;
	email?: string;
	groups: string[];
}

// Represents the structure of the entire config.yaml file
export interface Config {
	app: {
		title: string;
		theme: 'light' | 'dark' | 'system'; // Define allowed themes
	};
	services: Service[];
	categories: Category[];
	// Test headers directly at the root
	'Remote-User'?: string;
	'Remote-Name'?: string;
	'Remote-Email'?: string;
	'Remote-Groups'?: string; // Comma-separated string
}

// Represents the status result fetched from /api/status
export interface ServiceStatus {
	online: boolean;
	status?: number; // HTTP status code
	statusText?: string;
	responseTime?: number; // Time in milliseconds
	error?: string; // Error message if check failed
}
