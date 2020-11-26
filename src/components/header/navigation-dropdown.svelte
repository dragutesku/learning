<script>
  import Toggler from '../buttons/toggler.svelte';
  import { clickOutside } from '../../helpers/clickOutside.js';

  let show = false;

  // Toggler custom styles
  export let background = '';
  export let color = '';
  export let padding = '';
  export let fontSize = '';
  export let title = 'Dropdown';
  
  // handles outside clicks
  const handleClickOutside = () => show = false;
  
</script>

<div 
  class="dropdown" 
  use:clickOutside on:click_outside={handleClickOutside}
> 
  <Toggler 
    on:toggle={ () => show = !show }
    title={title}
    padding={padding}
    background={background}
    color={color}
    fontSize={fontSize}
  />

  {#if show}
    <ul class="dropdown__container">
      <li class="dropdown__item">Test content</li>
      <li class="dropdown__item">Test content</li>
      <li class="dropdown__item">Test content</li>
      <li class="dropdown__item">Test content</li>
      <li class="dropdown__item">Test content</li>
    </ul>
  {/if}
</div>

<style lang="scss">
  .dropdown {
    position:relative;

    &__container {
      display: flex;
      flex-flow: column nowrap;
      width: auto;
      min-width: 12rem;
      position: absolute;
      top: 3rem;
      padding: 1rem 2rem;
      background: #000;
      color: #fff;
      box-sizing: content-box;
    }

    &__item {
      margin-bottom: .5rem;
      &:last-child { margin-bottom: 0; }
    }
  }
</style>
