// Builds standalone/index.html (Prototype 1 only) into dist-standalone/, with
// every asset inlined so scripts/inline.py can fold it into one HTML file.
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	root: 'standalone',
	base: './',
	plugins: [svelte({ compilerOptions: { runes: true } })],
	build: {
		outDir: '../dist-standalone',
		emptyOutDir: true,
		assetsInlineLimit: 1e8,
		cssCodeSplit: false,
		modulePreload: false,
		rolldownOptions: { output: { codeSplitting: false } }
	}
});
