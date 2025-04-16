import yaml from 'js-yaml';
import { readFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Config } from '$lib/types';

// Define paths relative to the running application within the container
const runtimeConfigDir = path.resolve('/app/config'); // Directory for runtime config
const runtimeConfigFilePath = path.join(runtimeConfigDir, 'config.yaml'); // Expected runtime config
const bundledExampleConfigFilePath = path.resolve('/app/config.example.yaml'); // Example bundled in image

let config: Config | null = null; // Initialize as null to track loading state

function ensureConfigExists() {
	console.log(`Checking for runtime config at: ${runtimeConfigFilePath}`);
	try {
		// Check if the runtime config directory exists first
		if (existsSync(runtimeConfigDir)) {
			// Directory exists (volume likely mounted), check for the file
			if (existsSync(runtimeConfigFilePath)) {
				console.log(`Runtime config found at '${runtimeConfigFilePath}'.`);
			} else {
				// Directory exists, but file is missing - user error with mounted volume
				const errorMsg = `Error: Config directory '${runtimeConfigDir}' exists (volume mounted?), but config file '${runtimeConfigFilePath}' is missing. Please ensure config.yaml is present in your mounted volume.`;
				console.error(errorMsg);
				throw new Error(errorMsg);
			}
		} else {
			// Runtime directory does NOT exist, proceed with example copy logic
			console.log(`Runtime config directory '${runtimeConfigDir}' not found.`);
			console.log(`Checking for bundled example config at: ${bundledExampleConfigFilePath}`);
			if (existsSync(bundledExampleConfigFilePath)) {
				console.log(`Bundled example config found. Attempting to copy to runtime location...`);

				// Ensure the runtime config directory exists (it didn't initially)
				console.log(`Creating runtime config directory: ${runtimeConfigDir}`);
				mkdirSync(runtimeConfigDir, { recursive: true });

				// Copy the bundled example to the expected runtime location
				copyFileSync(bundledExampleConfigFilePath, runtimeConfigFilePath);
				console.log(
					`Config file copied successfully from bundled example to '${runtimeConfigFilePath}'.`
				);
			} else {
				// Critical error: No runtime dir and no bundled example found
				const errorMsg = `Error: Runtime config directory '${runtimeConfigDir}' not found and bundled example config '${bundledExampleConfigFilePath}' is also missing. Cannot start.`;
				console.error(errorMsg);
				throw new Error(errorMsg);
			}
		}
	} catch (error) {
		console.error('Error during config file check/copy:', error);
		throw error; // Re-throw error to prevent application start with invalid config state
	}
}

function loadConfig(): Config {
	// Only load if not already loaded
	if (config === null) {
		try {
			ensureConfigExists(); // Check and potentially copy the config file first
			console.log(`Loading configuration from: ${runtimeConfigFilePath}`);
			const configFile = readFileSync(runtimeConfigFilePath, 'utf8');
			const loadedYaml = yaml.load(configFile);

			if (typeof loadedYaml !== 'object' || loadedYaml === null) {
				throw new Error('Parsed configuration is not a valid object.');
			}

			config = loadedYaml as Config; // Assume basic type validation for now
			console.log('Configuration loaded successfully.');
		} catch (e) {
			console.error(`Failed to load or parse configuration from '${runtimeConfigFilePath}':`, e);
			config = null; // Ensure config remains null on failure
			throw new Error('Failed to initialize configuration.');
		}
	}
	// If config is still null after attempting load, something went wrong
	if (config === null) {
		throw new Error('Configuration could not be loaded.');
	}
	return config;
}

// Load the config immediately when this module is imported
try {
	loadConfig();
} catch (error) {
	console.error('Critical error during initial configuration load:', error);
	// Depending on the environment, you might want to exit the process
	// process.exit(1);
}

// Export a function to get the loaded config
export function getConfig(): Config {
	if (config === null) {
		// This path indicates a failure during the initial load.
		console.error('Attempting to get config, but initial load failed or config is null.');
		// Optionally attempt a reload, but it likely failed for a persistent reason.
		// loadConfig(); // Be cautious about retrying automatically.
		throw new Error('Configuration is not available due to load failure.');
	}
	return config;
}
