<script>
	import * as d3 from 'd3';
	import { isHandMeDown } from './data.js';

	// selectedId: LINK source. Clicking a bar writes it through onselect;
	// clicking the same bar again clears it.
	let { reigns, models, xDomain, selectedId = null, onselect } = $props();

	const margin = { top: 6, right: 20, bottom: 26, left: 170 };
	const width = 520;
	const rowH = 22;
	const height = $derived(reigns.length * rowH);

	const x = $derived(d3.scaleTime().domain(xDomain).range([0, width]));
	const y = $derived(
		d3.scaleBand(d3.sort(reigns, (r) => -r.intel).map((r) => r.id), [0, height]).paddingInner(0.3)
	);

	// Date the first cheaper-and-at-least-as-smart model shipped (same rule
	// the scatter uses), so the diamond and the highlighted dots always agree.
	const firstMatch = $derived(
		new Map(
			reigns.map((r) => {
				const hits = models.filter((m) => isHandMeDown(m, r));
				return [r.id, hits.length ? d3.min(hits, (m) => m.date) : null];
			})
		)
	);

	let axisEl = $state(null);
	$effect(() => {
		if (axisEl) d3.select(axisEl).call(d3.axisBottom(x).ticks(d3.timeMonth.every(6)).tickFormat(d3.timeFormat('%b %Y')));
	});
</script>

<svg viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}
	role="img" aria-label="Timeline of flagship reigns, strongest at the top: each bar runs from release until a smarter model arrived">
	<g transform={`translate(${margin.left},${margin.top})`}>
		{#each reigns as r}
			{@const end = r.capEnd ?? xDomain[1]}
			{@const sel = r.id === selectedId}
			{@const fm = firstMatch.get(r.id)}
			<g class="row" class:sel class:faded={selectedId && !sel}
				role="button" tabindex="0" aria-pressed={sel}
				onclick={() => onselect(sel ? null : r.id)}
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onselect(sel ? null : r.id)}>
				<rect class="hit" x={-margin.left} y={y(r.id) - 3} width={width + margin.left} height={y.bandwidth() + 6} />
				<text class="name" x={-8} y={y(r.id) + y.bandwidth() / 2} dy="0.32em" text-anchor="end">{r.name} <tspan class="score">· {r.intel.toFixed(0)}</tspan></text>
				<rect class="bar" x={x(r.date)} y={y(r.id)} width={Math.max(3, x(end) - x(r.date))}
					height={y.bandwidth()} rx="3" />
				{#if fm}
					<path class="match" d={`M${x(fm)},${y(r.id) + y.bandwidth() / 2 - 5} l5,5 l-5,5 l-5,-5 z`} />
				{/if}
			</g>
		{/each}
		<g bind:this={axisEl} transform={`translate(0,${height})`}></g>
	</g>
</svg>

<style>
	.row { cursor: pointer; outline: none; }
	.hit { fill: transparent; }
	.row:hover .hit, .row:focus-visible .hit { fill: rgb(42 120 214 / 0.06); }
	.name { font-size: 11px; fill: var(--ink-2); }
	.score { font-size: 10px; fill: var(--muted); font-variant-numeric: tabular-nums; }
	.bar { fill: #6da7ec; }
	.match { fill: var(--surface); stroke: var(--accent); stroke-width: 1.5; }
	.sel .bar { fill: var(--flag); }
	.sel .name { fill: var(--ink); font-weight: 600; }
	.faded .bar { opacity: 0.35; }
</style>
