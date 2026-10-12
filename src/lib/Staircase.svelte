<script>
	import * as d3 from 'd3';
	import { isHandMeDown, YEARS } from './data.js';

	// data: the FULL set (brush source keeps every model so the brush stays usable).
	// flagship: LINK (highlight only). onbrush: FILTER writer for dateRange.
	let { data, xDomain, flagship = null, onbrush } = $props();

	const margin = { top: 10, right: 20, bottom: 40, left: 170 };
	const width = 520;
	const height = 230;

	// Value = intelligence points per $ (per 1M tokens) = 1 / usd_per_point,
	// so HIGHER is better value and the staircase climbs.
	const pts = $derived(data.filter((d) => d.usd_per_point > 0).map((d) => ({ ...d, ppd: 1 / d.usd_per_point })));
	const x = $derived(d3.scaleTime().domain(xDomain).range([0, width]));
	const y = d3.scaleLog().domain([0.1, 1000]).range([height, 0]).clamp(true);

	// The staircase itself: one horizontal tread per release-year cohort at
	// that cohort's median points per $, joined by risers.
	const steps = $derived(
		YEARS.map((yr) => {
			const v = d3.median(pts.filter((d) => d.year === yr), (d) => d.ppd);
			const x0 = Math.max(x(new Date(yr, 0, 1)), 0);
			const x1 = Math.min(x(new Date(yr + 1, 0, 1)), width);
			return v ? { yr, v, x0, x1 } : null;
		}).filter(Boolean)
	);
	const stairPath = $derived(
		steps.map((s, i) => `${i ? 'L' : 'M'}${s.x0},${y(s.v)} L${s.x1},${y(s.v)}`).join(' ')
	);

	function cls(d) {
		if (!flagship) return 'dot';
		if (d.id === flagship.id) return 'dot flag';
		return isHandMeDown(d, flagship) ? 'dot hit' : 'dot dim';
	}
	// Highlighted dots paint last (SVG has no z-index).
	const order = $derived(
		flagship ? [...pts].sort((a, b) => (cls(a) === 'dot dim' ? 0 : 1) - (cls(b) === 'dot dim' ? 0 : 1)) : pts
	);

	let xAxisEl = $state(null), yAxisEl = $state(null), gridEl = $state(null), brushEl = $state(null);
	let brush;

	$effect(() => {
		if (!xAxisEl) return;
		d3.select(xAxisEl).call(d3.axisBottom(x).ticks(d3.timeMonth.every(6)).tickFormat(d3.timeFormat('%b %Y')));
		const yt = [0.1, 1, 10, 100, 1000];
		d3.select(yAxisEl).call(d3.axisLeft(y).tickValues(yt).tickFormat(d3.format('~')));
		d3.select(gridEl).call(d3.axisLeft(y).tickValues(yt).tickSize(-width).tickFormat(''));
	});

	$effect(() => {
		if (!brushEl) return;
		brush = d3.brushX().extent([[0, 0], [width, height]]).on('brush end', ({ selection }) => {
			onbrush(selection ? selection.map(x.invert) : null);
		});
		d3.select(brushEl).call(brush);
	});

	export function clearBrush() {
		if (brushEl && brush) d3.select(brushEl).call(brush.move, null);
	}
</script>

<svg viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}
	role="img" aria-label="Intelligence points per dollar by release date, log scale, higher is better value, with cohort medians as a staircase">
	<g transform={`translate(${margin.left},${margin.top})`}>
		<g class="grid" bind:this={gridEl}></g>
		<g bind:this={brushEl}></g>
		<g class="marks">
			{#each order as d (d.id)}
				<circle class={cls(d)} cx={x(d.date)} cy={y(d.ppd)} r={d.id === flagship?.id ? 6 : 3} />
			{/each}
			<path class="stair" d={stairPath} />
			{#each steps as s}
				<text class="step-label" x={s.x0 + 4} y={y(s.v) - 6}>{s.yr} median {s.v.toFixed(1)} pts/$</text>
			{/each}
		</g>
		<g bind:this={xAxisEl} transform={`translate(0,${height})`}></g>
		<g bind:this={yAxisEl}></g>
		<text class="axis-label" transform="rotate(-90)" x={-height / 2} y={-48} text-anchor="middle">intelligence points per $ (log) ↑</text>
		<text class="axis-label" x={width / 2} y={height + 36} text-anchor="middle">release date</text>
	</g>
</svg>

<style>
	.marks { pointer-events: none; }
	.dot { fill: #6da7ec; fill-opacity: 0.45; }
	.dot.dim { fill: var(--dim); fill-opacity: 0.25; }
	.dot.hit { fill: var(--accent); fill-opacity: 0.95; stroke: var(--surface); stroke-width: 1; }
	.dot.flag { fill: var(--flag); fill-opacity: 1; stroke: var(--surface); stroke-width: 2; }
	.stair { fill: none; stroke: var(--ink); stroke-width: 2; }
	.step-label { font-size: 11px; fill: var(--ink-2); paint-order: stroke; stroke: var(--surface); stroke-width: 3; }
</style>
