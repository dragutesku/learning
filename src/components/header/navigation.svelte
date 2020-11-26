<script>
  import NavigationDropdown from './navigation-dropdown.svelte';
</script>

<nav class="navigation">
  <ul class="navigation__container">
    <li class="navigation__listItem">
      <a href="/" class="navigation__anchor">Home</a>
    </li>
    <li class="navigation__listItem navDropdown">
      <NavigationDropdown 
        title="Awesome Dropdown" 
        fontSize="1.6rem" 
      />
    </li>
    <li class="navigation__listItem">
      <a href="/" class="navigation__anchor">LINK</a>
    </li>
    <li class="navigation__listItem">
      <a href="/" class="navigation__anchor">LINK</a>
    </li>
  </ul>
</nav>

<style lang="scss">
  .navigation {

    &__container {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }

    &__listItem {
      margin-right: 1rem;
      &:last-child { margin-right: 0; }
    }

    &__anchor {
      font-size: 1.6rem;
    }
  }


  .navDropdown {
    display: flex;

    &__button {
      display: flex;
      align-items: center;
      font-size: 1.6rem;
    }

  }


</style>