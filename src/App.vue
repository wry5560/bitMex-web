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
  .ant-badge-count{
    height: 14px !important;
    line-height: 14px !important;
    top:-8px !important;
    right:-5px !important;
  }
  /*滚动条 start*/
  ::-webkit-scrollbar {
    width: 4px;
    height: 6px;
    background-color: #F5F5F5;
  }
  /*定义滚动条轨道 内阴影+圆角*/
  ::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 4px rgba(0,0,0,.3);
    background: #fff ;
  }
  /*定义滑块 内阴影+圆角*/
  ::-webkit-scrollbar-thumb {
    border-radius: 3px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color:rgba(0,0,0,.1);
  }
  ::-webkit-scrollbar-thumb:hover {
    border-radius: 3px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.21);
    background-color:rgba(0,0,0,.1);
  }
</style>
