<script>
  import CardLogo from './card-logo.svelte';
  export let title = 'Default card title !';
  export let description = 'Lorem ipson dolerem sit amet';
  export let svg = ``;


</script>

<article class="card inline-flex flex-col flex-wrap w-1/6">
  <CardLogo
    svg={svg}
    width="100px"
    height="100px"
  />
  <h2 class="title">
    {title}
  </h2>
  <div class="description">
    {description}
  </div>
</article>

<style>
  .card {
    margin: 1rem 0;
    padding: 2rem;
    background: #000;
    color: #fff;
    border-radius: 8px;
  }

  .title {
    margin-bottom: 2rem;
  }

  .description {
    font-size: 12px;
  }
</style>