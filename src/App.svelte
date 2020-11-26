<script>
	import Header from './components/header/header.svelte';

	import Looping from './exercises/looping-a-triangle.svelte';
	import FizzBuzz from './exercises/fizz-buzz.svelte';
	import Chessboard from './exercises/chessboard.svelte';
	import Minimum from './exercises/minimum.svelte';
	import IsEven from './exercises/isEven.svelte';
	import BeanCounting from './exercises/beanCounting.svelte';

	import Logo from './static/svg/svelte-logo.svg';

	import Card from './components/card/card.svelte';
	export let name;
</script>

<Header />

<main>
	<h1>Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>

	<p>
		A small svelte app for exercises and learning
	</p>

	<Card
		title="This is a card with customizable output"
		description="This one will be customizable and will have a route attached or be a simple modal"
	/>

	<!-- <Looping />
	<FizzBuzz />
	<Chessboard />
	<Minimum />
	<IsEven />
	<BeanCounting /> -->

	
</main>

<style>
	main {
		height: 100%;
		padding: 1em;
		margin: 0 auto;
		text-align: center;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
</style>