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
      <!--<template slot="position" slot-scope="text, record,index">-->
        <!--<div style="text-align: center">{{positions.length > 0 ? positions.find(i=>i.username ==record.username).position :'-'}}</div>-->
      <!--</template>-->
    </a-table>
    <div style="width: 400px;margin-top: 24px">
      <a-card title="持仓情况" :headStyle="headStyle" :bodyStyle="bodyStyle">
        <div style="height: 400px;">
          <div v-for="(item,index) in positions" :key="item.username" :class="rowClass(item,index)">
            <a-row>
              <a-col :lg="12" style="text-align: center">{{item.username}}</a-col>
              <a-col :lg="12" style="text-align: center">{{item.position}}</a-col>
            </a-row>
          </div>
        </div>
      </a-card>
    </div>

  </div>
</template>

<script>
  import bitMexSignature from '@/lib/bitmex_signature'
  import moment from 'moment'
  import 'moment/locale/zh-cn'
  import { reqUsers,  reqOrders, postOrders, postLevelPriceCelve, getLevelPriceCelve } from '@/api'

  import {settings} from '../../config/dev-setting'
  const {isTest} = settings

    export default {
      name: "Serve",
      data(){
          return {
            websock: null,
            users:[],
            setIntervalPingPong: null,
            setTimeoutReset: null,
            lockReconnect: false,
            lockCelve:false,
            orderLocks:{},
            celves: [],
            positions:[],
            positionLocks:{},
            currentPrice:null,
            bodyStyle: {
              height: '400px',
              padding: 0,
              overflow: 'auto'
            },
            headStyle: {
              'text-align': 'left'
            },
            table:{
              columns:[
                {title:'序号',align:'center',key:'index',dataIndex:'index',scopedSlots: { customRender: 'index' },},
                {title:'用户',align:'center',key:'username',dataIndex:'username'},
                {title:'基准价',align:'center',key:'startPrice',dataIndex:'startPrice'},
                {title:'总层级',align:'center',key:'level',dataIndex:'level'},
                {title:'每层价差',align:'center',key:'levelPrice',dataIndex:'levelPrice'},
                {title:'每层仓位',align:'center',key:'qt',dataIndex:'qt'},
                {title:'当前层级',align:'center',key:'currentLevel',dataIndex:'currentLevel'},
                {title:'当前基准价',align:'center',key:'currentPrice',dataIndex:'currentPrice'},
                {title:'下一级挂单价（多）',align:'center',key:'nprePriceextPrice',dataIndex:'nextPrice'},
                {title:'下一级挂单价（空）',align:'center',key:'',dataIndex:'prePrice',},
                // {title:'持仓',align:'center',key:'position',dataIndex:'position',scopedSlots: { customRender: 'position' }},
                ]
            }
        }
      },
      computed:{

      },
      async created  () {
        this.initWebSocket()
        const _this = this
        await this.getUsers()
        setInterval(()=>{_this.getCelves('running')},2000)
        setInterval(()=>{_this.levelPriceCelve()},1000)
      },
      destroyed () {
        this.websock.close() // 离开路由之后断开websocket连接
      },
      methods: {
        moment,
        // 单双行条纹样式
        rowClass (record, index) {
          let classNames = ''
          if (index % 2 === 1) classNames = 'even-rows '
          // if (record.side === 'Buy') {
          //   classNames = classNames + ' ' + 'buy-trade'
          // } else {
          //   classNames = classNames + ' ' + 'sell-trade'
          // }
          return classNames
        },
        initPosition(){
          this.positions=[]
          if(this.users.length>0){
            this.users.forEach(user=>{
              this.positions.push({
                username:user.userName,
                position:user.position.length>0 ? user.position.find(i=>i.symbol==='XBTUSD').currentQty :'0',
              })
            })
          }
        },
        initWebSocket () { // 初始化weosocket
          if (!this.websock) {
            console.log('建立websocket连接')
            const wsuri =isTest ?  'wss://testnet.bitmex.com/realtimemd' : 'wss://www.bitmex.com/realtimemd'
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
          // const op = { 'op': 'subscribe', 'args': ['trade:XBTUSD'] }
          // this.websocketsend(JSON.stringify(op))
          // this.websock.send(op)
          const op = [1, 'nomalInfos', 'allUsers']
          this.websock.send(JSON.stringify(op))
          const op2 = [0, 'nomalInfos', 'allUsers', { 'op': 'subscribe', 'args': ['trade:XBTUSD'] }]
          this.websock.send(JSON.stringify(op2))
          // console.log(typeof (op) ,op)
          this.setIntervalWs()
          if (this.users.length>0) {
            this.users.forEach(user=>{
              this.createdUserWs(user)
            })
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
          if (allData.length && allData.length > 0 && allData[1] == 'nomalInfos') {
            const data = allData[3]
            if (typeof(data.table) == 'undefined') {
              console.log(allData)
              return
            }
            switch (data.table) {
              case 'trade':
                this.currentPrice=data.data[0].price
                // if (data.action === 'partial') {
                //   for (let i = 0; i < data.data.length; i++) {
                //     // data.data[i].key = data.data.trdMatchID
                //     const date = moment(data.data[i].timestamp).format('HH:mm:ss')
                //     data.data[i].time = date
                //   }
                //   this.wsDatas.trade = data.data
                // } else if (data.action === 'insert') {
                //   for (let i = 0; i < data.data.length; i++) {
                //     // data.data[i].key = data.data.trdMatchID
                //     const date = moment(data.data[i].timestamp).format('HH:mm:ss')
                //     data.data[i].time = date
                //     this.wsDatas.trade.unshift(data.data[i])
                //   }
                //   if (this.wsDatas.trade.length > 60) this.wsDatas.trade = this.wsDatas.trade.slice(0, 59)
                // }
                // console.log(data.action + ' : ', data.data)
                break
            }
          } else if (allData.length && allData.length > 3) {
            const user = allData[2]
            const data = allData[3]
            if (typeof(data.table) == 'undefined') {
              console.log(allData)
              return
            }
            // debugger
            switch (data.table) {
              case 'position':
                // console.log('position:',allData)
                const thisUser = this.users.find(i=>i.userName == user)
                switch (data.action) {
                  case 'partial':
                    thisUser.position = [...data.data]
                    this.initPosition()
                    console.log(thisUser)
                    break
                  case 'update':
                    // thisUser.position = {...thisUser.position , ...data.data}
                    for (let i = 0; i < data.data.length; i++) {
                      let itemIndex = thisUser.position.findIndex(position => position.symbol === data.data[i].symbol)
                      thisUser.position[itemIndex] = {
                        ...thisUser.position[itemIndex],
                        ...data.data[i]
                      }
                      this.initPosition()
                    }
                    break
                  case 'insert':
                    for (let i = 0; i < data.data.length; i++) {
                      thisUser.position.push(data.data[i])
                    }
                    this.initPosition()
                }
                // console.log('position',data.action , data.data)
                break
              case 'affiliate':
                console.log('affiliate',data.action,data.data)
            }
          } else {
            console.log(allData)
          }

        },
        async getUsers () {
          try {
            console.log('get users!')
            this.users = await reqUsers()
            this.users.forEach(user=>{
              user.position=[]
              this.positionLocks[user.userName]=false
              this.createdUserWs(user)
            })
            return
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
        createdUserWs(user){
          const { userName, apiKey, email } = user
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
            const option = userName == '233089043' ? ['position','affiliate']:['position']
            const op3 = [0, email, userName, { 'op': 'subscribe', 'args': option }]
            this.websocketsend(JSON.stringify(op3))
          }
        },
       levelPriceCelve(){
         this.celves.forEach(async item=>{
           if(item.firstTime){
                 this.doMulitCelve(item,null,true)
               }else{
             const userPosition = this.positions.find(i=>i.username==item.username[0]).position
             switch (true) {
               case ( userPosition >= item.qt * (item.currentLevel+ 1)):
                 this.doMulitCelve(item,'Buy')
                     break
               case (userPosition <= item.qt * (item.currentLevel- 1)):
                 this.doMulitCelve(item,'Sell')
                 break
               case (item.qt * item.currentLevel > userPosition  && userPosition > item.qt * (item.currentLevel- 1)):
                 // console.log('userPosition:',userPosition)
                 // console.log('item.qt * item.currentLevel:',(item.qt * item.currentLevel))
                 // console.log('item.qt * (item.currentLevel- 1):',(item.qt * (item.currentLevel- 1)))
                 if(this.currentPrice * 2 < item.prePrice + item.nextPrice){
                   console.log('Buy')
                   const qt = item.qt * item.currentLevel - userPosition
                   this.doMulitCelve(item,'Buy',true,qt)
                 }
                 break
               case (item.qt * item.currentLevel < userPosition && userPosition < item.qt * (item.currentLevel + 1)):
                 if(this.currentPrice * 2 > item.prePrice + item.nextPrice){
                   console.log('Sell')
                   const qt = userPosition - item.qt * item.currentLevel
                   this.doMulitCelve(item,'Sell',true,qt)
                 }
                 break
               default :
                 return
             }
           }
         })
          // this.celves.forEach(async item=>{
          //   if(item.firstTime){
          //     this.doMulitCelve(item,null,true)
          //   }else{
          //     if(currentPrice >= item.prePrice + item.offset && item.currentLevel > (-1 - item.level) ){
          //       this.doMulitCelve(item,'Sell')
          //     }else if(currentPrice <= item.nextPrice - item.offset && item.currentLevel < item.level + 1 ){
          //       this.doMulitCelve(item,'Buy')
          //     }
          //   }
          // })
        },
        async createOrder(celve,isPc,firstTime){
          if(this.orderLocks[celve._id]) {
            // debugger
            console.log(this.orderLocks[celve._id] +'is locked! wait！')
            return 'wait'
          }else{
            console.log('发送开单命令！')
            // debugger
            this.orderLocks[celve._id] = true
            const params={
              postType:'create',
              username:celve.username[0],
              symbol:'XBTUSD',
              // side:celve.side,
              side:'Buy',
              orderQty:celve.qt,
              price:firstTime ? celve.nextPrice : isPc ? celve.nextPrice - celve.levelPrice : celve.currentPrice,
              ordType:'Limit',
              clOrdID:celve._id + celve.nextLevel + moment().format('HHmmss')
            }
            try{
              console.log('开单参数：',JSON.stringify(params))
              const res = await postOrders(params)
              // this.orderLocks[celve._id] = false
              return res
            }catch (e) {
              // this.orderLocks[celve._id] = false
              return {error:{message:e}}
            }
          }
        },
        async pcOrder(celve,isPc,firstTime){
          if(this.orderLocks[celve._id]) {
            // debugger
            console.log(this.orderLocks[celve._id] +'is locked! wait！')
            return  'wait'
          }else{
            // console.log('发送平仓命令！')
            console.log('发送空仓命令！')
            // debugger
            this.orderLocks[celve._id] = true
            const params={
              postType:'create',
              username:celve.username[0],
              symbol:'XBTUSD',
              // side:celve.side === 'Buy'?'Sell':'Buy',
              side:'Sell',
              orderQty:celve.qt,
              price:firstTime ? celve.prePrice :isPc ? celve.currentPrice : celve.prePrice + celve.levelPrice,
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
        },
        async delAllOrder(celve){
          const params={
            postType: 'delete all',
            username:celve.username[0],
            symbol:'XBTUSD',
          }
          try{
            // console.log('平仓参数：',params)
            const res = await postOrders(params)
            return res
          }catch (e) {
            // this.orderLocks[celve._id] = false
            return {error:{message:e}}
          }
        },
        async doMulitCelve(item,side,firstTime,qt){
          //策略锁，防止重复下单
          //   if (this.lockCelve) {
          //   console.log('celve locked!')
          //   return
          // }
          // console.time()
          // this.lockCelve = true
          //将所有挂单撤销，以免重复挂单
          // const userPosition=this.positions.find(i=>i.username == item.username[0])
          // debugger
          console.log('this Position:',this.positions)
          console.log('item:',item)
          // console.log('userPosition:',userPosition)
          if(this.positionLocks[item.username[0]]) {
            // debugger
            console.log('wait createOrder locked! wait!')
            return
          }else{
            this.positionLocks[item.username[0]]= true
            console.log('挂单锁',this.positionLocks)
          console.time("delete");
          // if(item.currentLevel > 1){
          // if(!firstTime){
            try{
              console.log('撤单执行！',this.positionLocks)
              const delRes = await this.delAllOrder(item)
              if(delRes.error){
                console.log('撤单错误：',delRes.error.message)
                this.positionLocks[item.username[0]]= false
                return
              }
              console.log('已发送撤单命令：',delRes)
            }catch (e) {
              console.log('撤单错误：',e)
              this.positionLocks[item.username[0]]= false
              return
            }
          // }
          // }
          console.timeEnd("delete");
          console.time("挂单")


            console.log('发送开单命令！')
            // debugger

            const params={
              orders:[]
            }
            if(item.currentLevel < item.level){
              params.orders.push({
                username:item.username[0],
                symbol:'XBTUSD',
                // side:celve.side,
                side:'Buy',
                orderQty:item.qt,
                price:firstTime ? item.nextPrice : side=='Buy' ? item.nextPrice - item.levelPrice : item.currentPrice,
                ordType:'Limit',
                clOrdID:item._id + item.currentLevel + moment().format('HHmmss')
              })
            }
            if(item.currentLevel > 0 - item.level){
              params.orders.push({
                username:item.username[0],
                symbol:'XBTUSD',
                // side:celve.side,
                side:'Sell',
                orderQty:item.qt,
                price:firstTime ? item.prePrice :  side=='Buy' ? item.currentPrice : item.prePrice + item.levelPrice ,
                ordType:'Limit',
                clOrdID:item._id + item.currentLevel + moment().format('HHmmss')
              })
            }
            if(qt){
              params.orders.push({
                username:item.username[0],
                symbol:'XBTUSD',
                // side:celve.side,
                side:side ,
                orderQty:qt,
                price: side=='Buy' ? (item.currentPrice + 10):(item.currentPrice - 10 ) ,
                ordType:'Limit',
                clOrdID:item._id + item.currentLevel + moment().format('HHmmss')
              })
            }
            params.postType='create mulit'
            params.username=item.username[0]
            try{
              console.log('开单参数：',JSON.stringify(params))
              const res = await postOrders(params)
              // this.orderLocks[celve._id] = false
              if (res.error) {
                item.actions.unshift(res.error)
                this.positionLocks[item.username[0]] = false
                return
                // if(res.response.headers['x-ratelimit-remaining'] && res.response.headers['x-ratelimit-remaining']>10){
                //   this.doMulitCelve(item,side,firstTime)
                // }else{
                //   const _this=this
                //   setTimeout(()=>{_this.doMulitCelve(item,side,firstTime),res.response.headers['Retry-After'] ? res.response.headers['Retry-After']: 5000})
                // }

              } else {
                if(res.length){
                  res.forEach(i=>{
                    const message = i.orderQty
                      ? '挂单 ' + i.orderQty + '... ' + '价格 ' + i.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss')
                      : JSON.stringify(i) + moment().format('YYYY-MM-DD HH:mm:ss')
                    item.actions.unshift(message)
                    console.log(message)
                  })
                }else{
                  item.actions.unshift(JSON.stringify(res))
                  this.positionLocks[item.username[0]] = false
                  return
                }
                // console.log(res,JSON.stringify(res))
                // this.orderLocks[item._id] = false
              }
            }catch (e) {
              // this.orderLocks[celve._id] = false
              console.log('挂单错误：',e)
              this.positionLocks[item.username[0]] = false
              return {error:{message:e}}
            }
          }


          console.timeEnd("挂单");
          //更新策略及日志
          console.time("策略更新")
          try {
            if(firstTime){
              item.firstTime = false
            }else{
              item.currentLevel =   side=='Buy' ? item.currentLevel + 1 : item.currentLevel - 1
              item.currentPrice = side=='Buy' ? item.currentPrice -  item.levelPrice : item.currentPrice +  item.levelPrice
              item.prePrice =   side=='Buy' ? item.prePrice -  item.levelPrice : item.prePrice +  item.levelPrice
              item.nextPrice =   side=='Buy' ? item.nextPrice -  item.levelPrice : item.nextPrice +  item.levelPrice
            }
            delete item.state
            item.postType = 'update'
            console.log('更新策略，参数:',item)
            await postLevelPriceCelve(item)
            await this.getCelves('running')
            this.positionLocks[item.username[0]]= false
            // this.lockCelve = false
          } catch (e) {
            userPosition.locked = false
            this.positionLocks[item.username[0]]= false
          }
          console.timeEnd("策略更新");
          console.timeEnd()
        }
      }
    }
</script>

<style scoped>

</style>
