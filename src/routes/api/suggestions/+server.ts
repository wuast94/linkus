import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import iconv from 'iconv-lite';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	if (!query) {
		return json([]);
	}

	try {
		const response = await fetch(
			`https://suggestqueries.google.com/complete/search?client=firefox&hl=de&q=${encodeURIComponent(query)}`
		);

		const buffer = await response.arrayBuffer();
		const text = iconv.decode(Buffer.from(buffer), 'iso-8859-1');
		const data = JSON.parse(text);

		return json(data[1]);
	} catch (error) {
		console.error('Error fetching suggestions:', error);
		return json([]);
	}
};
