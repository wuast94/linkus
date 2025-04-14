<script lang="ts">
    import { onMount } from 'svelte';
    import { clickOutside } from '$lib/actions/clickOutside';

    let searchInput: HTMLInputElement;
    let query = '';
    let suggestions: string[] = [];
    let showSuggestions = false;
    let selectedIndex = -1;
    let debounceTimeout: number | null = null;

    async function fetchSuggestions(query: string) {
        try {
            const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data as string[];
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    }

    let lastQuery = '';
    async function updateSuggestions() {
        if (query === lastQuery) return;
        lastQuery = query;

        if (query.trim().length === 0) {
            suggestions = [];
            showSuggestions = false;
            return;
        }

        suggestions = await fetchSuggestions(query);
        selectedIndex = -1; // Reset selection when suggestions update
        showSuggestions = suggestions.length > 0;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!showSuggestions) {
            if (event.key === 'Enter') search();
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedIndex >= 0) {
                    query = suggestions[selectedIndex];
                }
                search();
                break;
            case 'Escape':
                event.preventDefault();
                showSuggestions = false;
                break;
        }
    }

    function search() {
        if (query.trim()) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            showSuggestions = false;
            query = '';
            searchInput?.focus();
        }
    }

    function handleSuggestionClick(suggestion: string) {
        query = suggestion;
        search();
    }

    $: {
        if (debounceTimeout) clearTimeout(debounceTimeout);
        if (query.trim().length > 0) {
            debounceTimeout = window.setTimeout(() => {
                updateSuggestions();
            }, 300); // 300ms debounce
        } else {
            // Clear suggestions immediately if query is empty
            lastQuery = '';
            suggestions = [];
            showSuggestions = false;
            selectedIndex = -1;
        }
    }

    onMount(() => {
        searchInput?.focus();
    });
</script>

<div class="relative w-full max-w-xl" use:clickOutside={() => (showSuggestions = false)}>
    <input
        bind:this={searchInput}
        type="text"
        bind:value={query}
        on:keydown={handleKeydown}
        placeholder="Search Google..."
        class="w-full h-10 px-4 bg-dracula-current-line rounded-md text-text placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-dracula-purple"
    />

    {#if showSuggestions && suggestions.length > 0}
        <div class="absolute w-full mt-2 z-50 bg-dracula-current-line rounded-md">
            {#each suggestions as suggestion, i}
                <button
                    class="!bg-dracula-current-line w-full px-4 py-2 text-left !text-text hover:!bg-dracula-purple {i === selectedIndex ? '!bg-dracula-purple' : ''}"
                    on:click={() => handleSuggestionClick(suggestion)}
                >
                    {suggestion}
                </button>
            {/each}
        </div>
    {/if}
</div>
