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
				// Directory exists, but file is missing - try to copy the example
				console.log(
					`Runtime config file '${runtimeConfigFilePath}' not found in existing directory '${runtimeConfigDir}'. Checking for bundled example.`
				);
				if (existsSync(bundledExampleConfigFilePath)) {
					console.log(
						`Bundled example config found at '${bundledExampleConfigFilePath}'. Attempting to copy...`
					);
					copyFileSync(bundledExampleConfigFilePath, runtimeConfigFilePath);
					console.log(
						`Config file copied successfully from bundled example to '${runtimeConfigFilePath}'.`
					);
				} else {
					// Critical error: Directory exists, file doesn't, AND no example found
					const errorMsg = `Error: Config directory '${runtimeConfigDir}' exists, but config file '${runtimeConfigFilePath}' is missing, and bundled example config '${bundledExampleConfigFilePath}' is also missing. Cannot start.`;
					console.error(errorMsg);
					throw new Error(errorMsg);
				}
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
		console.error('Error during config file/directory check/creation:', error);
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

// --- Initialization Function (Sync) --- START
let isInitialized = false; // Still useful to prevent accidental re-initialization

export function initializeConfiguration(): void {
	if (isInitialized) {
		// console.warn('Configuration already initialized.'); // Optional: reduce noise
		return;
	}
	try {
		loadConfig(); // This performs the main loading logic synchronously
		isInitialized = true;
		console.log('Configuration initialized successfully.');
	} catch (error) {
		console.error('Critical error during configuration initialization:', error);
		// Prevent application from potentially running in a bad state
		throw new Error('Failed to initialize application configuration.');
	}
}
// --- Initialization Function (Sync) --- END

// Export a function to get the loaded config
export function getConfig(): Config {
	if (config === null) {
		throw new Error(
			'Configuration has not been initialized. Call initializeConfiguration() first.'
		);
	}
	return config;
}
