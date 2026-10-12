import * as d3 from 'd3';
import raw from './llm_models.json';

const parseDate = d3.timeParse('%Y-%m-%d');

// src/lib/llm_models.json is exported from llm-sketchbook/lib/data.js
// (453 endpoints, 2023-2026). It is bundled, not fetched, so the standalone
// build works from any URL. Dates arrive as strings; parse them here.
export async function loadLLM() {
	const models = raw.models.map((d) => ({ ...d, date: parseDate(d.release) }));
	const byId = new Map(models.map((d) => [d.id, d]));
	const reigns = raw.reigns.map((r) => ({
		...r,
		date: parseDate(r.release),
		capEnd: r.cap_end ? parseDate(r.cap_end) : null
	}));
	return { source: raw.source, models, byId, reigns };
}

// "Hand-me-down" rule shared by every view in Prototype 1: a model released
// AFTER the flagship that scores at least as high and costs less.
export function isHandMeDown(m, flagship) {
	return (
		m.id !== flagship.id &&
		m.date > flagship.date &&
		m.intel >= flagship.intel &&
		m.blended < flagship.blended
	);
}

// Monthly bill in USD. Prices are per 1M tokens; usage is split 80% input,
// 20% output (the same 4:1 split as the sketchbook's scenarios).
export function monthlyCost(m, tokensPerMonth) {
	const tin = tokensPerMonth * 0.8;
	const tout = tokensPerMonth * 0.2;
	return (tin * m.cin + tout * m.cout) / 1e6;
}

export const fmtUSD = (v) =>
	v >= 1000 ? `$${d3.format(',.0f')(v)}` : v >= 10 ? `$${v.toFixed(0)}` : `$${v.toFixed(2)}`;
export const fmtTokens = (v) => d3.format('.2~s')(v).replace('G', 'B');

// Ordinal blue ramp for release-year cohorts (lightest step >= 2:1 on surface).
export const YEARS = [2023, 2024, 2025, 2026];
// Sequential blue for intelligence: darker = smarter. Starts at step 250 so
// the lightest dot still clears 2:1 on the surface.
export const INTEL_MAX = 56;
export const intelColor = d3
	.scaleSequential(d3.interpolateLab('#86b6ef', '#0d366b'))
	.domain([0, INTEL_MAX]);

export const yearColor = d3.scaleOrdinal(YEARS, ['#86b6ef', '#3987e5', '#1c5cab', '#0d366b']);
