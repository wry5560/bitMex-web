<template>
  <div style="width: 100%;height: 457px;border: 1px solid #e7e7e7">
    <template>
      <a-tabs :animated="false">
        <a-tab-pane key="1" >
          <a-badge slot="tab" :count="positionC.length">
            <div >持仓仓位</div>
          </a-badge>
          <a-row style="padding: 0 16px">
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">合约</div></a-col>
            <a-col :lg="2" ><div class="title">目前仓位数量</div></a-col>
            <a-col :lg="2" class="title">价值</a-col>
            <a-col :lg="2" class="title">开仓价格</a-col>
            <a-col :lg="2" class="title">标记价格</a-col>
            <a-col :lg="2" class="title">强平价格</a-col>
            <a-col :lg="2" class="title">保证金</a-col>
            <a-col :lg="3" class="title">未实现盈亏</a-col>
            <a-col :lg="3" class="title">已实现盈亏</a-col>
            <a-col :lg="4" class="title">平仓</a-col>
          </a-row>
          <a-row style="padding: 8px 16px" v-for="(item,index) in positionC" :class="rowClass(item,index)">
            <a-col :lg="2"><div style="text-align: left;"><b>{{item.symbol}}</b></div></a-col>
            <a-col :lg="2" ><div :class="item.avgEntryPrice>=item.liquidationPrice ? 'content green':'content red'"><b>{{item.currentQty}}</b></div></a-col>
            <a-col :lg="2" class="content">{{item.homeNotional.toFixed(6).slice(0,-2)}}</a-col>
            <a-col :lg="2" class="content">{{item.avgEntryPrice.toFixed(3).slice(0,-1)}}</a-col>
            <a-col :lg="2" class="content">{{item.markPrice.toFixed(3).slice(0,-1)}}</a-col>
            <a-col :lg="2" class="content red"><b>{{item.liquidationPrice.toFixed(3).slice(0,-1)}}</b></a-col>
            <a-col :lg="2" class="content">{{(item.maintMargin/100000000).toFixed(6).slice(0,-2)}}</a-col>
            <a-col :lg="3" :class="item.unrealisedPnl>=0 ? 'content green':'content red'"><b>{{(item.unrealisedPnl/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
            <a-col :lg="3" :class="item.realisedPnl>=0 ? 'content green':'content red'"><b>{{(item.realisedPnl/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
            <a-col :lg="4" class="content">
              <a-col :lg="12"><a-button size="small">平仓</a-button></a-col>
              <a-col :lg="12"><a-input-number v-model="pcPrice" placeholder="市价平仓..." size="small"/></a-col>
            </a-col>
          </a-row>
        </a-tab-pane>
        <!--<a-tab-pane tab="已平仓仓位" key="2">正在开发中...</a-tab-pane>-->
        <a-tab-pane tab="活动委托" key="3">正在开发中...</a-tab-pane>
        <a-tab-pane tab="止损委托" key="4">正在开发中...</a-tab-pane>
        <a-tab-pane tab="已成交" key="5">正在开发中...</a-tab-pane>
        <a-tab-pane tab="委托历史" key="6">正在开发中...</a-tab-pane>
      </a-tabs>
    </template>
  </div>

</template>

<script>
export default {
  name: 'PesitionPannel',

  props:{
    position:Array
  },

  data () {
    return {
      bodyStyle: {
        height: '400px',
        padding: 0
      },
      headStyle: {
        'text-align': 'left'
      },
      pcPrice:null
    }
  },

  computed:{
    positionC(){
      const p=[]
      this.position.forEach(item=>{
        if(item.isOpen) p.push(item)
      })
      return p
    },
  },
  methods:{
    rowClass (record, index) {
      let classNames = ''
      if (index % 2 !== 1) classNames = 'even-rows '
      // if (record.side === 'Buy') {
      //   classNames = classNames + ' ' + 'buy-trade'
      // } else {
      //   classNames = classNames + ' ' + 'sell-trade'
      // }
      return classNames
    }
  }
}
</script>

<style scoped>
.title{
  text-align: right;
  font-weight: bold;
}
  .content{
    text-align: right;
  }
  .red{
    color: #ff4e45
  }
  .green{
    color: #00a02e;
  }
</style>
