<!--suppress ALL -->
<template>
  <div>
    <div>
      <span>当前运行策略：</span>
      <span style="display:inline-block;margin-left: 12px">当前价格：{{currentPrice}}</span>
    </div>
    <a-table
      :dataSource="celves"
      :columns="table.columns"
    >
      <template slot="index" slot-scope="text, record,index">
        <div style="text-align: center">{{index + 1}}</div>
      </template>
    </a-table>
  </div>
</template>

<script>
  import bitMexSignature from '@/lib/bitmex_signature'
  import moment from 'moment'
  import 'moment/locale/zh-cn'
  import { reqUsers,  reqOrders, postOrders, postLevelPriceCelve, getLevelPriceCelve } from '@/api'

  const isTest = true

    export default {
      name: "Serve",
      data(){
          return {
            websock: null,
            setIntervalPingPong: null,
            setTimeoutReset: null,
            lockReconnect: false,
            lockCelve:false,
            orderLocks:{},
            celves: [],
            currentPrice:null,
            table:{
              columns:[
                {title:'序号',align:'center',key:'index',dataIndex:'index',scopedSlots: { customRender: 'index' },},
                {title:'用户',align:'center',key:'username',dataIndex:'username'},
                {title:'方向',align:'center',key:'side',dataIndex:'side'},
                {title:'起始价格',align:'center',key:'startPrice',dataIndex:'startPrice'},
                {title:'每层仓位',align:'center',key:'qt',dataIndex:'qt'},
                {title:'下一级开单价',align:'center',key:'nextPrice',dataIndex:'nextPrice'},
                {title:'止盈价',align:'center',key:'stopPrice',dataIndex:'stopPrice'},
                {title:'层级价差',align:'center',key:'levelPrice',dataIndex:'levelPrice'},
                {title:'当前层级',align:'center',key:'currentLevel',dataIndex:'currentLevel'},
                {title:'总层级',align:'center',key:'level',dataIndex:'level'},
                ]
            }
        }
      },
      computed:{

      },
      created () {
        this.initWebSocket()
        this.getUsers()
        const _this = this
        setInterval(()=>{_this.getCelves('running')},2000)
      },
      destroyed () {
        this.websock.close() // 离开路由之后断开websocket连接
      },
      methods: {
        moment,
        initWebSocket () { // 初始化weosocket
          if (!this.websock) {
            console.log('建立websocket连接')
            const wsuri =isTest ?  'wss://testnet.bitmex.com/realtime' : 'wss://www.bitmex.com/realtime'
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
          const op = { 'op': 'subscribe', 'args': ['trade:XBTUSD'] }
          this.websocketsend(JSON.stringify(op))
          // this.websock.send(op)

          // console.log(typeof (op) ,op)
          this.setIntervalWs()
          // if (this.currentUser.userName) this.createdUserWs()
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
          if(allData.table && allData.table==='trade'){
            // console.log('trade:',allData.action,allData.data)
            this.currentPrice=allData.data[0].price
            this.levelPriceCelve(allData.data[0].price)
            return
          }
          console.log(allData)
        },
        async getUsers () {
          try {
            console.log('get users!')
            this.users = await reqUsers()
          } catch (err) {
            console.log(err)
          }
        },
        async getCelves (type) {
          try {
            const res = await getLevelPriceCelve({ type: type })
            if (res.success) {
              this.celves = res.data
              this.celves.forEach((item)=>{
                item.key=item.username[0]
              })
            }
          } catch (e) {
            console.log(e)
          }
        },

       levelPriceCelve(currentPrice){


          this.celves.forEach(async item=>{
            if(item.side === 'Buy'){
              if(currentPrice <= item.nextPrice + item.offset && item.nextLevel <= item.level){
                if(this.lockCelve){
                  console.log('celve locked!')
                  return
                }
                console.time()
                this.lockCelve = true
                console.log('触发开单!当前价格：'+currentPrice +'... '+'nextPrice:'+ item.nextPrice+'... '+'nextLevel:'+ item.nextLevel)
                const res = await this.createOrder(item)
                if(res === 'wait'){
                  console.log('locked!wait!')
                  return
                }else{
                  console.log('')
                  if(res.error){
                    item.actions.unshift(res.error.message)
                  }else{
                    item.actions.unshift('下单 '+ res.orderQty + '... '+'价格 '+ res.price +'... '+ ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
                    console.log('下单 '+ res.orderQty + '... '+'价格 '+res.price +'... '+ ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
                    item.preLevel = item.currentLevel
                    item.currentLevel=item.nextLevel
                    item.nextLevel = item.nextLevel +1
                    item.stopPrice = item.currentLevel ==1 ? 999999 :item.prePrice
                    item.prePrice = item.nextPrice
                    item.nextPrice = item.nextPrice - item.levelPrice
                  }
                  try {
                    item.postType = 'update'
                    await postLevelPriceCelve(item)
                    await this.getCelves('running')
                    this.orderLocks[item._id] = false
                    this.lockCelve = false
                    console.timeEnd()
                  } catch (e) {
                    this.orderLocks[item._id] = false
                    console.log(e)
                  }
                }
                // debugger

              }
              if(currentPrice >= item.stopPrice - item.offset && item.currentLevel > 1){
                if(this.lockCelve){
                  console.log('celve locked!')
                  return
                }
                console.time()
                this.lockCelve = true
                console.log('触发平仓!当前价格：'+currentPrice +'... '+'stopPrice:'+ item.stopPrice+'... '+'currentLevel:'+ item.currentLevel)
                const res = await this.pcOrder(item)
                if(res === 'wait'){
                  console.log('locked!wait!')
                  return
                }else{
                  if(res.error){
                    item.actions.unshift(res.error.message)
                  }else{
                    item.actions.unshift('平仓 '+ res.orderQty + '... '+'价格 '+res.price +'... '+ ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
                    console.log('平仓 '+ res.orderQty + '... '+'价格 '+res.price +'... '+ ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'),res)
                    item.nextPrice = item.prePrice
                    item.prePrice = item.prePrice + item.levelPrice
                    item.nextLevel = item.currentLevel
                    item.currentLevel=item.preLevel
                    item.preLevel = item.preLevel - 1
                    item.stopPrice = item.stopPrice = item.currentLevel ===1 ? 999999 : item.prePrice + item.levelPrice
                  }
                  try {
                    item.postType = 'update'
                    await postLevelPriceCelve(item)
                    await this.getCelves('running')
                    this.orderLocks[item._id] = false
                    this.lockCelve = false
                    console.timeEnd()
                  } catch (e) {
                    this.orderLocks[item._id] = false
                    console.log(e)
                  }
                }
              }
            }else if(item.side === 'Sell'){
              if(currentPrice >= item.nextPrice - item.offset && item.nextLevel <= item.level){
                if(this.lockCelve){
                  console.log('celve locked!')
                  return
                }
                console.time()
                this.lockCelve = true
                console.log('触发开单!当前价格：'+currentPrice +'... '+'nextPrice:'+ item.nextPrice+'... '+'nextLevel:'+ item.nextLevel)
                const res = await this.createOrder(item)
                if(res === 'wait'){
                  console.log('locked!wait!')
                  return
                }else{
                  if(res.error){
                    item.actions.unshift(res.error.message)
                  }else{
                    item.actions.unshift('下单 '+ res.orderQty + '... '+'价格 '+res.price +'... '+ ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
                    console.log('下单 '+ res.orderQty + '... '+'价格 '+res.price +'... '+ ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
                    item.preLevel = item.currentLevel
                    item.currentLevel=item.nextLevel
                    item.nextLevel = item.nextLevel +1
                    item.stopPrice = item.currentLevel ==1 ? 999999 :item.prePrice
                    item.prePrice = item.nextPrice
                    item.nextPrice = item.nextPrice + item.levelPrice
                  }
                  try {
                    item.postType = 'update'
                    await postLevelPriceCelve(item)
                    await this.getCelves('running')
                    this.orderLocks[item._id] = false
                    this.lockCelve = false
                    console.timeEnd()
                  } catch (e) {
                    this.orderLocks[item._id] = false
                    console.log(e)
                  }
                }
              }
              if(currentPrice <= item.stopPrice  - item.offset && item.currentLevel > 1){
                if(this.lockCelve){
                  console.log('celve locked!')
                  return
                }
                console.time()
                this.lockCelve = true
                console.log('触发平仓!当前价格：'+currentPrice +'... '+'stopPrice:'+ item.stopPrice+'... '+'currentLevel:'+ item.currentLevel)
                const res = await this.pcOrder(item)
                if(res === 'wait'){
                  console.log('locked!wait!')
                  return
                }else{
                  if(res.error){
                    item.actions.unshift(res.error.message)
                  }else{
                    item.actions.unshift('平仓 '+ res.orderQty + '... '+'价格 '+res.price +'... '+ ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
                    console.log('平仓 '+ res.orderQty + '... '+'价格 '+res.price +'... '+ ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
                    item.nextPrice = item.prePrice
                    item.prePrice = item.prePrice - item.levelPrice
                    item.nextLevel = item.currentLevel
                    item.currentLevel=item.preLevel
                    item.preLevel = item.preLevel - 1
                    console.log('currentLevel:',item.currentLevel)
                    item.stopPrice = item.currentLevel ==1 ? 999999 :item.prePrice - item.levelPrice
                  }
                  try {
                    item.postType = 'update'
                    await postLevelPriceCelve(item)
                    await this.getCelves('running')
                    this.orderLocks[item._id] = false
                    this.lockCelve = false
                    console.timeEnd()

                  } catch (e) {
                    this.orderLocks[item._id] = false
                    console.log(e)
                  }
                }
              }
            }
          })


        },
        async createOrder(celve){
          if(this.orderLocks[celve._id]) {
            // debugger
            return 'wait'
          }else{
            console.log('发送开单命令！')
            // debugger
            this.orderLocks[celve._id] = true
            const params={
              postType:'create',
              username:celve.username[0],
              symbol:'XBTUSD',
              side:celve.side,
              orderQty:celve.qt,
              price:celve.nextPrice,
              ordType:'Limit',
              clOrdID:celve._id + celve.nextLevel + moment().format('HHmmss')
            }
            try{
              console.log('开单参数：',params)
              const res = await postOrders(params)
              // this.orderLocks[celve._id] = false
              return res
            }catch (e) {
              // this.orderLocks[celve._id] = false
              return {error:{message:e}}
            }
          }
        },
        async pcOrder(celve){
          if(this.orderLocks[celve._id]) {
            // debugger
            return  'wait'
          }else{
            console.log('发送平仓命令！')
            // debugger
            this.orderLocks[celve._id] = true
            const params={
              postType:'create',
              username:celve.username[0],
              symbol:'XBTUSD',
              side:celve.side === 'Buy'?'Sell':'Buy',
              orderQty:celve.qt,
              price:celve.stopPrice,
              ordType:'Limit',
              clOrdID:celve._id + celve.preLevel + moment().format('HHmmss')
            }
            try{
              console.log('平仓参数：',params)
              const res = await postOrders(params)
              return res
            }catch (e) {
              // this.orderLocks[celve._id] = false
              return {error:{message:e}}
            }
          }
        }
      }
    }
</script>

<style scoped>

</style>
