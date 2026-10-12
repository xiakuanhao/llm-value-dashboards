<script>
	import * as d3 from 'd3';
	import { fmtUSD, yearColor } from './data.js';

	// data: models passing the SHARED filters (brush source keeps all of them).
	// box: current brush in data units, or null. onbrush: FILTER writer for box.
	// hoveredId: LINK from the Cost wall — ring that one dot.
	let { data, box = null, hoveredId = null, onbrush } = $props();

	const margin = { top: 10, right: 16, bottom: 42, left: 56 };
	const width = 440;
	const height = 380;

	const x = d3.scaleLog().domain([2, 1000]).range([0, width]).clamp(true);
	const y = d3.scaleLog().domain([0.05, 60]).range([height, 0]).clamp(true);

	const inBox = (d) =>
		!box || (d.speed >= box[0][0] && d.speed <= box[0][1] && d.blended >= box[1][0] && d.blended <= box[1][1]);
	const order = $derived(box ? [...data].sort((a, b) => inBox(a) - inBox(b)) : data);
	const hovered = $derived(hoveredId ? data.find((d) => d.id === hoveredId) : null);

	let xAxisEl = $state(null), yAxisEl = $state(null), gx = $state(null), gy = $state(null), brushEl = $state(null);
	let brush;
	$effect(() => {
		if (!xAxisEl) return;
		const xt = [3, 10, 30, 100, 300, 1000], yt = [0.1, 1, 10];
		d3.select(xAxisEl).call(d3.axisBottom(x).tickValues(xt).tickFormat(d3.format('~s')));
		d3.select(yAxisEl).call(d3.axisLeft(y).tickValues(yt).tickFormat((v) => `$${v}`));
		d3.select(gx).call(d3.axisBottom(x).tickValues(xt).tickSize(-height).tickFormat(''));
		d3.select(gy).call(d3.axisLeft(y).tickValues(yt).tickSize(-width).tickFormat(''));
	});
	$effect(() => {
		if (!brushEl) return;
		brush = d3.brush().extent([[0, 0], [width, height]]).on('brush end', ({ selection }) => {
			if (!selection) return onbrush(null);
			const [[x0, y0], [x1, y1]] = selection;
			onbrush([[x.invert(x0), x.invert(x1)], [y.invert(y1), y.invert(y0)]]);
		});
		d3.select(brushEl).call(brush);
	});
	export function clearBrush() {
		if (brushEl && brush) d3.select(brushEl).call(brush.move, null);
	}
</script>

<svg viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}
	role="img" aria-label="Output speed versus blended price, both log scale, one dot per model coloured by release year">
	<g transform={`translate(${margin.left},${margin.top})`}>
		<g class="grid" bind:this={gx} transform={`translate(0,${height})`}></g>
		<g class="grid" bind:this={gy}></g>
		<text class="corner" x={width - 6} y={height - 8} text-anchor="end">faster &amp; cheaper ↘</text>
		<g bind:this={brushEl}></g>
		<g class="marks">
			{#each order as d (d.id)}
				<circle class="dot" class:out={!inBox(d)} cx={x(d.speed)} cy={y(d.blended)} r="4" fill={yearColor(d.year)} />
			{/each}
			{#if hovered}
				<circle class="ring" cx={x(hovered.speed)} cy={y(hovered.blended)} r="9" />
				{@const flip = x(hovered.speed) > width * 0.55}
				<text class="ring-label" x={x(hovered.speed) + (flip ? -12 : 12)} y={y(hovered.blended) - 10}
					text-anchor={flip ? 'end' : 'start'}>
					{hovered.name} · {d3.format('.0f')(hovered.speed)} tok/s · {fmtUSD(hovered.blended)}/1M
				</text>
			{/if}
		</g>
		<g bind:this={xAxisEl} transform={`translate(0,${height})`}></g>
		<g bind:this={yAxisEl}></g>
		<text class="axis-label" x={width / 2} y={height + 36} text-anchor="middle">output tokens per second (log) →</text>
		<text class="axis-label" transform="rotate(-90)" x={-height / 2} y={-44} text-anchor="middle">blended price per 1M tokens (log)</text>
	</g>
</svg>

<style>
	.marks { pointer-events: none; }
	.dot { fill-opacity: 0.85; stroke: var(--surface); stroke-width: 0.8; }
	.dot.out { fill: var(--dim); fill-opacity: 0.3; }
	.ring { fill: none; stroke: var(--flag); stroke-width: 2.5; }
	.ring-label { font-size: 12px; font-weight: 600; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 3; }
	.corner { font-size: 11px; fill: var(--muted); }
</style>
