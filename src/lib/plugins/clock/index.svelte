<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let currentTime: string = new Date().toLocaleTimeString();

	onMount(() => {
		const interval = setInterval(() => {
			currentTime = new Date().toLocaleTimeString();
		}, 1000);

		// Clear interval on component destroy
		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="block border border-base-300 bg-base-200 shadow-md rounded p-4">
	<p class="text-2xl font-bold text-center text-base-content">{currentTime}</p>
</div>
