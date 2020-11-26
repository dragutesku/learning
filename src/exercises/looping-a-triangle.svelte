<!--
  Looping a triangle
  Write a loop that makes seven calls to console.log to output the following triangle:
  #
  ##
  ###
  ####
  #####
  ######
  #######

  It may be useful to know that you can find the length of a string by writing .length after it.
  let abc = "abc"; console.log(abc.length); // → 3

  NOTE: Show results in the div
-->
<script>
  import Title from '../components/title.svelte';
  import Rocket from '../static/svg/rocket.svg';

  let componentTitle = 'Looping a trinagle with JS';
  let hash = '#';

  function renderSymbol(symbol) {
    let result;
    symbol = symbol;
    for (let i = 0; i < 7; i++) {
      result = i === 0 ? symbol = '#' : symbol += '#';
      console.log(result);
    }
  };
</script>

<div class="foo">
  <Rocket  width="20" />
  <Title text={componentTitle} />
  {renderSymbol(hash)}
</div>

<style>
  .foo {
    display: block;
    padding: 20px;
    background: #000;
    color: #fff;
    font-size: 16px;
  }
</style>
