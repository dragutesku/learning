<!--
* @stronghold types
* display: grid, inline-grid, flex
* 
* grid: 
* Columns, Rows
* gird-template-columns, grid-template-rows
-->


<script>
  // Display
  export let display = 'flex';

  $: document.documentElement.style.setProperty('--display', display);

  // Template
  export let templateColumns = '1fr 1fr';
  export let templateRows = 'auto';

  $: { 
    document.documentElement.style.setProperty('--template-columns', templateColumns);
    document.documentElement.style.setProperty('--template-rows', templateRows);
  }

  // Alignment
  export let alignItems = 'start';
  export let justifyItems = 'start';
  export let justifyContent = 'start';

  $: { 
    document.documentElement.style.setProperty('--align-items', alignItems);
    document.documentElement.style.setProperty('--justify-items', justifyItems);
    document.documentElement.style.setProperty('--justify-content', justifyContent);
  }

  // Gap (grid, flex)
  export let gap = '2';

  $: document.documentElement.style.setProperty('--gap', gap);
</script>


<div class="stronghold">
  <slot name="content" />
</div>

<style lang="scss">
  .stronghold {
    display: var(--display);
    grid-template-columns: var(--template-columns);
    grid-template-rows: var(--template-rows);
    place-items: var(--align-items) var(--justify-items);
    justify-content: var(--justify-content);
    gap: var(--gap);
  }
</style>