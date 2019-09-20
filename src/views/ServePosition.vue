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
  import { reqUsers,  reqOrders, postOrders, postLevelPriceCelve, getLevelPriceCelve,websocketLog } from '@/api'

  import {settings} from '../../config/dev-setting'
  const {isTest} = settings

    export default {
      name: "Serve",
      data(){
          return {
            isFirstTime:true,
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
        this.isFirstTime = false
        setInterval(()=>{_this.getCelves('running')},2500)
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
        //初始化仓位列表
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


        //-------------------------------------------------------------------------------websocket 方法-------------------------------------------------------------------------------
        initWebSocket () { // 初始化weosocket
          if (!this.websock) {
            console.log('建立websocket连接')
            if(!isTest){
              websocketLog('建立websocket连接')
            }
            const wsuri =isTest ?  'wss://testnet.bitmex.com/realtimemd' : 'wss://www.bitmex.com/realtimemd'
            // const wsuri = 'wss://www.bitmex.com/realtimemd'
            this.websock = new WebSocket(wsuri)
            this.websock.onmessage = this.websocketonmessage
            this.websock.onopen = this.websocketonopen
            this.websock.onerror = this.websocketonerror
            this.websock.onclose = this.websocketclose
          } else {
            console.log('websocket已存在')
            if(!isTest){
              websocketLog('websocket已存在')
            }
          }
        },
        websocketonopen () { // 连接建立之后执行send方法发送数据
          console.log('websocket已连接')
          if(!isTest){
            websocketLog('websocket已连接')
          }
          // const op = { 'op': 'subscribe', 'args': ['trade:XBTUSD'] }
          // this.websocketsend(JSON.stringify(op))
          // this.websock.send(op)
          const op = [1, 'nomalInfos', 'allUsers']
          this.websock.send(JSON.stringify(op))
          const op2 = [0, 'nomalInfos', 'allUsers', { 'op': 'subscribe', 'args': ['trade:XBTUSD'] }]
          this.websock.send(JSON.stringify(op2))
          // console.log(typeof (op) ,op)
          if ( ! this.isFirstTime){
            const _this = this
            this.setIntervalWs()
            if (this.users.length>0) {
              this.users.forEach((user,index)=>{
                setTimeout(()=>{
                  _this.createdUserWs(user)
                },index * 2000)
              })
            }
          }
          // let actions = { 'test': '12345' }
          // this.websocketsend(JSON.stringify(actions))
        },
        websocketonerror (e) { // 连接建立失败重连
          clearInterval(this.setIntervalPingPong)
          console.log('链接错误:', e)
          if(!isTest){
            websocketLog('链接错误'+ JSON.stringify(e))
          }

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
            }, 5000)
          }
          // this.websock.send(Data)
        },
        websocketclose (e) { // 关闭
          console.log('断开连接', e)
          if(!isTest){
            websocketLog('断开连接'+ JSON.stringify(e))
          }
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
          }, 5000)
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

        //-------------------------------------------------------------------------------后台请求 方法-------------------------------------------------------------------------------
        async getUsers () {
          try {
            console.log('get users!')
            this.users = await reqUsers()
            const _this=this
            this.users.forEach((user,index)=>{
              user.position=[]
              this.positionLocks[user.userName]=false
              setTimeout(()=>{
                _this.createdUserWs(user)
                console.log('createdUserWs:'+ user.userName)
              },index * 3000)
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
        async stopCelve (data) {
          data.postType = 'stop'
          try {
            await postLevelPriceCelve(data)
            this.getCelves('running')
          } catch (e) {
            console.log(e)
          }
        },
        //暂时弃用
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
          console.time("delete");
          const params={
            postType: 'delete all',
            username:celve.username[0],
            symbol:'XBTUSD',
          }
          try{
            console.log('撤单执行！',this.positionLocks)
            const delRes = await postOrders(params)
            if(delRes.error){
              console.log('撤单错误：',delRes.error.message)
              console.timeEnd("delete");
              return {success:false}
            }else{
              console.log('已发送撤单命令：',delRes)
              console.timeEnd("delete");
              return {success:true}
            }
          }catch (e) {
            console.log('撤单错误：',e)
            console.timeEnd("delete");
            return {success:false}
          }
        },

        //-------------------------------------------------------------------------------  策略  方法-------------------------------------------------------------------------------
       levelPriceCelve(){
         this.celves.forEach(async item=>{
           if(item.firstTime){
             if( this.currentPrice <= item.startPrice + item.levelPrice/2 && this.currentPrice >= item.startPrice - item.levelPrice/2){
               item.startTime = moment().format('YYYY-MM-DD HH:mm')
               if(item.dayTradeTimes.length ===0){
                 item.dayTradeTimes.unshift({
                   date:moment().format('YYYY-MM-DD'),
                   times:0
                 })
               }
               this.doMulitCelve({
                 celve:item,
                 firstTime:true,
                 side: item.side
               })
             }
               }else{
             if (item.updated){
               this.doMulitCelve({
                 celve:item,
                 firstTime:true,
                 side: item.side
               })
               return
             }
              // debugger
             if (item.autoStop === true && item.currentLevel === item.autoStopLevel){
               this.stopCelve(item)
               return
             }
             if (item.levelStopType === 'stop' && ( this.currentPrice <= item.buyStopPrice || this.currentPrice >= item.sellStopPrice )){
               this.doPcCelve(item)
               return
             }

             const userPosition = this.positions.find(i=>i.username==item.username[0]).position
             //如果当前持仓和本级持仓不同，则运行策略

             //回归0层时，平掉多余仓位
             if (item.currentLevel === 0 && item.currentPosition != item.startPosition){
               console.log('平掉多余仓位')
               const qt = item.currentPosition - item.startPosition
               this.doPartpcCelve({
                 celve:item,
                 side:qt <0 ? 'Buy':'Sell',
                 qt:Math.abs(qt),
                 currentPositionChange:true
               })
               return
             }
              if(userPosition != item.currentPosition){
                switch (true) {
                  //当前持仓大于或等于本级持仓和本级多单仓位之和，表示挂单仓位已成交，执行下一级挂单
                  case ( userPosition >= (item.currentPosition + item.buyQt) ):
                    // debugger
                    this.doMulitCelve({
                      celve:item,
                      side:'Buy'
                    })
                    break
                  //当前持仓小于或等于本级持仓减去本级空单仓位之和，表示挂单仓位已成交，执行下一级挂单
                  case (userPosition <= (item.currentPosition - item.sellQt)):
                    // debugger
                    this.doMulitCelve({
                      celve:item,
                      side:'Sell'
                    })
                    break

                  //当前持仓比本级持仓大，但比本级持仓和本级多单仓位之和小，表示多单部分成交，执行平仓策略
                  case ((item.currentPosition + item.buyQt) > userPosition  && userPosition > item.currentPosition):
                    // console.log('userPosition:',userPosition)
                    // console.log('item.qt * item.currentLevel:',(item.qt * item.currentLevel))
                    // console.log('item.qt * (item.currentLevel- 1):',(item.qt * (item.currentLevel- 1)))
                    // debugger
                    if(this.currentPrice * 2 > item.prePrice + item.nextPrice){
                      // console.log('Buy')
                      const qt =  userPosition - item.currentPosition
                      this.doPartpcCelve({
                        celve:item,
                        side:'Sell',
                        qt:qt
                      })
                    }
                    break
                  //当前持仓比本级持仓小，但比本级持仓和本级空单仓位之和大，表示空单部分成交，执行平仓策略
                  case ((item.currentPosition - item.sellQt) < userPosition && userPosition < item.currentPosition):
                    if(this.currentPrice * 2 < (item.prePrice + item.nextPrice)){
                      // console.log('Sell')
                      // debugger
                      const qt = item.currentPosition - userPosition
                      this.doPartpcCelve({
                        celve:item,
                        side:'Buy',
                        qt:qt
                      })
                    }
                    break
                  default :
                    return
                }
              }
           }
         })
        },

        async doMulitCelve({celve,side,firstTime,qt}){
          // debugger
          const _this = this
          let buyQt = celve.qt
          let sellQt = celve.qt
          console.log('this Position:',this.positions)
          console.log('celve:',celve)
          // console.log('userPosition:',userPosition)
          if(this.positionLocks[celve.username[0]]) {
            // debugger
            console.log('wait createOrder locked! wait!')
            return
          }else{
            this.positionLocks[celve.username[0]]= true
            console.log('挂单锁',this.positionLocks)

            const delRes = await this.delAllOrder(celve)
            if (!delRes.success) {
              setTimeout( () => {
                _this.positionLocks[celve.username[0]]= false
              },3000)
              return
            }

            console.time("挂单")
            console.log('发送开单命令！')
            // debugger
            //如果设置了减仓，则判断运行级别来设置挂单仓位
            if(celve.isReduce){
              if (side === 'Buy'){
                if( celve.currentLevel >= celve.stopLevel){
                  // debugger
                  sellQt =Number( (celve.qt * 4/3).toFixed(0) )
                }
                if( celve.currentLevel < -1 - celve.stopLevel ){
                  // debugger
                  buyQt =Number( (celve.qt * 4/3).toFixed(0) )
                }
              }else if (side === 'Sell'){
                // debugger
                if( celve.currentLevel <= 0 - celve.stopLevel ){
                  // debugger
                  buyQt =Number( (celve.qt * 4/3).toFixed(0) )
                }
                if( celve.currentLevel > celve.stopLevel + 1){
                  // debugger
                  sellQt =Number( (celve.qt * 4/3).toFixed(0) )
                }
              }
            }
            const params={
              orders:[]
            }
            if (side === 'Buy'){
              if(celve.side !='Sell' || celve.currentLevel < -1){   //如果设置单边挂单，在此判断是否执行挂多单策略，条件为不是单边空，或者单边空的时候层级在11级以下，可以挂多单
                if( celve.currentLevel < celve.level - 1) {
                  params.orders.push({
                    username: celve.username[0],
                    symbol: 'XBTUSD',
                    // side:celve.side,
                    side: 'Buy',
                    orderQty: buyQt,
                    price: firstTime ? celve.nextPrice : side == 'Buy' ? celve.nextPrice - celve.levelPrice : celve.currentPrice,
                    ordType: 'Limit',
                    clOrdID: celve._id + celve.currentLevel + moment().format('HHmmss')
                  })
                }
              }
              if (!firstTime){
                params.orders.push({
                  username:celve.username[0],
                  symbol:'XBTUSD',
                  // side:celve.side,
                  side:'Sell',
                  orderQty: sellQt,
                  price:firstTime ? celve.prePrice :  side=='Buy' ? celve.currentPrice : celve.prePrice + celve.levelPrice ,
                  ordType:'Limit',
                  clOrdID:celve._id + celve.currentLevel + moment().format('HHmmss')
                })
              }
            }else{
              if (!firstTime || celve.side ==='Both'){
              params.orders.push({
                username:celve.username[0],
                symbol:'XBTUSD',
                // side:celve.side,
                side:'Buy',
                orderQty:buyQt,
                price:firstTime ? celve.nextPrice : side=='Buy' ? celve.nextPrice - celve.levelPrice : celve.currentPrice,
                ordType:'Limit',
                clOrdID:celve._id + celve.currentLevel + moment().format('HHmmss')
              })}
              if(celve.side !='Buy' || celve.currentLevel > 1){   //如果设置单边挂单，在此判断是否执行挂空单策略，条件为不是单边多，或者单边多的时候层级在1级以上，可以挂空单
                if(celve.currentLevel > 1 - celve.level){
                  params.orders.push({
                    username:celve.username[0],
                    symbol:'XBTUSD',
                    // side:celve.side,
                    side:'Sell',
                    orderQty:sellQt,
                    price:firstTime ? celve.prePrice :  side=='Buy' ? celve.currentPrice : celve.prePrice + celve.levelPrice ,
                    ordType:'Limit',
                    clOrdID:celve._id + celve.currentLevel + moment().format('HHmmss')
                  })
                }
              }
            }
            params.postType='create mulit'
            params.username=celve.username[0]
            try{
              console.log('开单参数：',JSON.stringify(params))
              const res = await postOrders(params)
              // this.orderLocks[celve._id] = false
              if (res.error) {
                celve.actions.unshift(res.error)
                setTimeout( () => {
                  _this.positionLocks[celve.username[0]]= false
                },3000)
                return
                // if(res.response.headers['x-ratelimit-remaining'] && res.response.headers['x-ratelimit-remaining']>10){
                //   this.doMulitCelve(celve,side,firstTime)
                // }else{
                //   const _this=this
                //   setTimeout(()=>{_this.doMulitCelve(celve,side,firstTime),res.response.headers['Retry-After'] ? res.response.headers['Retry-After']: 5000})
                // }
              } else {
                if(res.length){
                  res.forEach(i=>{
                    const message = i.orderQty
                      ? '挂单 ' + i.orderQty + '... ' + '价格 ' + i.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss')
                      : JSON.stringify(i) + moment().format('YYYY-MM-DD HH:mm:ss')
                    celve.actions.unshift(message)
                    console.log(message)
                  })
                }else{
                  celve.actions.unshift(JSON.stringify(res))
                  setTimeout( () => {
                    _this.positionLocks[celve.username[0]]= false
                  },3000)
                  return
                }
                // console.log(res,JSON.stringify(res))
                // this.orderLocks[celve._id] = false
              }
            }catch (e) {
              // this.orderLocks[celve._id] = false
              console.log('挂单错误：',e)
              setTimeout( () => {
                _this.positionLocks[celve.username[0]]= false
              },3000)
              return {error:{message:e}}
            }
          }

          console.timeEnd("挂单");
          //更新策略及日志
          console.time("策略更新")
          try {
            if(firstTime){
              // debugger
              celve.firstTime = false
              celve.updated = false
              celve.buyQt = buyQt
              celve.sellQt = sellQt
            }else if(celve.updated){
              // debugger
              celve.updated = false
              celve.buyQt = buyQt
              celve.sellQt = sellQt
            }else{
              // debugger
              celve.currentPosition = side === 'Buy' ? celve.currentPosition + celve.buyQt : celve.currentPosition - celve.sellQt
              if(celve.isReduce){
                celve.buyQt = buyQt
                celve.sellQt = sellQt
                if (side === 'Buy'){
                  if( celve.currentLevel < 0 - celve.stopLevel ){
                    // debugger
                    celve.reduceTimes += -1
                  }
                }else if (side === 'Sell'){
                  if( celve.currentLevel > celve.stopLevel  ){
                    // debugger
                    celve.reduceTimes += 1
                  }
                }
              }

              const date = moment().format('YYYY-MM-DD')
              if(date === celve.dayTradeTimes[0].date){
                celve.dayTradeTimes[0].times += 1
              }else{
                celve.dayTradeTimes.unshift({
                  date:date,
                  times:1
                })
              }

              celve.currentLevel = side=='Buy' ? celve.currentLevel + 1 : celve.currentLevel - 1
              celve.currentPrice = side=='Buy' ? celve.currentPrice -  celve.levelPrice : celve.currentPrice +  celve.levelPrice
              celve.prePrice =   side=='Buy' ? celve.prePrice -  celve.levelPrice : celve.prePrice +  celve.levelPrice
              celve.nextPrice =   side=='Buy' ? celve.nextPrice -  celve.levelPrice : celve.nextPrice +  celve.levelPrice
              celve.totalTimes += 1
              if(celve.reduceTimes === 3){
                celve.currentLevel = celve.currentLevel - 1
                celve.reduceTimes = 0
              }
              if(celve.reduceTimes === -3){
                celve.currentLevel = celve.currentLevel + 1
                celve.reduceTimes = 0
              }
            }
            delete celve.state
            celve.postType = 'update'
            if (celve.actions.length > 300){
              celve.actions = celve.actions.slice(0,300)
            }
            console.log('更新策略，参数:',celve)
            await postLevelPriceCelve(celve)
            await this.getCelves('running')
            this.positionLocks[celve.username[0]]= false
            // this.lockCelve = false
          } catch (e) {
            // userPosition.locked = false
            setTimeout( () => {
              _this.positionLocks[celve.username[0]]= false
            },3000)
          }
          console.timeEnd("策略更新");
          console.timeEnd()
        },

        async doPcCelve(celve){
          const _this = this
          // console.log('userPosition:',userPosition)
          if(this.positionLocks[celve.username[0]]) {
            // debugger
            console.log('wait createOrder locked! wait!')
            return
          }else{
            this.positionLocks[celve.username[0]]= true
            console.log('挂单锁',this.positionLocks)

            const delRes = await this.delAllOrder(celve)
            if (!delRes.success) {
              setTimeout( () => {
                _this.positionLocks[celve.username[0]]= false
              },3000)
              return
            }

            console.time("挂单")
            console.log('发送开单命令！')
            // debugger
            const params={
            }
            params.postType='closePosition'
            params.username=celve.username[0]
            params.symbol='XBTUSD'
            try{
              console.log('开单参数：',JSON.stringify(params))
              const res = await postOrders(params)
              // this.orderLocks[celve._id] = false
              if (res.error) {
                celve.actions.unshift(res.error)
                setTimeout( () => {
                  _this.positionLocks[celve.username[0]]= false
                },3000)
                return
                // if(res.response.headers['x-ratelimit-remaining'] && res.response.headers['x-ratelimit-remaining']>10){
                //   this.doMulitCelve(celve,side,firstTime)
                // }else{
                //   const _this=this
                //   setTimeout(()=>{_this.doMulitCelve(celve,side,firstTime),res.response.headers['Retry-After'] ? res.response.headers['Retry-After']: 5000})
                // }
              } else {
                if(res.orderID){
                    const message = '止损平仓...'+ ' 时间: ' + moment().format('YYYY-MM-DD HH:mm:ss')
                    celve.actions.unshift(message)
                    console.log(message)
                }else{
                  celve.actions.unshift(JSON.stringify(res))
                  setTimeout( () => {
                    _this.positionLocks[celve.username[0]]= false
                  },3000)
                  return
                }
              }
            }catch (e) {
              console.log('挂单错误：',e)
              setTimeout( () => {
                _this.positionLocks[celve.username[0]]= false
              },3000)
              return {error:{message:e}}
            }
          }
          console.timeEnd("挂单");
          //更新策略及日志

          console.time("策略更新")
          try {
            celve.postType = 'update'
            console.log('更新策略，参数:',celve)
            await postLevelPriceCelve(celve)
            this.stopCelve(celve)
            _this.positionLocks[celve.username[0]]= false
            // this.lockCelve = false
          } catch (e) {
            // userPosition.locked = false
            this.stopCelve(celve)
            _this.positionLocks[celve.username[0]]= false
          }
          console.timeEnd("策略更新");
          console.timeEnd()
        },
        async doPartpcCelve({celve,side,qt,currentPositionChange}){
          // debugger
          const _this = this
          // console.log('userPosition:',userPosition)
          if(this.positionLocks[celve.username[0]]) {
            // debugger
            console.log('wait createOrder locked! wait!')
            return
          }else{
            this.positionLocks[celve.username[0]]= true
            console.log('挂单锁',this.positionLocks)

            const delRes = await this.delAllOrder(celve)
            if (!delRes.success) {
              setTimeout( () => {
                _this.positionLocks[celve.username[0]]= false
              },3000)
              return
            }
            console.time("挂单")
            console.log('发送开单命令！')
            // debugger
            const params={
              orders:[]
            }
              params.orders.push({
                username:celve.username[0],
                symbol:'XBTUSD',
                // side:celve.side,
                side:side ,
                orderQty:qt,
                price: side=='Buy' ? (celve.currentPrice + celve.levelPrice):(celve.currentPrice - celve.levelPrice ) ,
                ordType:'Limit',
                clOrdID:celve._id + celve.currentLevel + moment().format('HHmmss')
              })
            params.postType='create mulit'
            params.username=celve.username[0]
            try{
              console.log('开单参数：',JSON.stringify(params))
              const res = await postOrders(params)
              // this.orderLocks[celve._id] = false
              if (res.error) {
                celve.actions.unshift(res.error)
                setTimeout( () => {
                  _this.positionLocks[celve.username[0]]= false
                },3000)
                return
                // if(res.response.headers['x-ratelimit-remaining'] && res.response.headers['x-ratelimit-remaining']>10){
                //   this.doMulitCelve(celve,side,firstTime)
                // }else{
                //   const _this=this
                //   setTimeout(()=>{_this.doMulitCelve(celve,side,firstTime),res.response.headers['Retry-After'] ? res.response.headers['Retry-After']: 5000})
                // }
              } else {
                if(res.length){
                  res.forEach(i=>{
                    const message = i.orderQty
                      ? '挂单 ' + i.orderQty + '... ' + '价格 ' + i.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss')
                      : JSON.stringify(i) + moment().format('YYYY-MM-DD HH:mm:ss')
                    celve.actions.unshift(message)
                    console.log(message)
                  })
                }else{
                  celve.actions.unshift(JSON.stringify(res))
                  setTimeout( () => {
                    _this.positionLocks[celve.username[0]]= false
                  },3000)
                  return
                }
              }
            }catch (e) {
              console.log('挂单错误：',e)
              setTimeout( () => {
                _this.positionLocks[celve.username[0]]= false
              },3000)
              return {error:{message:e}}
            }
          }
          console.timeEnd("挂单");
          //更新策略及日志
          console.time("策略更新")
          try {
            if(currentPositionChange){
              celve.currentPosition = side === 'Buy' ? celve.currentPosition + qt : celve.currentPosition - qt
            }
            celve.firstTime = true
            delete celve.state
            celve.postType = 'update'
            console.log('更新策略，参数:',celve)
            await postLevelPriceCelve(celve)
            await this.getCelves('running')
            _this.positionLocks[celve.username[0]]= false
            // this.lockCelve = false
          } catch (e) {
            // userPosition.locked = false
            _this.positionLocks[celve.username[0]]= false
          }
          console.timeEnd("策略更新");
          console.timeEnd()
        }
      }
    }
</script>

<style scoped>

</style>
