<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style lang="scss">
  body{
    padding:12px
    /*height: 100%;*/
  }
/*#app {*/
  /*font-family: 'Avenir', Helvetica, Arial, sans-serif;*/
  /*-webkit-font-smoothing: antialiased;*/
  /*-moz-osx-font-smoothing: grayscale;*/
  /*text-align: center;*/
  /*color: #2c3e50;*/
/*}*/
  .even-rows{
    background-color: #f4f4f4;
    .ant-progress-inner {
      background: #ececec;
    }
  }
  .ant-table-small > .ant-table-content > .ant-table-body{
    margin: 0 !important;
  }
  .buy-trade{
    color: #006a00;
  }
  .sell-trade{
    color: #af0e00;
  }
</style>
