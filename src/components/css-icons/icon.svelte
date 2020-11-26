<script>
  export let iClass = "gg-arrows-scroll-v";
  export let size = '.6rem';
  export let color = '#000';

  $: document.documentElement.style.setProperty('--size', size);
  $: document.documentElement.style.setProperty('--color', color);
</script>


<i class={iClass}></i>



<style>
  .gg-arrows-scroll-v {
    box-sizing: border-box;
    position: relative;
    display: block;
    transform: scale(var(--ggs, 1));
    width: var(--size);
    height: var(--size);
  }

  .gg-arrows-scroll-v::after, 
  .gg-arrows-scroll-v::before {
    content: "";
    display: block;
    box-sizing: border-box;
    position: absolute;
    width: var(--size);
    height: var(--size);
    transform: rotate(-45deg);
    color: var(--color);
  }
  .gg-arrows-scroll-v.gg-arrows-scroll-up::before {
    border-top: 2px solid;
    border-right: 2px solid;
    bottom: 0;
  }
  .gg-arrows-scroll-v.gg-arrows-scroll-up:after { content: none; }


  .gg-arrows-scroll-v.gg-arrows-scroll-down::after {
      border-bottom: 2px solid;
      border-left: 2px solid;
    }

  .gg-arrows-scroll-v.gg-arrows-scroll-down:before { content: none; }
</style>
