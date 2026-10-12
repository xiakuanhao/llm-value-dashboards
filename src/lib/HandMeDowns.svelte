<script>
	import * as d3 from 'd3';
	import { isHandMeDown, fmtUSD, intelColor, INTEL_MAX } from './data.js';

	// data: FILTERED by the Staircase brush. flagship: LINK (highlight only) —
	// draws the "ruler" and dims everything that is not a hand-me-down.
	let { data, flagship = null } = $props();

	const margin = { top: 10, right: 16, bottom: 42, left: 56 };
	const width = 400;
	const height = 380;

	// Fixed domains so nothing rescales while brushing.
	const x = d3.scaleLinear().domain([0, INTEL_MAX]).range([0, width]);
	const y = d3.scaleLog().domain([0.05, 60]).range([height, 0]).clamp(true);

	function cls(d) {
		if (!flagship) return 'dot';
		return isHandMeDown(d, flagship) ? 'dot hit' : 'dot dim';
	}
	const order = $derived(
		flagship ? [...data].sort((a, b) => (cls(a) === 'dot hit') - (cls(b) === 'dot hit')) : data
	);
	const nHits = $derived(flagship ? data.filter((d) => isHandMeDown(d, flagship)).length : 0);

	let tip = $state(null);
	let xAxisEl = $state(null), yAxisEl = $state(null), gx = $state(null), gy = $state(null);
	$effect(() => {
		if (!xAxisEl) return;
		const yt = [0.1, 1, 10];
		d3.select(xAxisEl).call(d3.axisBottom(x).ticks(6));
		d3.select(yAxisEl).call(d3.axisLeft(y).tickValues(yt).tickFormat((v) => `$${v}`));
		d3.select(gx).call(d3.axisBottom(x).ticks(6).tickSize(-height).tickFormat(''));
		d3.select(gy).call(d3.axisLeft(y).tickValues(yt).tickSize(-width).tickFormat(''));
	});
</script>

<svg viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}
	role="img" aria-label="Scatterplot of intelligence index versus blended price, one dot per model, darker blue means smarter">
	<g transform={`translate(${margin.left},${margin.top})`}>
		<g class="grid" bind:this={gx} transform={`translate(0,${height})`}></g>
		<g class="grid" bind:this={gy}></g>

		{#if flagship}
			{@const fx = x(flagship.intel)}
			{@const fy = y(flagship.blended)}
			<rect class="zone" x={fx} y={fy} width={width - fx} height={height - fy} />
			<line class="ruler" x1={fx} x2={fx} y1={0} y2={height} />
			<line class="ruler" x1={0} x2={width} y1={fy} y2={fy} />
			<text class="zone-label" x={width - 6} y={height - 8} text-anchor="end">
				cheaper &amp; at least as smart: {nHits}
			</text>
		{/if}

		{#each order as d (d.id)}
			<circle class={cls(d)} cx={x(d.intel)} cy={y(d.blended)} r="4" fill={intelColor(d.intel)}
				role="presentation"
				onpointerenter={(e) => (tip = { d, x: e.clientX, y: e.clientY })}
				onpointerleave={() => (tip = null)} />
		{/each}

		{#if flagship}
			<circle class="flag" cx={x(flagship.intel)} cy={y(flagship.blended)} r="7" />
			<text class="flag-label" x={x(flagship.intel) + 10} y={y(flagship.blended) - 8}>{flagship.name}</text>
		{/if}

		<!-- colour legend: intelligence, darker = smarter -->
		<g class="ramp" transform="translate(12,10)">
			<defs>
				<linearGradient id="intel-ramp">
					{#each [0, 0.25, 0.5, 0.75, 1] as t}
						<stop offset={t} stop-color={intelColor(t * INTEL_MAX)} />
					{/each}
				</linearGradient>
			</defs>
			<rect x="-6" y="-4" width="132" height="36" rx="4" class="ramp-bg" />
			<text class="ramp-title" x="0" y="8">colour = intelligence</text>
			<rect x="0" y="13" width="120" height="8" rx="2" fill="url(#intel-ramp)" />
			<text class="ramp-tick" x="0" y="30">0</text>
			<text class="ramp-tick" x="120" y="30" text-anchor="end">{INTEL_MAX}</text>
		</g>

		<g bind:this={xAxisEl} transform={`translate(0,${height})`}></g>
		<g bind:this={yAxisEl}></g>
		<text class="axis-label" x={width / 2} y={height + 36} text-anchor="middle">intelligence index →</text>
		<text class="axis-label" transform="rotate(-90)" x={-height / 2} y={-44} text-anchor="middle">blended price per 1M tokens (log)</text>
	</g>
</svg>

{#if tip}
	<div class="tip" style={`left:${tip.x + 12}px; top:${tip.y + 12}px`}>
		<b>{tip.d.name}</b><br />
		<span>{tip.d.provider} · {tip.d.release}</span><br />
		intelligence {tip.d.intel.toFixed(1)} · {fmtUSD(tip.d.blended)} / 1M
	</div>
{/if}

<style>
	.dot { fill-opacity: 0.85; stroke: var(--surface); stroke-width: 0.6; }
	.dot:hover { stroke: var(--ink); stroke-width: 1.5; }
	.dot.dim { fill: var(--dim); fill-opacity: 0.25; }
	.dot.hit { fill-opacity: 1; stroke: var(--surface); stroke-width: 1; }
	.flag { fill: var(--flag); stroke: var(--surface); stroke-width: 2; pointer-events: none; }
	.flag-label { font-size: 12px; font-weight: 600; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 3; }
	.zone { fill: rgb(42 120 214 / 0.07); }
	.ruler { stroke: var(--flag); stroke-width: 1.5; stroke-dasharray: 4 3; }
	.ramp-bg { fill: var(--surface); fill-opacity: 0.9; stroke: var(--grid); }
	.ramp-title { font-size: 10px; font-weight: 600; fill: var(--ink-2); }
	.ramp-tick { font-size: 9px; fill: var(--muted); }
	.zone-label { font-size: 12px; fill: var(--accent); font-weight: 600; }
</style>
