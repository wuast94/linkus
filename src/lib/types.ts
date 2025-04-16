// Represents the config object within a Service of type 'plugin'
// Using unknown for plugin-specific values provides flexibility.
export interface PluginSpecificConfig {
	update_interval?: number; // Optional common config for plugins
	[key: string]: unknown;
}

// Combined interface for all items in the 'services' list
export interface Service {
	name: string;
	type: 'http_check' | 'plugin' | 'link'; // Renamed 'ping' to 'http_check'
	icon: string; // Simple string icon name
	url?: string;
	category: string; // ID matching a Category
	description?: string;
	groups?: string[];
	user?: string[];
	// Ping-specific
	ping_interval?: number; // In seconds
	// Plugin-specific
	plugin?: string; // Name of the plugin component
	config?: PluginSpecificConfig;
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
