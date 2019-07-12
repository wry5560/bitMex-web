<template>
  <div class="home">
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :lg="10">
        <user-pannel></user-pannel>
      </a-col>
      <a-col :lg="7">
        <order-book-pannel :price="orderBookProps.price" :side="orderBookProps.side" :sellOrder="wsDatas.orders.sell" :buyOrder="wsDatas.orders.buy"/>
      </a-col>
      <a-col :lg="7">
        <trade-pannel :tradeTableData="wsDatas.trade"/>
      </a-col>
    </a-row>
    <a-row :gutter="16">
      <a-col :lg="17">
        <pesition-pannel></pesition-pannel>
      </a-col>
      <a-col :lg="7">
        <celve-pannel></celve-pannel>
      </a-col>
    </a-row>
  </div>
</template>

<script>
// @ is an alias to /src
import UserPannel from '@/components/UserPannel.vue'
import OrderBookPannel from '@/components/OrderBookPannel.vue'
import TradePannel from '@/components/TradePannel.vue'
import CelvePannel from '@/components/CelvePannel.vue'
import PesitionPannel from '@/components/PesitionPannel.vue'

export default {
  name: 'home',
  components: {
    UserPannel,
    OrderBookPannel,
    TradePannel,
    PesitionPannel,
    CelvePannel
  },
  data () {
    return {
      websock: null,
      setIntervalPingPong: null,
      setTimeoutReset: null,
      lockReconnect: false,
      wsDatas: {
        trade: [],
        orders: {
          cache: [],
          locked: false,
          sell: [],
          buy: []
        }
      }
    }
  },
  computed: {
    orderBookProps () {
      return this.wsDatas.trade[0]
        ? { price: this.wsDatas.trade[0].price, side: this.wsDatas.trade[0].side }
        : { price: 0, side: '' }
    }
  },
  created () {
    this.initWebSocket()
  },
  destroyed () {
    this.websock.close() // 离开路由之后断开websocket连接
  },
  methods: {
    initWebSocket () { // 初始化weosocket
      if (!this.websock) {
        console.log('建立websocket连接')
        const wsuri = 'wss://www.bitmex.com/realtime'
        this.websock = new WebSocket(wsuri)
        this.websock.onmessage = this.websocketonmessage
        this.websock.onopen = this.websocketonopen
        this.websock.onerror = this.websocketonerror
        this.websock.onclose = this.websocketclose
      } else {
        console.log('websocket已存在')
      }
    },
    websocketonopen () { // 连接建立之后执行send方法发送数据
      console.log('websocket已连接')
      const op = { 'op': 'subscribe',
        'args': ['orderBookL2_25:XBTUSD'
        // 'trade:XBTUSD'
        ] }
      this.websock.send(JSON.stringify(op))
      this.setIntervalWs()
      // let actions = { 'test': '12345' }
      // this.websocketsend(JSON.stringify(actions))
    },
    websocketonerror (e) { // 连接建立失败重连
      clearInterval(this.setIntervalPingPong)
      console.log('链接错误:', e)
      this.websock.close()
      this.websock = null
      this.reconnect()
    },
    websocketonmessage (e) { // 数据接收
      // const redata = JSON.parse(e.data)
      clearInterval(this.setIntervalPingPong)
      clearTimeout(this.setTimeoutReset)
      this.dataParser(e.data)
      this.setIntervalWs()
      // console.log(e)
      // console.log(e.data)
    },
    websocketsend (Data) { // 数据发送
      if (this.websock !== null && this.websock.readyState === 3) {
        clearInterval(this.setIntervalPingPong)
        this.websock.close()
        this.websock = null
        this.reconnect() // 重连
      } else if (this.websock.readyState === 1) {
        this.websock.send(Data)
      } else if (this.websock.readyState === 0) {
        setTimeout(() => {
          this.websocketsend(Data)
        }, 3000)
      }
      this.websock.send(Data)
    },
    websocketclose (e) { // 关闭
      console.log('断开连接', e)
    },
    setIntervalWs () {
      const _this = this
      this.setIntervalPingPong = setInterval(() => {
        _this.websock.send('ping')
        _this.setTimeoutReset = setTimeout(() => {
          clearInterval(_this.setIntervalPingPong)
          _this.websock.close()
          _this.websock = null
          _this.reconnect()
        }, 5000)
      }, 5000)
    },
    reconnect () {
      const _this = this
      if (this.lockReconnect) return
      this.lockReconnect = true
      setTimeout(function () { // 没连接上会一直重连，设置延迟避免请求过多
        _this.initWebSocket()
        _this.lockReconnect = false
      }, 2000)
    },

    dataParser (d) {
      // console.log('dataParser')
      if (d === 'pong') {
        console.log('pong')
        return
      }
      const data = JSON.parse(d)
      if (!data.table) {
        console.log(data)
        return
      }
      switch (data.table) {
        case 'trade':
          if (data.action === 'partial') {
            for (let i = 0; i < data.data.length; i++) {
              // data.data[i].key = data.data.trdMatchID
              const date = new Date(data.data[i].timestamp)
              data.data[i].time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
            }
            this.wsDatas.trade = data.data
          } else if (data.action === 'insert') {
            for (let i = 0; i < data.data.length; i++) {
              // data.data[i].key = data.data.trdMatchID
              const date = new Date(data.data[i].timestamp)
              data.data[i].time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
              this.wsDatas.trade.unshift(data.data[i])
            }
            if (this.wsDatas.trade.length > 60) this.wsDatas.trade = this.wsDatas.trade.slice(0, 59)
          }
          // console.log(data.action + ' : ', data.data)
          break
        case 'orderBookL2_25':
          // debugger
          this.wsDatas.orders.cache = this.wsDatas.orders.cache.concat(data)
          if (this.wsDatas.orders.locked) return
          this.wsDatas.orders.locked = true
          this.wsDatas.orders.cache.forEach(data => {
            switch (data.action) {
              case 'partial':
                const buyOrders = []
                const sellOrders = []
                for (let i = 0; i < data.data.length; i++) {
                  if (data.data[i].side === 'Sell') sellOrders.push(data.data[i])
                  if (data.data[i].side === 'Buy') buyOrders.push(data.data[i])
                }
                this.wsDatas.orders.buy = buyOrders
                this.wsDatas.orders.sell = sellOrders
                break
              case 'update':
                for (let i = 0; i < data.data.length; i++) {
                  let toUpdateData = null
                  if (data.data[i].side === 'Sell') {
                    toUpdateData = this.wsDatas.orders.sell.find(item => item.id === data.data[i].id)
                  } else if (data.data[i].side === 'Buy') {
                    toUpdateData = this.wsDatas.orders.buy.find(item => item.id === data.data[i].id)
                  }
                  if (toUpdateData) {
                    toUpdateData.size = data.data[i].size
                    console.log('update:', toUpdateData.price)
                  } else {
                    console.log('update: cannot find data! insert it!')
                    // if (data.data[i].side === 'Sell') {
                    //   for (let j = 0; j < this.wsDatas.orders.sell.length; j++) {
                    //     if (j === this.wsDatas.orders.sell.length) this.wsDatas.orders.sell.push(data.data[i])
                    //     // debugger
                    //     if (this.wsDatas.orders.sell[j].price < data.data[i].price) {
                    //       // debugger
                    //       console.log('insert:', data.data[i])
                    //       this.wsDatas.orders.sell.splice(j, 0, data.data[i])
                    //       break
                    //     }
                    //   }
                    // } else if (data.data[i].side === 'Buy') {
                    //   for (let j = 0; j < this.wsDatas.orders.buy.length; j++) {
                    //     if (j === this.wsDatas.orders.buy.length) this.wsDatas.orders.buy.push(data.data[i])
                    //     if (this.wsDatas.orders.buy[j].price < data.data[i].price) {
                    //       console.log('splice:', data.data[i])
                    //       this.wsDatas.orders.buy.splice(j, 0, data.data[i])
                    //       break
                    //     }
                    //   }
                    // }
                  }
                }
                break
              case 'insert':
                for (let i = 0; i < data.data.length; i++) {
                  if (data.data[i].side === 'Sell') {
                    debugger
                    const index = this.wsDatas.orders.sell.findIndex(item => item.id === data.data[i].id)
                    if (index === -1) {
                      debugger
                      for (let j = 0; j < this.wsDatas.orders.sell.length; j++) {
                        debugger
                        if (j === this.wsDatas.orders.sell.length) {
                          this.wsDatas.orders.sell.push(data.data[i])
                          break
                        }
                        if (this.wsDatas.orders.sell[j].price > data.data[i].price) {
                          // debugger
                          console.log('insert:', data.data[i])
                          this.wsDatas.orders.sell.splice(j, 0, data.data[i])
                        }
                      }
                    }
                  } else if (data.data[i].side === 'Buy') {
                    debugger
                    const index = this.wsDatas.orders.buy.findIndex(item => item.id === data.data[i].id)
                    if (index === -1) {
                      debugger
                      for (let j = 0; j < this.wsDatas.orders.buy.length; j++) {
                        debugger
                        if (j === this.wsDatas.orders.sell.length) {
                          this.wsDatas.orders.sell.push(data.data[i])
                          break
                        }
                        if (this.wsDatas.orders.buy[j].price < data.data[i].price) {
                          console.log('insert:', data.data[i])
                          this.wsDatas.orders.buy.splice(j, 0, data.data[i])
                        }
                      }
                    }
                  }
                }
                // this.wsDatas.orders.locked = false
                break
              case 'delete':
                for (let i = 0; i < data.data.length; i++) {
                  let toDelDataIndex = null
                  if (data.data[i].side === 'Sell') {
                    toDelDataIndex = this.wsDatas.orders.sell.findIndex(item => item.id === data.data[i].id)
                    if (toDelDataIndex > -1) {
                      this.wsDatas.orders.sell.splice(toDelDataIndex, 1)
                      console.log('delete:', data.data[i].id)
                    } else {
                      console.log('delete: cannot find data!')
                    }
                    continue
                  } else if (data.data[i].side === 'Buy') {
                    toDelDataIndex = this.wsDatas.orders.buy.findIndex(item => item.id === data.data[i].id)
                    if (toDelDataIndex > -1) {
                      this.wsDatas.orders.buy.splice(toDelDataIndex, 1)
                      console.log('delete:', data.data[i].id)
                    } else {
                      console.log('delete: cannot find data!')
                    }
                    continue
                  }
                }
                // this.wsDatas.orders.locked = false
                break
              default:
                console.log(data.table + ' : ' + data.action + ' : ', data.data)
            }
          })
          this.wsDatas.orders.cache = []
          this.wsDatas.orders.locked = false
          break
      }
    }
  }
}
</script>

<style lang="scss">
  .home{

    /*margin: 12px;*/
    /*height: 100%;*/
  }
</style>
