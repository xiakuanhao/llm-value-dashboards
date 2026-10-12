// Static build of one page (PAGE = index | p1 | p2) into dist-standalone/<PAGE>/,
// with every asset inlined so scripts/inline.py can fold it into one HTML file.
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const page = process.env.PAGE ?? 'p1';

export default defineConfig({
	root: 'standalone',
	base: './',
	plugins: [svelte({ compilerOptions: { runes: true } })],
	build: {
		outDir: `../dist-standalone/${page}`,
		emptyOutDir: true,
		assetsInlineLimit: 1e8,
		cssCodeSplit: false,
		modulePreload: false,
		rolldownOptions: { input: `standalone/${page}.html`, output: { codeSplitting: false } }
	}
});
