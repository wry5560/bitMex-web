<template>
  <div style="width: 100%;height: 457px;border: 1px solid #e7e7e7">
    <template>
      <a-tabs :animated="false">
        <a-tab-pane key="1" >
          <a-badge slot="tab" :count="positionLength">
            <div >持仓仓位</div>
          </a-badge>
          <a-row style="padding: 0 16px">
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">合约</div></a-col>
            <a-col :lg="3" ><div class="title">目前仓位数量</div></a-col>
            <a-col :lg="2" class="title">价值(XBT)</a-col>
            <a-col :lg="2" class="title">开仓价格</a-col>
            <a-col :lg="2" class="title">标记价格</a-col>
            <a-col :lg="3" class="title">强平价格</a-col>
            <a-col :lg="2" class="title">保证金</a-col>
            <a-col :lg="4" class="title">未实现盈亏</a-col>
            <a-col :lg="4" class="title">已实现盈亏</a-col>
            <!--<a-col :lg="4" class="title">平仓</a-col>-->
          </a-row>
          <div style="height: 375px;overflow: auto">
            <a-row style="padding: 8px 16px" v-for="(item,index) in positionC" :key="item.symbol" :class="rowClass(item,index)">
              <a-col :lg="2"><div style="text-align: left;"><b>{{item.symbol}}</b></div></a-col>
              <a-col :lg="3" ><div :class="item.avgEntryPrice>=item.liquidationPrice ? 'content green':'content red'"><b>{{item.currentQty}}</b></div></a-col>
              <a-col :lg="2" class="content">{{item.homeNotional.toFixed(6).slice(0,-2)}}</a-col>
              <a-col :lg="2" class="content">{{item.avgEntryPrice.toFixed(3).slice(0,-1)}}</a-col>
              <a-col :lg="2" class="content">{{item.markPrice.toFixed(3).slice(0,-1)}}</a-col>
              <a-col :lg="3" class="content red"><b>{{item.liquidationPrice.toFixed(3).slice(0,-1)}}</b></a-col>
              <a-col :lg="2" class="content">{{(item.maintMargin/100000000).toFixed(6).slice(0,-2)}}</a-col>
              <a-col :lg="4" :class="item.unrealisedPnl>=0 ? 'content green':'content red'"><b>{{(item.unrealisedPnl/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
              <a-col :lg="4" :class="item.realisedPnl>=0 ? 'content green':'content red'"><b>{{(item.realisedPnl/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
              <!--<a-col :lg="4" class="content">-->
                <!--<a-col :lg="12"><a-button size="small"  @click="emitPc(item.symbol,pcPrice[index])">平仓</a-button></a-col>-->
                <!--<a-col :lg="12"><a-input-number v-model="pcPrice[index]" placeholder="市价平仓..." size="small"/></a-col>-->
              <!--</a-col>-->
            </a-row>
          </div>
        </a-tab-pane>
        <!--<a-tab-pane tab="已平仓仓位" key="2">正在开发中...</a-tab-pane>-->
        <a-tab-pane  key="3">
          <a-badge slot="tab" :count="orderLength">
            <div >活动委托</div>
          </a-badge>
          <a-row style="padding: 0 16px">
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">合约</div></a-col>
            <a-col :lg="2" ><div class="title">数量</div></a-col>
            <a-col :lg="2" class="title">委托价格</a-col>
            <a-col :lg="2" class="title">完全成交</a-col>
            <a-col :lg="2" class="title">剩余</a-col>
            <a-col :lg="4" class="title">委托价值(XBT)</a-col>
<!--            <a-col :lg="3" class="title">成交价格</a-col>-->
            <a-col :lg="2" class="title">类型</a-col>
            <a-col :lg="2" class="title">状态</a-col>
            <a-col :lg="4" class="title">时间</a-col>
            <a-col :lg="2" class="title"></a-col>
          </a-row>
          <div style="height: 375px;overflow: auto">
          <a-row style="padding: 8px 16px" class="even-rows ">
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">概况</div></a-col>
            <a-col :lg="2" ><div class="title">---</div></a-col>
            <a-col :lg="2" class="title">---</a-col>
            <a-col :lg="2" class="title">---</a-col>
            <a-col :lg="2" class="title">---</a-col>
            <a-col :lg="3" class="title">{{totalValue}}</a-col>
<!--            <a-col :lg="3" class="title">-&#45;&#45;</a-col>-->
            <a-col :lg="2" class="title">---</a-col>
            <a-col :lg="2" class="title">---</a-col>
            <a-col :lg="4" class="title">---</a-col>
            <a-col :lg="2" class="title"><a-button size="small" @click="cancelPostion('all')">取消所有</a-button></a-col>
          </a-row>
          <a-row style="padding: 8px 16px" v-for="(item,index) in orderC" :key="item.orderID" :class="rowClass(item,index+1)" >
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">{{item.symbol}}</div></a-col>
            <a-col :lg="2" ><div :class="item.side =='Buy' ? 'content green':'content red'"><b>{{item.orderQty}}</b></div></a-col>
            <a-col :lg="2" class="content">{{item.price}}</a-col>
            <a-col :lg="2" :class="item.side =='Buy' ? 'content green':'content red'"><b>{{item.cumQty}}</b></a-col>
            <a-col :lg="2" class="content">{{item.leavesQty}}</a-col>
            <a-col :lg="4" class="content">{{(item.symbol==='XBTUSD' ? item.orderQty/item.price : item.orderQty* item.price).toFixed(6).slice(0,-2)}}</a-col>
<!--            <a-col :lg="3" class="content">-&#45;&#45;</a-col>-->
            <a-col :lg="2" class="content">{{item.ordType}}</a-col>
            <a-col :lg="2" class="content">{{item.ordStatus}}</a-col>
            <a-col :lg="4" class="content">{{moment(item.transactTime).format('YYYY-MM-DD HH:mm:ss')}}</a-col>
            <a-col :lg="2" class="content"><a-button size="small" @click="cancelPostion(item.orderID)">取消</a-button></a-col>
          </a-row>
          </div>
        </a-tab-pane>
<!--        <a-tab-pane tab="止损委托" key="4">正在开发中...</a-tab-pane>-->
        <a-tab-pane tab="已成交" key="5">
          <a-row style="padding: 0 16px">
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">合约</div></a-col>
            <a-col :lg="2" ><div class="title">数量</div></a-col>
            <a-col :lg="2" class="title">成交数量</a-col>
            <a-col :lg="2" class="title">剩余</a-col>
            <a-col :lg="3" class="title">成交价格</a-col>
            <a-col :lg="3" class="title">委托价格</a-col>
            <a-col :lg="2" class="title">价值(XBT)</a-col>
            <!--            <a-col :lg="3" class="title">成交价格</a-col>-->
            <a-col :lg="2" class="title">类型</a-col>
            <a-col :lg="2" class="title">委托ID</a-col>
            <a-col :lg="4" class="title">时间</a-col>
          </a-row>
          <div style="height: 375px;overflow: auto">
          <a-row style="padding: 0 16px" v-for="(item,index) in executionC" :key="item.execID" :class="rowClass(item,index)">
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">{{item.symbol}}</div></a-col>
            <a-col :lg="2" ><div :class="item.side =='Buy' ? 'content green':'content red'"><b>{{item.orderQty}}</b></div></a-col>
            <a-col :lg="2"  :class="item.side =='Buy' ? 'content green':'content red'"><b>{{item.lastQty}}</b></a-col>
            <a-col :lg="2" class="content">{{item.leavesQty}}</a-col>
            <a-col :lg="3" class="content">{{item.lastPx ? item.lastPx:'--'}}</a-col>
            <a-col :lg="3" class="content">{{item.price}}</a-col>
            <a-col :lg="2" class="content">{{(item.symbol==='XBTUSD' ? item.orderQty/item.price : item.orderQty* item.price).toFixed(6).slice(0,-2)}}</a-col>
            <!--            <a-col :lg="3" class="title">成交价格</a-col>-->
            <a-col :lg="2" class="content">{{item.ordType}}</a-col>
            <a-col :lg="2" class="content">{{item.orderID.slice(0,5)}}</a-col>
            <a-col :lg="4" class="content">{{moment(item.transactTime).format('YYYY-MM-DD HH:mm:ss')}}</a-col>
          </a-row>
          </div>
        </a-tab-pane>
        <a-tab-pane tab="委托历史" key="6">
          <a-row style="padding: 0 16px">
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">合约</div></a-col>
            <a-col :lg="2" ><div class="title">数量</div></a-col>
            <a-col :lg="4" class="title">委托价格</a-col>
            <a-col :lg="3" class="title">完全成交</a-col>
<!--            <a-col :lg="2" class="title">剩余</a-col>-->
            <a-col :lg="4" class="title">成交价格</a-col>
            <!--            <a-col :lg="3" class="title">成交价格</a-col>-->
            <a-col :lg="2" class="title">类型</a-col>
            <a-col :lg="3" class="title">状态</a-col>
            <a-col :lg="4" class="title">时间</a-col>
          </a-row>
          <div style="height: 375px;overflow: auto">
          <a-row style="padding: 0 16px" v-for="(item,index) in orderHistory" :key="item.orderID+item.timestamp" :class="rowClass(item,index)">
            <a-col :lg="2"><div style="text-align: left;font-weight: bold;">{{item.symbol}}</div></a-col>
            <a-col :lg="2" ><div :class="item.side =='Buy' ? 'content green':'content red'"><b>{{item.orderQty}}</b></div></a-col>
            <a-col :lg="4" class="content">{{item.price}}</a-col>
            <a-col :lg="3" :class="item.side =='Buy' ? 'content green':'content red'"><b>{{item.cumQty}}</b></a-col>
            <!--            <a-col :lg="2" class="title">剩余</a-col>-->
            <a-col :lg="4" class="content">{{item.avgPx ? item.avgPx:'--'}}</a-col>
            <!--            <a-col :lg="3" class="title">成交价格</a-col>-->
            <a-col :lg="2" class="content">{{item.ordType}}</a-col>
            <a-col :lg="3" class="content">{{item.ordStatus}}</a-col>
            <a-col :lg="4" class="content">{{moment(item.transactTime).format('YYYY-MM-DD HH:mm:ss')}}</a-col>
          </a-row>
          </div>
        </a-tab-pane>
      </a-tabs>
    </template>
  </div>

</template>

<script>

  import moment from 'moment'
  import 'moment/locale/zh-cn'

export default {
  name: 'PesitionPannel',

  props:{
    position:Array,
    order:Array,
    orderHistory:Array,
    execution:Array
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
      pcPrice:[]
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
    orderC(){
      const o=[]
      this.order.forEach(item=>{
        if(item.ordStatus !=='Canceled' && item.ordStatus !=='Filled') o.unshift(item)
      })
      return o
    },
    orderLength(){
      return this.orderC.length
    },
    positionLength(){
      return this.positionC.length
    },
    totalValue(){
      let valueSum = 0
      this.orderC.forEach(item=>{
        valueSum += (item.orderQty/item.price)
      })
      return valueSum.toFixed(6).slice(0,-2)
    },
    executionC(){
      const e=[]
      this.execution.forEach(item=>{
        if(item.orderID !=='00000000-0000-0000-0000-000000000000') e.push(item)
      })
      return e
    }
  },
  methods:{
    moment,
    rowClass (record, index) {
      let classNames = ''
      if (index % 2 !== 1) classNames = 'even-rows '
      // if (record.side === 'Buy') {
      //   classNames = classNames + ' ' + 'buy-trade'
      // } else {
      //   classNames = classNames + ' ' + 'sell-trade'
      // }
      return classNames
    },
    emitPc(symbol,price){
      this.$emit('closePosition',[symbol,price])
    },
    cancelPostion(orderID){
      this.$emit('cancelPosition',orderID)
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
