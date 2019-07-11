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
      setIntervalPingPong:null,
      setTimeoutReset:null,
      lockReconnect:false,

      tradeTableData: [],
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
        console.log('websocket已连接')
      }
    },
    websocketonopen () { // 连接建立之后执行send方法发送数据
      console.log('websocket已连接')
      this.setIntervalWs()
      // let actions = { 'test': '12345' }
      // this.websocketsend(JSON.stringify(actions))
    },
    websocketonerror (e) { // 连接建立失败重连
      clearInterval(this.setIntervalPingPong)
      console.log('链接错误:'+ JSON.parse(e))
      this.websock.close()
      this.websock=null
      this.reconnect()
    },
    websocketonmessage (e) { // 数据接收
      // const redata = JSON.parse(e.data)
      clearInterval(this.setIntervalPingPong)
      clearTimeout(this.setTimeoutReset)
      this.setIntervalWs()
      console.log(JSON.parse(e.data))
    },
    websocketsend (Data) { // 数据发送
      if (this.websock !== null && this.websock.readyState === 3) {
        clearInterval(this.setIntervalPingPong)
        this.websock.close()
        this.websock=null
        this.reconnect() //重连
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
      console.log('断开连接'+JSON.parse(e))
    },
    setIntervalWs (){
      const _this=this
      this.setIntervalPingPong=setInterval(()=>{
        _this.websock.send('ping')
        _this.setTimeoutReset=setTimeout(()=>{
          clearInterval(_this.setIntervalPingPong)
          _this.websock.close()
          _this.websock=null
          _this.reconnect()
        },5000)
      },5000)
    },
    reconnect(){
      const _this=this
      if(this.lockReconnect) return
      this.lockReconnect = true
      setTimeout(function () {     //没连接上会一直重连，设置延迟避免请求过多
        _this.initWebSocket();
        _this.lockReconnect = false;
      }, 2000);
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
