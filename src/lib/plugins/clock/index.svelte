<script lang="ts">
	import { onMount } from 'svelte';

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

<div class="clock-plugin">
	<h2>Current Time</h2>
	<p class="time">{currentTime}</p>
</div>

<style>
	.clock-plugin {
		padding: 1rem;
		text-align: center;
		background-color: var(--card-bg-color, #f9f9f9); /* Use theme variable if available */
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	.time {
		font-size: 2em;
		font-weight: bold;
		margin-top: 0.5rem;
		color: var(--text-color, #333); /* Use theme variable */
	}
</style>
