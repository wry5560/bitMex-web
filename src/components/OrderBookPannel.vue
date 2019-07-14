<template>
  <a-card title="委托列表" :headStyle="headStyle" :bodyStyle="bodyStyle">
    <div style="height: 400px">
      <a-row style="border-top: 1px solid lightgray;border-bottom: 1px solid #ededed;background-color: #f6f6f6">
        <a-col :lg="11">
          <div style="text-align: right"><b>仓位数量</b></div>
        </a-col>
        <a-col :lg="13">
          <div style="text-align: right;margin-right: 35px"><b>委托价</b></div>
        </a-col>
      </a-row>
      <div style="height: 170px; overflow: auto">
        <a-row v-for="(item,index) in sellOrder" :key="item.id" class="sell-trade" :class="rowClass(item,index)">
          <div v-if="index > sellOrder.length - 9">
            <a-col :lg="11"><div style="text-align: right">{{item.size}}</div></a-col>
            <a-col :lg="13"><div style="text-align: right;margin-right: 20px">{{item.price}}</div></a-col>
          </div>
        </a-row>
      </div>
      <div style="font-size: 18px;line-height: 38px;border-top: 1px solid lightgray;border-bottom: 1px solid lightgray;" >
        <span style="display: inline-block;width:40%;text-align: right;">最新成交价: </span>
        <span :class="priceClass" style="display: inline-block;width:60%;text-align: center;">
          <span style="width: 60%;margin-right: 12px">{{price }}</span>
          <a-icon v-if="side=='Buy'" type="caret-up" />
          <a-icon v-if="side=='Sell'" type="caret-down" />
        </span>
      </div>
      <div style="height: 170px; overflow: auto">
        <a-row v-for="(item,index) in buyOrder" :key="item.id" class="buy-trade" :class="rowClass(item,index)">
          <div v-if="index < 8">
            <a-col :lg="11"><div style="text-align: right">{{item.size}}</div></a-col>
            <a-col :lg="13"><div style="text-align: right;margin-right: 20px">{{item.price}}</div></a-col>
          </div>
        </a-row>
      </div>
<!--      <div >-->
<!--        <a-row>-->
<!--          <a-col :lg="11">-->
<!--          </a-col>-->
<!--          <a-col :lg="13">-->
<!--            <a-row style="border-top: 1px solid lightgray;border-bottom: 1px solid #ededed;background-color: #f6f6f6">-->
<!--              <a-col :lg="11"><div style="text-align: right"><b>委托价(卖)</b></div></a-col>-->
<!--              <a-col :lg="13"><div style="text-align: right;margin-right: 20px"><b>仓位数量</b></div></a-col>-->
<!--            </a-row>-->
<!--            -->
<!--          </a-col>-->
<!--        </a-row>-->
<!--      </div>-->
    </div>
  </a-card>
</template>

<script>
export default {
  name: 'OrderBookPannel',
  props: {
    price: Number,
    side: String,
    sellOrder: Array,
    buyOrder: Array
  },
  data () {
    return {
      bodyStyle: {
        height: '400px',
        padding: 0
      },
      headStyle: {
        'text-align': 'left'
      }
    }
  },
  computed: {
    priceClass () {
      switch (this.side) {
        case 'Buy':
          return 'buy-trade'
        case 'Sell':
          return 'sell-trade'
        default:
          return ''
      }
    }
  },
  methods: {
    rowClass (record, index) {
      let classNames = ''
      if (index % 2 === 1) classNames = 'even-rows '
      return classNames
    }
  }
}
</script>

<style scoped>

</style>
