// Svelte Implementation
import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'Svelte'
	}
});

export default app;


// Custom JS for learning
let rootNode = document.querySelector('.root-node');

console.log(rootNode);