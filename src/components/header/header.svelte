<script>
  import Logo from '../../static/svg/svelte-logo.svg';
  import Navigation from './navigation.svelte';

  // experimental container
  import Stronghold from '../grid-container.svelte';
</script>

<header class="header">
  <Stronghold
    display="grid"
    templateColumns="auto 1fr"
    alignItems="center"
    gap="4rem"
  >
    <div class="logo-wrapper" slot="content">
      <Logo width="50" height="50" />
    </div>
    <div class="nav-wrapper" slot="content">
      <Navigation />
    </div>
  </Stronghold>
</header>

<style lang="scss">
  .header {
    padding: 1rem;
  }
</style>