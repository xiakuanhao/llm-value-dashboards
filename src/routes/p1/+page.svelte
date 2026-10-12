<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { loadLLM, isHandMeDown, fmtUSD } from '#lib/data.js';
	import Reigns from '#lib/Reigns.svelte';
	import Staircase from '#lib/Staircase.svelte';
	import HandMeDowns from '#lib/HandMeDowns.svelte';

	// standalone: the single-page build (standalone/) has no other routes to link to.
	let { standalone = false } = $props();

	let models = $state([]);
	let reigns = $state([]);
	let byId = $state(new Map());

	// FILTER (remove + recompute): [Date, Date] or null. Owner: Staircase brush.
	let dateRange = $state(null);
	// LINK (highlight only): a flagship id or null. Owner: Reigns click.
	let selectedId = $state(null);

	const flagship = $derived(selectedId ? byId.get(selectedId) : null);
	// Models with no intelligence score (intel 0 = missing) can't be placed on ③.
	const scored = $derived(models.filter((d) => d.intel > 0));
	const filtered = $derived(
		dateRange ? scored.filter((d) => d.date >= dateRange[0] && d.date <= dateRange[1]) : scored
	);
	// Reigns and Staircase share one time axis so their bars and dots line up.
	const xDomain = $derived(
		models.length ? [d3.timeYear.floor(d3.min(models, (d) => d.date)), d3.max(models, (d) => d.date)] : [new Date(2023, 0, 1), new Date(2027, 0, 1)]
	);

	const summary = $derived.by(() => {
		if (!flagship) return null;
		const hits = models.filter((m) => isHandMeDown(m, flagship));
		const first = d3.min(hits, (m) => m.date);
		return {
			n: hits.length,
			nShown: filtered.filter((m) => isHandMeDown(m, flagship)).length,
			days: first ? Math.round((first - flagship.date) / 864e5) : null,
			cheapest: d3.least(hits, (m) => m.blended)
		};
	});

	let staircase;
	const fmtDate = d3.timeFormat('%b %Y');

	onMount(async () => {
		({ models, reigns, byId } = await loadLLM());
	});
</script>

<main>
	{#if !standalone}<nav class="top"><a href="/">← prototypes</a><a href="/p2">Prototype 2 →</a></nav>{/if}
	<h1>Prototype 1 · How fast do flagships get handed down?</h1>
	<p class="note">
		Question: <strong>when a new flagship ships, how long until a cheaper model is just as smart — and
		does value improve gradually or in jumps?</strong> Click a flagship on the left; brush a time window
		on the staircase to narrow the scatter.
	</p>

	<div class="layout">
		<div class="col">
			<section class="card">
				<h2>① Reigns — who was the smartest model, and for how long</h2>
				<p class="hint">Strongest on top · bar = reign until a smarter model shipped · ◇ = first cheaper match. <b>Click a flagship.</b></p>
				<Reigns {reigns} {models} {xDomain} {selectedId} onselect={(id) => (selectedId = id)} />
			</section>
			<section class="card">
				<div class="row-between">
					<h2>② Staircase — intelligence per dollar (higher = better value)</h2>
					<button onclick={() => staircase?.clearBrush()} disabled={!dateRange}>Clear brush</button>
				</div>
				<p class="hint">
					{#if dateRange}
						Window {fmtDate(dateRange[0])} – {fmtDate(dateRange[1])}: {filtered.length} of {scored.length} scored models
					{:else}
						<b>Drag across the chart</b> to filter the scatter to models released in that window.
					{/if}
				</p>
				<Staircase bind:this={staircase} data={models} {xDomain} {flagship} onbrush={(r) => (dateRange = r)} />
				<p class="explain"><strong>Filter</strong> — the brush REMOVES models outside the window from ③.</p>
			</section>
		</div>

		<section class="card">
			<h2>③ Hand-me-downs — intelligence × price</h2>
			<p class="hint">
				{#if summary}
					<b>{flagship.name}</b> ({flagship.intel.toFixed(1)} pts, {fmtUSD(flagship.blended)}/1M):
					{summary.n} later models match it for less
					{#if summary.days != null}· first after <b>{summary.days} days</b>{/if}
					{#if dateRange}· {summary.nShown} in window{/if}
				{:else}
					{filtered.length} models. Pick a flagship in ① to draw its ruler.
				{/if}
			</p>
			<HandMeDowns data={filtered} {flagship} />
			{#if summary?.cheapest}
				<p class="hint">Cheapest match: {summary.cheapest.name} at {fmtUSD(summary.cheapest.blended)}/1M
					({(flagship.blended / summary.cheapest.blended).toFixed(0)}× cheaper).</p>
			{/if}
			<p class="explain link"><strong>Link</strong> — selecting a flagship only DIMS other models in ② and ③; nothing is removed.</p>
		</section>
	</div>
	<p class="note" style="margin-top:18px">Data: the sketchbook's calibrated seed set (453 endpoints) that reproduces our Map-phase cohort figures. Individual values are not real measurements; swap in the full tracker CSV before drawing conclusions about specific models.</p>
</main>

<style>
	.layout { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 16px; align-items: start; }
	.col { display: grid; gap: 16px; }
	.row-between { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
	@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
</style>
