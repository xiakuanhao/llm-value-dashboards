// Single-page build of Prototype 1 for sharing as one static HTML file.
import { mount } from 'svelte';
import '#lib/global.css';
import P1 from '../src/routes/p1/+page.svelte';

mount(P1, { target: document.getElementById('app'), props: { standalone: true } });
