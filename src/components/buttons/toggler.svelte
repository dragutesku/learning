<script>
  import { createEventDispatcher } from 'svelte';
  import Icon from '../css-icons/icon.svelte';
  
  const dispatch = createEventDispatcher();

  // when the handler is triggered in on:click
  // can subscribe to the on:close message in our App.svelte
  // and do what's needed
  const toggleHandler = () => dispatch('toggle');

  export let customClass = '';
  export let title = 'button';

  export let padding = '';
  export let background = '';
  export let color = '';
  export let fontSize = '';

  $: {
    document.documentElement.style.setProperty('--padding', padding);
    document.documentElement.style.setProperty('--background', background);
    document.documentElement.style.setProperty('--color', color);
    document.documentElement.style.setProperty('--fontSize', fontSize);
  }
</script>


<button 
  class="button {customClass}"
  on:click={toggleHandler}
>
  <span>{title}</span>
  <Icon 
    iClass="gg-arrows-scroll-v gg-arrows-scroll-down"
    size=".7rem"
    color="#000"
  />
</button>


<style lang="scss">
  .button {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    padding: var(--padding);
    background: var(--background);
    color: var(--color);
    font-size: var(--fontSize);
    outline: none;
    span { margin-right: .5rem; }
  }
</style>