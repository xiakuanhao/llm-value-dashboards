<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { loadLLM, fmtTokens, fmtUSD, monthlyCost, YEARS, yearColor } from '#lib/data.js';
	import SpeedPrice from '#lib/SpeedPrice.svelte';
	import CostWall from '#lib/CostWall.svelte';

	// root: where links start. '/' in the SvelteKit app; the static build in
	// docs/ passes a relative path so the pages also work on GitHub Pages.
	let { root = '/' } = $props();

	let models = $state([]);

	// SHARED FILTERS (remove from BOTH views). Owner: the control row.
	let provider = $state('All');
	let license = $state('all'); // all | open | closed
	let minIntel = $state(0);
	let years = $state(new Set(YEARS));
	// Usage slider position -> tokens/month on a log scale, 1M .. 1B.
	let usagePos = $state(150);
	const tokens = $derived(10 ** (6 + usagePos / 100));

	// FILTER (Cost wall only). Owner: SpeedPrice 2-D brush.
	let box = $state(null);
	// LINK (highlight only). Owner: Cost wall hover.
	let hoveredId = $state(null);

	const providers = $derived(
		['All', ...d3.groupSort(models, (g) => -g.length, (d) => d.provider).slice(0, 15)]
	);
	const shared = $derived(
		models.filter(
			(d) =>
				(provider === 'All' || d.provider === provider) &&
				(license === 'all' || (license === 'open') === d.open) &&
				d.intel >= minIntel &&
				years.has(d.year)
		)
	);
	const boxed = $derived(
		box
			? shared.filter((d) => d.speed >= box[0][0] && d.speed <= box[0][1] && d.blended >= box[1][0] && d.blended <= box[1][1])
			: shared
	);
	const cheapest = $derived(d3.least(boxed, (d) => monthlyCost(d, tokens)));

	function toggleYear(y) {
		const s = new Set(years);
		s.has(y) ? s.delete(y) : s.add(y);
		years = s;
	}

	let scatter;
	onMount(async () => {
		({ models } = await loadLLM());
	});
</script>

<main>
	<nav class="top"><a href={root}>← prototypes</a><a href={`${root}p1/`}>← Prototype 1</a></nav>
	<h1>Prototype 2 · Which model should I actually pay for?</h1>
	<p class="note">
		Question: <strong>for my quality bar and my monthly usage, which models are fast enough and what
		would each one cost me?</strong> Set the filters, then drag a box on the scatter to shortlist models.
	</p>

	<div class="controls card">
		<label>Provider
			<select bind:value={provider}>
				{#each providers as p}<option>{p}</option>{/each}
			</select>
		</label>
		<label>License
			<select bind:value={license}>
				<option value="all">all</option><option value="open">open weights</option><option value="closed">proprietary</option>
			</select>
		</label>
		<label class="grow">Min intelligence <b>{minIntel}</b>
			<input type="range" min="0" max="50" step="1" bind:value={minIntel} />
		</label>
		<label class="grow">Usage <b>{fmtTokens(tokens)} tokens / month</b>
			<input type="range" min="0" max="300" step="1" bind:value={usagePos} />
		</label>
		<div class="years" role="group" aria-label="Release year">
			{#each YEARS as y}
				<button class:on={years.has(y)} onclick={() => toggleYear(y)} aria-pressed={years.has(y)}>
					<i style={`background:${yearColor(y)}`}></i>{y}
				</button>
			{/each}
		</div>
	</div>
	<p class="explain">
		<strong>Shared filters</strong> — provider, license, min intelligence and year REMOVE models from both views.
		Usage only changes the bills in ②. {shared.length} of {models.length} models pass.
	</p>

	<div class="layout">
		<section class="card">
			<div class="row-between">
				<h2>① Speed × price</h2>
				<button onclick={() => scatter?.clearBrush()} disabled={!box}>Clear box</button>
			</div>
			<p class="hint">
				{#if box}
					Box: {d3.format('.0f')(box[0][0])}–{d3.format('.0f')(box[0][1])} tok/s, {fmtUSD(box[1][0])}–{fmtUSD(box[1][1])}/1M → {boxed.length} models
				{:else}
					<b>Drag a box</b> to shortlist models for the cost wall.
				{/if}
			</p>
			<SpeedPrice bind:this={scatter} data={shared} {box} {hoveredId} onbrush={(b) => (box = b)} />
			<p class="explain">
				<strong>Filter</strong> — the box REMOVES models outside it from ②.
			</p>
		</section>

		<section class="card">
			<h2>② Cost wall — my monthly bill</h2>
			<p class="hint">
				{#if cheapest}
					Cheapest of {boxed.length}: <b>{cheapest.name}</b> at {fmtUSD(monthlyCost(cheapest, tokens))}/month.
					Showing up to 20, cheapest first. <b>Hover a bar.</b>
				{:else}&nbsp;{/if}
			</p>
			<CostWall data={boxed} {tokens} {hoveredId} onhover={(id) => (hoveredId = id)} />
			<p class="explain link"><strong>Link</strong> — hovering a bar RINGS that model in ①; nothing is removed.</p>
		</section>
	</div>
	<div class="legend">
		Colour = release year (both views):
		{#each YEARS as y}<span><i style={`background:${yearColor(y)}`}></i>{y}</span>{/each}
		· Bill = 80% input + 20% output tokens at list price.
	</div>
	<p class="note" style="margin-top:18px">Data: the sketchbook's calibrated seed set (453 endpoints) that reproduces our Map-phase cohort figures. Individual values are not real measurements; swap in the full tracker CSV before drawing conclusions about specific models.</p>
</main>

<style>
	.controls { display: flex; flex-wrap: wrap; gap: 12px 22px; align-items: end; font-size: 13px; color: var(--ink-2); }
	.controls label { display: grid; gap: 4px; }
	.controls .grow { flex: 1 1 200px; }
	.controls select { font: inherit; padding: 3px 6px; }
	.years { display: flex; gap: 6px; }
	.years button { display: flex; align-items: center; gap: 6px; opacity: 0.45; }
	.years button.on { opacity: 1; border-color: var(--ink-2); }
	i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
	.layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; margin-top: 14px; align-items: start; }
	.row-between { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
	.legend { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; margin-top: 14px; font-size: 13px; color: var(--ink-2); }
	.legend span { display: flex; align-items: center; gap: 5px; }
	@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
</style>
