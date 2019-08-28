<template>
  <div class="home">
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :lg="12">
        <user-pannel :users="users" :marginData="userData.margin" :walletHistory="walletHistory"  @select="changeCurrentUser"></user-pannel>
      </a-col>
      <a-col :lg="5">
        <order-book-pannel :price="orderBookProps.price" :side="orderBookProps.side" :sellOrder="wsDatas.orders.sell" :buyOrder="wsDatas.orders.buy"/>
      </a-col>
      <a-col :lg="7">
        <trade-pannel :tradeTableData="wsDatas.trade"/>
      </a-col>
    </a-row>
    <a-row :gutter="16">
      <a-col :lg="17">
        <pesition-pannel :position="positionData" :order="orderData" :orderHistory="orderHistory" :execution="executionData" @closePosition="pcConfirm" @cancelPosition="cancelConfirm"></pesition-pannel>
      </a-col>
      <a-col :lg="7">
        <celve-pannel @insert="insertCelve" @stop="stopCelve" @update="updateCelve" :celves="celves" :user="currentUser"></celve-pannel>
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
import bitMexSignature from '@/lib/bitmex_signature'
import moment from 'moment'
import 'moment/locale/zh-cn'

import { reqUsers, reqTradeHistory, reqWalletHistory, reqOrders, postOrders, postLevelPriceCelve, getLevelPriceCelve, loginInfo } from '@/api'
import { settings } from '../../config/dev-setting'
const { isTest } = settings

// const isTest=false
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
      users: [],
      celves: [],
      getCelvesInterval: null,
      userData: {
        margin: {
          walletBalance: null,
          availableMargin: null,
          currency: 'XBt',
          unrealisedPnl: null,
          initMargin: null,
          maintMargin: null,
          marginBalance: null
        }
      },
      positionData: [],
      orderData: [],
      orderHistory: [],
      tradeHistory: [],
      walletHistory: [],
      executionData: [],
      currentUser: {},
      toCancelUser: {},
      wsDatas: {
        trade: [],
        orders: {
          cache: [],
          locked: false,
          sell: [],
          buy: []
        },
        wallet: []
      },
      isFirstTime: true
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
    this.getUsers()
    const _this = this
    const params = {
      userName: this.$store.state.user.userName,
      host: window.location.href,
      date: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    loginInfo(params)
    this.getCelvesInterval = setInterval(() => { _this.getCelves('running') }, 2000)
  },
  destroyed () {
    this.websock.close() // 离开路由之后断开websocket连接
    clearInterval(this.setIntervalPingPong)
    clearInterval(this.getCelvesInterval)
    clearTimeout(this.setTimeoutReset)
  },
  methods: {
    moment,
    initWebSocket () { // 初始化weosocket
      if (!this.websock) {
        console.log('建立websocket连接')
        const wsuri = isTest ? 'wss://testnet.bitmex.com/realtimemd' : 'wss://www.bitmex.com/realtimemd'
        // const wsuri = 'wss://www.bitmex.com/realtimemd'
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
      // const op = { 'op': 'subscribe', 'args': ['orderBookL2_25:XBTUSD','trade:XBTUSD'] }
      const op = [1, 'nomalInfos', 'allUsers']
      this.websock.send(JSON.stringify(op))
      const op2 = [0, 'nomalInfos', 'allUsers', { 'op': 'subscribe', 'args': ['orderBookL2_25:XBTUSD', 'trade:XBTUSD'] }]
      this.websock.send(JSON.stringify(op2))
      // this.websock.send(op)

      // console.log(typeof (op) ,op)
      this.setIntervalWs()
      if (this.currentUser.userName) {
        this.getOrders()
        this.getWalletHistory()
        this.getTradeHistory()
        this.createdUserWs()
      }
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
      // debugger
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
      // this.websock.send(Data)
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
        }, 3000)
      }, 3000)
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
      // debugger
      if (d === 'pong') {
        console.log('pong')
        return
      }
      const allData = JSON.parse(d)
      if (allData.length && allData.length > 0 && allData[1] === 'nomalInfos') {
        const data = allData[3]
        if (typeof (data.table) === 'undefined') {
          console.log(data)
          return
        }
        switch (data.table) {
          case 'trade':
            if (data.action === 'partial') {
              for (let i = 0; i < data.data.length; i++) {
                // data.data[i].key = data.data.trdMatchID
                const date = moment(data.data[i].timestamp).format('HH:mm:ss')
                data.data[i].time = date
              }
              this.wsDatas.trade = data.data
            } else if (data.action === 'insert') {
              for (let i = 0; i < data.data.length; i++) {
                // data.data[i].key = data.data.trdMatchID
                const date = moment(data.data[i].timestamp).format('HH:mm:ss')
                data.data[i].time = date
                this.wsDatas.trade.unshift(data.data[i])
              }
              if (this.wsDatas.trade.length > 60) this.wsDatas.trade = this.wsDatas.trade.slice(0, 59)
            }
            // console.log(data.action + ' : ', data.data)
            break
          case 'orderBookL2_25':
            // debugger
            // this.wsDatas.orders.cache = this.wsDatas.orders.cache.concat(data)
            // if (this.wsDatas.orders.locked) return
            // this.wsDatas.orders.locked = true
            // this.wsDatas.orders.cache.forEach(data => {
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
                    // console.log('update:', toUpdateData.price)
                  } else {
                    console.log('update: cannot find data!please insert it!')
                  }
                }
                break
              case 'insert':
                for (let i = 0; i < data.data.length; i++) {
                  if (data.data[i].side === 'Sell') {
                    // debugger
                    const index = this.wsDatas.orders.sell.findIndex(item => item.id === data.data[i].id)
                    if (index === -1) {
                      //   // debugger
                      this.wsDatas.orders.sell.push(data.data[i])
                      // console.log('insert:', data.data[i])
                      this.wsDatas.orders.sell.sort((a, b) => {
                        return b.price - a.price
                      })
                    }
                  } else if (data.data[i].side === 'Buy') {
                    // debugger
                    const index = this.wsDatas.orders.buy.findIndex(item => item.id === data.data[i].id)
                    if (index === -1) {
                      //   // debugger
                      this.wsDatas.orders.buy.push(data.data[i])
                      // console.log('insert:', data.data[i])
                      this.wsDatas.orders.buy.sort((a, b) => {
                        return b.price - a.price
                      })
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
                      // console.log('delete:', data.data[i].id)
                    } else {
                      console.log('delete: cannot find data!')
                    }
                    continue
                  } else if (data.data[i].side === 'Buy') {
                    toDelDataIndex = this.wsDatas.orders.buy.findIndex(item => item.id === data.data[i].id)
                    if (toDelDataIndex > -1) {
                      this.wsDatas.orders.buy.splice(toDelDataIndex, 1)
                      // console.log('delete:', data.data[i].id)
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
            // })
            // this.wsDatas.orders.cache = []
            // this.wsDatas.orders.locked = false
            break
        }
      } else if (allData.length && allData.length > 0 && allData[1] === this.currentUser.email) {
        const data = allData[3]
        if (typeof (data.table) === 'undefined') {
          console.log(data)
          return
        }
        // debugger
        switch (data.table) {
          case 'position':
            switch (data.action) {
              case 'partial':
                this.positionData = data.data
                break
              case 'update':
                for (let i = 0; i < data.data.length; i++) {
                  let itemIndex = this.positionData.findIndex(position => position.symbol === data.data[i].symbol)
                  this.positionData[itemIndex] = {
                    ...this.positionData[itemIndex],
                    ...data.data[i]
                  }
                  this.positionData = [...this.positionData]
                }
                break
              case 'insert':
                for (let i = 0; i < data.data.length; i++) {
                  this.positionData.push(data.data[i])
                }
            }
            // console.log('position',data.action , data.data)
            break
          case 'transact':
            switch (data.action) {
              case 'insert':
                for (let i = 0; i < data.data.length; i++) {
                  this.walletHistory.unshift(data.data[i])
                  // this.orderHistory.unshift(data.data[i])
                }
            }
            console.log('transact', data.action, data.data)
            break
          case 'margin':
            console.log('margin', data.action, data.data)
            this.userData.margin = {
              ...this.userData.margin,
              ...data.data[0] }
            break
          case 'order':
            switch (data.action) {
              case 'partial':
                this.orderData = data.data
                break
              case 'update':
                for (let i = 0; i < data.data.length; i++) {
                  let itemIndex = this.orderData.findIndex(order => order.orderID === data.data[i].orderID)
                  this.orderData[itemIndex] = {
                    ...this.orderData[itemIndex],
                    ...data.data[i]
                  }
                  let itemIndex2 = this.orderHistory.findIndex(order => order.orderID === data.data[i].orderID)
                  this.orderHistory[itemIndex2] = {
                    ...this.orderHistory[itemIndex2],
                    ...data.data[i]
                  }
                }
                this.orderData = [...this.orderData]
                this.orderHistory = [...this.orderHistory]
                break
              case 'insert':
                for (let i = 0; i < data.data.length; i++) {
                  this.orderData.unshift(data.data[i])
                  this.orderHistory.unshift(data.data[i])
                }
            }
            // console.log('order',data.action , data.data)
            break
          case 'execution':
            switch (data.action) {
              // case 'partial':
              //   this.orderData=data.data
              //   break
              // case 'update':
              //   for (let i=0; i<data.data.length;i++){
              //     let itemIndex=this.orderData.findIndex(order => order.orderID===data.data[i].orderID)
              //     this.orderData[itemIndex]={
              //       ...this.orderData[itemIndex],
              //       ...data.data[i]
              //     }
              //   }
              //   break
              case 'insert':
                for (let i = 0; i < data.data.length; i++) {
                  if (data.data[i].lastPx) {
                    this.executionData.unshift(data.data[i])
                  }
                }
            }
            console.log('execution', data.action, data.data)
            break
        }
      } else {
        console.log(allData)
      }
    },

    async getUsers () {
      try {
        console.log('get users!')
        const accounts = await reqUsers()
        if (this.$store.state.user.userName === 'admin') {
          this.users = accounts
        } else {
          // const aaa = this.$store.state.user.accounts
          // debugger
          this.$store.state.user.accounts.forEach(account => {
            // debugger
            const index = accounts.findIndex(item => item.email === account)
            if (index > -1) this.users.push(accounts[index])
          })
        }
      } catch (err) {
        console.log(err)
      }
    },
    async getOrders () {
      try {
        console.log('get orders!')
        const { userName, email } = this.currentUser
        this.orderHistory = await reqOrders(userName)
        if (!this.orderHistory) this.orderHistory = []
        const op = [0, email, userName, { 'op': 'subscribe', 'args': ['order'] }]
        this.websocketsend(JSON.stringify(op))
      } catch (err) {
        console.log(err)
      }
    },
    async getWalletHistory () {
      try {
        console.log('get wallet history!')
        const { userName, email } = this.currentUser
        this.walletHistory = await reqWalletHistory(userName)
        if (!this.walletHistory) this.walletHistory = []
        const op = [0, email, userName, { 'op': 'subscribe', 'args': ['transact'] }]
        this.websocketsend(JSON.stringify(op))
      } catch (err) {
        console.log(err)
      }
    },
    async getTradeHistory () {
      try {
        console.log('get Trade History!')
        const { userName, email } = this.currentUser
        this.executionData = await reqTradeHistory(userName)
        if (!this.executionData) this.executionData = []
        const op = [0, email, userName, { 'op': 'subscribe', 'args': ['execution'] }]
        this.websocketsend(JSON.stringify(op))
      } catch (err) {
        console.log(err)
      }
    },
    async getCelves (type) {
      try {
        const res = await getLevelPriceCelve({ type: type })
        if (res.success) {
          this.celves = res.data
        }
      } catch (e) {
        console.log(e)
      }
    },
    changeCurrentUser (id) {
      const user = this.users.find(user => user._id == id)
      if (user) {
        this.toCancelUser = this.currentUser
        this.currentUser = user
        this.cancelUserWs()
        this.orderData = []
        this.orderHistory = []
        this.executionData = []
        this.getOrders()
        this.getWalletHistory()
        this.getTradeHistory()
        this.createdUserWs()
      }
    },

    createdUserWs () {
      if (this.isFirstTime) {
        this.isFirstTime = false
        return
      }
      const { userName, apiKey, email } = this.currentUser
      if (userName) {
        const key = isTest ? apiKey[0].key : apiKey[1].key
        const apiSecret = isTest ? apiKey[0].apiSecret : apiKey[1].apiSecret
        // console.log(key)
        // console.log(apiSecret)
        const verb = 'GET'
        const path = '/realtime'
        const expires = Math.round(new Date().getTime() / 1000) + 10
        const signature = bitMexSignature(apiSecret, verb, path, expires)
        const op = [1, email, userName]
        this.websocketsend(JSON.stringify(op))
        const op2 = [0, email, userName, { 'op': 'authKeyExpires', 'args': [key, expires, signature] }]
        this.websocketsend(JSON.stringify(op2))
        const op3 = [0, email, userName, { 'op': 'subscribe', 'args': ['position', 'margin'] }]
        this.websocketsend(JSON.stringify(op3))
      }
    },

    cancelUserWs () {
      if (this.isFirstTime) {
        return
      }
      const { userName, email } = this.toCancelUser
      if (userName) {
        // const verb='GET'
        // const path='/realtime'
        // const expires=Math.round(new Date().getTime() / 1000) + 10
        // const signature=bitMexSignature(apiSecret,verb,path,expires)
        const op = [2, email, userName]
        this.websocketsend(JSON.stringify(op))
      }
    },

    pcConfirm (datas) {
      const symbol = datas[0]
      const price = datas[1]
      const params = {
        username: this.currentUser.userName,
        postType: 'closePosition',
        symbol: symbol,
        price: price
      }
      postOrders(params)
      // console.log(symbol,price)
    },
    cancelConfirm (orderID) {
      const params = {
        username: this.currentUser.userName,
        postType: orderID === 'all' ? 'delete all' : 'delete',
        orderID: orderID === 'all' ? '' : orderID
      }
      postOrders(params)
    },
    async insertCelve (values) {
      values.username = this.currentUser.userName
      if (values.type === 'Market')values.startPrice = this.wsDatas.trade[0].price
      values.currentPrice = values.startPrice
      // values.prePrice = values.side === 'Buy' ? values.currentPrice + values.levelPrice : values.currentPrice - values.levelPrice
      values.prePrice = values.currentPrice + values.levelPrice
      values.nextPrice = values.currentPrice - values.levelPrice
      // values.stopPrice = values.side === 'Buy' ? values.prePrice + values.levelPrice : values.prePrice - values.levelPrice
      // values.preStopPrice = values.side === 'Buy' ? values.stopPrice + values.levelPrice : values.stopPrice - values.levelPrice
      values.postType = 'insert'
      values.buyQt = values.sellQt = values.qt
      values.buyStopPrice = values.startPrice - (values.level + 1) * values.levelPrice
      values.sellStopPrice = values.startPrice + (values.level + 1) * values.levelPrice
      values.currentPosition = values.startPosition
      try {
        await postLevelPriceCelve(values)
        this.getCelves('running')
      } catch (e) {
        console.log(e)
      }
      // console.log(JSON.stringify(values))
    },
    async updateCelve (values) {
      // if (values.currentLevel >1) {
      values.prePrice = values.currentPrice + values.levelPrice
      values.nextPrice = values.currentPrice - values.levelPrice
      // }
      // values.prePrice = values.side === 'Buy' ? values.currentPrice + values.levelPrice : values.currentPrice - values.levelPrice
      // values.nextPrice = values.side === 'Buy' ? values.currentPrice - values.levelPrice : values.currentPrice + values.levelPrice
      // values.stopPrice = values.side === 'Buy' ? values.prePrice + values.levelPrice : values.prePrice - values.levelPrice
      // values.preStopPrice = values.side === 'Buy' ? values.stopPrice + values.levelPrice : values.stopPrice - values.levelPrice
      values.postType = 'update'
      values.actions.unshift('策略更新...' + ' ' + moment().format('YYYY-MM-DD HH:mm:ss'))
      try {
        await postLevelPriceCelve(values)
        this.getCelves('running')
      } catch (e) {
        console.log(e)
      }
      // console.log(JSON.stringify(values))
    },
    async stopCelve (data) {
      data.postType = 'stop'
      try {
        await postLevelPriceCelve(data)
        this.getCelves('running')
      } catch (e) {
        console.log(e)
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
