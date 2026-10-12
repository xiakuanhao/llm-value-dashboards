// Static build entry: mounts one page for docs/ (GitHub Pages).
import { mount } from 'svelte';
import '#lib/global.css';
import Page from '../src/routes/p2/+page.svelte';

mount(Page, { target: document.getElementById('app'), props: { root: '../' } });
