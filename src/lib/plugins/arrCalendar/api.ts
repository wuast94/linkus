import type { Service } from '$lib/types';

interface ArrEpisode {
	seriesId: number;
	episodeFileId: number;
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	airDate: string;
	airDateUtc: string;
	hasFile: boolean;
	monitored: boolean;
	series: {
		title: string;
		status: string;
		network: string;
		imdbId?: string;
		images: Array<{
			coverType: string;
			remoteUrl: string;
		}>;
	};
}

interface ArrMovie {
	title: string;
	inCinemas: string;
	digitalRelease: string;
	physicalRelease: string;
	status: string;
	imdbId?: string;
	tmdbId?: number;
	images: Array<{
		coverType: string;
		remoteUrl: string;
	}>;
	hasFile: boolean;
	monitored: boolean;
}

// Define expected structure for Calendar Event output
interface CalendarEvent {
	title: string;
	start: string;
	type: 'tv' | 'movie';
	extendedProps: {
		subtitle?: string;
		episodeNumber?: number; // Only for TV
		thumbnail?: string;
		imdbId?: string;
		tmdbId?: number; // Only for Movie
		seasonNumber?: number; // Only for TV
	};
}

async function fetchSonarrData(apiKey: string, baseUrl: string): Promise<CalendarEvent[]> {
	// Calculate date range (yesterday to 30 days from now)
	const now = new Date();
	const start = new Date(now);
	start.setDate(start.getDate() - 1);
	const end = new Date(now);
	end.setDate(end.getDate() + 30);

	// Construct API URL
	const apiUrl = new URL(`${baseUrl}/api/v3/calendar`);
	apiUrl.searchParams.set('apikey', apiKey);
	apiUrl.searchParams.set('start', start.toISOString().split('T')[0]);
	apiUrl.searchParams.set('end', end.toISOString().split('T')[0]);
	apiUrl.searchParams.set('unmonitored', 'false');
	apiUrl.searchParams.set('includeSeries', 'true');

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

	let response: Response;
	try {
		response = await fetch(apiUrl.toString(), { signal: controller.signal });
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('Sonarr request timed out after 15 seconds');
		} else {
			throw error; // Re-throw other fetch errors
		}
	} finally {
		clearTimeout(timeoutId);
	}

	if (!response.ok) {
		throw new Error(`Sonarr HTTP error! status: ${response.status}`);
	}

	const data: ArrEpisode[] = await response.json();
	return data.map((episode) => ({
		title: episode.series.title,
		start: episode.airDateUtc,
		type: 'tv',
		extendedProps: {
			// Send the raw episode title as subtitle
			subtitle: episode.title,
			// Send the raw season and episode numbers
			seasonNumber: episode.seasonNumber,
			episodeNumber: episode.episodeNumber,
			thumbnail: episode.series.images.find((img) => img.coverType === 'poster')?.remoteUrl,
			imdbId: episode.series.imdbId
		}
	}));
}

async function fetchRadarrData(apiKey: string, baseUrl: string): Promise<CalendarEvent[]> {
	// Calculate date range (yesterday to 30 days from now)
	const now = new Date();
	const start = new Date(now);
	start.setDate(start.getDate() - 1);
	const end = new Date(now);
	end.setDate(end.getDate() + 30);

	// Construct API URL
	const apiUrl = new URL(`${baseUrl}/api/v3/calendar`);
	apiUrl.searchParams.set('apikey', apiKey);
	apiUrl.searchParams.set('start', start.toISOString().split('T')[0]);
	apiUrl.searchParams.set('end', end.toISOString().split('T')[0]);
	apiUrl.searchParams.set('unmonitored', 'false');

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

	let response: Response;
	try {
		response = await fetch(apiUrl.toString(), { signal: controller.signal });
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('Radarr request timed out after 15 seconds');
		} else {
			throw error; // Re-throw other fetch errors
		}
	} finally {
		clearTimeout(timeoutId);
	}

	if (!response.ok) {
		throw new Error(`Radarr HTTP error! status: ${response.status}`);
	}

	const data: ArrMovie[] = await response.json();
	return data.map((movie) => ({
		title: movie.title,
		start: movie.digitalRelease || movie.physicalRelease || movie.inCinemas,
		type: 'movie',
		extendedProps: {
			subtitle: 'Movie Release',
			thumbnail: movie.images.find((img) => img.coverType === 'poster')?.remoteUrl,
			imdbId: movie.imdbId,
			tmdbId: movie.tmdbId
		}
	}));
}

export async function fetchArrCalendarData(service: Service): Promise<CalendarEvent[]> {
	const config = service.config ?? {};

	// Validate required config keys
	const sonarrApiKey =
		typeof config.sonarr_api_key === 'string' ? config.sonarr_api_key : undefined;
	const sonarrBaseUrl =
		typeof config.sonarr_base_url === 'string' ? config.sonarr_base_url : undefined;
	const radarrApiKey =
		typeof config.radarr_api_key === 'string' ? config.radarr_api_key : undefined;
	const radarrBaseUrl =
		typeof config.radarr_base_url === 'string' ? config.radarr_base_url : undefined;

	// Check if at least one service is configured
	const isSonarrConfigured = sonarrApiKey && sonarrBaseUrl;
	const isRadarrConfigured = radarrApiKey && radarrBaseUrl;

	if (!isSonarrConfigured && !isRadarrConfigured) {
		throw new Error(
			'Neither Sonarr nor Radarr API key and base URL are configured correctly for arrCalendar service.'
		);
	}

	// Prepare fetch promises only for configured services
	const fetchPromises: Promise<CalendarEvent[]>[] = [];

	if (isSonarrConfigured) {
		fetchPromises.push(
			fetchSonarrData(sonarrApiKey, sonarrBaseUrl).catch((err) => {
				console.error('Sonarr fetch error:', err);
				return []; // Return empty array on error for this source
			})
		);
	}

	if (isRadarrConfigured) {
		fetchPromises.push(
			fetchRadarrData(radarrApiKey, radarrBaseUrl).catch((err) => {
				console.error('Radarr fetch error:', err);
				return []; // Return empty array on error for this source
			})
		);
	}

	try {
		// Fetch data from configured services in parallel
		const results = await Promise.all(fetchPromises);
		const allEvents = results.flat(); // Combine results from all successful fetches

		// Combine and sort events
		return allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
	} catch (error) {
		// This catch block might be less likely to be hit now due to individual catches,
		// but kept as a safeguard for Promise.all itself or unforeseen issues.
		console.error('Error fetching calendar data:', error);
		throw error; // Re-throw the error to be handled by the caller
	}
}
