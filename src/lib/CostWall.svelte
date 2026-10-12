<script>
	import * as d3 from 'd3';
	import { monthlyCost, fmtUSD, yearColor } from './data.js';

	// data: models after shared filters AND the Speed×price brush (FILTERED).
	// tokens: monthly usage from the slider. onhover: LINK writer for hoveredId.
	let { data, tokens, hoveredId = null, onhover, limit = 20 } = $props();

	const margin = { top: 4, right: 64, bottom: 30, left: 150 };
	const width = 300;
	const rowH = 19;

	const rows = $derived(
		data
			.map((d) => ({ d, cost: monthlyCost(d, tokens) }))
			.sort((a, b) => a.cost - b.cost)
			.slice(0, limit)
	);
	const height = $derived(Math.max(rows.length, 1) * rowH);
	const x = $derived(d3.scaleLinear().domain([0, d3.max(rows, (r) => r.cost) || 1]).nice().range([0, width]));
	const y = $derived(d3.scaleBand(rows.map((r) => r.d.id), [0, height]).paddingInner(0.25));

	let axisEl = $state(null);
	$effect(() => {
		if (axisEl) d3.select(axisEl).call(d3.axisBottom(x).ticks(4).tickFormat((v) => fmtUSD(v)));
	});
</script>

{#if rows.length === 0}
	<p class="empty">No models match the current filters.</p>
{:else}
	<svg viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}
		role="img" aria-label="Monthly bill for the cheapest matching models, sorted ascending">
		<g transform={`translate(${margin.left},${margin.top})`}>
			{#each rows as r (r.d.id)}
				{@const hov = r.d.id === hoveredId}
				<g class="row" class:hov class:faded={hoveredId && !hov}
					role="presentation"
					onpointerenter={() => onhover(r.d.id)} onpointerleave={() => onhover(null)}>
					<rect class="hit" x={-margin.left} y={y(r.d.id) - 2} width={width + margin.left + margin.right} height={y.bandwidth() + 4} />
					<text class="name" x={-8} y={y(r.d.id) + y.bandwidth() / 2} dy="0.32em" text-anchor="end">{r.d.name}</text>
					<rect class="bar" x="0" y={y(r.d.id)} width={Math.max(2, x(r.cost))} height={y.bandwidth()} rx="3" fill={yearColor(r.d.year)} />
					<text class="val" x={Math.max(2, x(r.cost)) + 5} y={y(r.d.id) + y.bandwidth() / 2} dy="0.32em">{fmtUSD(r.cost)}</text>
				</g>
			{/each}
			<g bind:this={axisEl} transform={`translate(0,${height})`}></g>
		</g>
	</svg>
{/if}

<style>
	.row { cursor: default; }
	.hit { fill: transparent; }
	.row.hov .hit { fill: rgb(235 104 52 / 0.08); }
	.row.hov .name { fill: var(--ink); font-weight: 600; }
	.faded .bar { opacity: 0.4; }
	.name { font-size: 11px; fill: var(--ink-2); }
	.val { font-size: 11px; fill: var(--ink-2); font-variant-numeric: tabular-nums; }
	.empty { color: var(--muted); font-size: 13px; }
</style>
