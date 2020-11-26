<script>
  import Icon from '../css-icons/icon.svelte';
  
  export let customClass = '';
  let isToggled = false;
</script>


<button 
  class="button {customClass}"
>
  <span>Dropdown</span>
  <Icon 
    iClass="gg-arrows-scroll-v gg-arrows-scroll-down"
    size=".7rem"
    color="#000"
  />
</button>


<style lang="scss">

</style>