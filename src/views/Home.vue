<template>
  <div class="home">
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :lg="10">
        <user-pannel></user-pannel>
      </a-col>
      <a-col :lg="7">
        <order-book-pannel></order-book-pannel>
      </a-col>
      <a-col :lg="7">
        <trade-pannel :tradeTableData="tradeTableData"></trade-pannel>
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
      tradeTableData: []
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
      const wsuri = 'wss://www.bitmex.com/realtime'
      this.websock = new WebSocket(wsuri)
      this.websock.onmessage = this.websocketonmessage
      this.websock.onopen = this.websocketonopen
      this.websock.onerror = this.websocketonerror
      this.websock.onclose = this.websocketclose
    },
    websocketonopen () { // 连接建立之后执行send方法发送数据
      console.log('bitMex ws is open!')
      this.websock.send('ping')
      // let actions = { 'test': '12345' }
      // this.websocketsend(JSON.stringify(actions))
    },
    websocketonerror () { // 连接建立失败重连
      this.initWebSocket()
    },
    websocketonmessage (e) { // 数据接收
      // const redata = JSON.parse(e.data)
      console.log(e.data)
    },
    websocketsend (Data) { // 数据发送
      this.websock.send(Data)
    },
    websocketclose (e) { // 关闭
      console.log('断开连接', e)
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
