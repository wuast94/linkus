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

/**
 * Base interface for all critical alert checks.
 */
export interface CriticalAlert {
	name: string; // Display name for the alert
	type: 'ping' | 'web_json' | 'web_text'; // Type of check to perform
	target: string; // Hostname for ping, URL for web checks
	interval?: number; // Check interval in seconds (defaults might be set elsewhere)
	// Access control - inherits from global if not specified
	allowed_users?: string[];
	allowed_groups?: string[];
}

/**
 * Interface for Ping-based critical alerts.
 */
export interface PingCheck extends CriticalAlert {
	type: 'ping';
}

/**
 * Interface for Web checks validating a JSON response field.
 */
export interface WebCheckJson extends CriticalAlert {
	type: 'web_json';
	json_path: string; // JSONPath expression (e.g., '$.status')
	expected_value: string | number | boolean; // Expected value at the JSONPath
}

/**
 * Interface for Web checks validating text presence/absence.
 */
export interface WebCheckText extends CriticalAlert {
	type: 'web_text';
	text_present?: string; // Check if this text is present in the response body
	text_absent?: string; // Check if this text is absent in the response body
}

// Union type for all possible critical alert configurations
export type CriticalAlertConfig = PingCheck | WebCheckJson | WebCheckText;

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
	critical_alerts?: CriticalAlertConfig[]; // Optional array for critical alerts
}

// Represents the sanitized critical alert data passed to the client.
// Omits sensitive fields like target, allowed_users, allowed_groups
export interface ClientSafeCriticalAlert {
	name: string;
	type: 'ping' | 'web_json' | 'web_text';
	interval?: number; // Default interval will be handled client-side if needed
}

// Represents the status result fetched from /api/status
export interface ServiceStatus {
	online: boolean;
	status?: number; // HTTP status code
	statusText?: string;
	responseTime?: number; // Time in milliseconds
	error?: string; // Error message if check failed
}
