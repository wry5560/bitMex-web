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

  import {settings} from '../../config/dev-setting'
  const {isTest} = settings

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
                {title:'触发挂单价',align:'center',key:'prePrice',dataIndex:'prePrice',},
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
            if(item.firstTime){
              this.doMulitCelve(item,null,true)
            }else{
              if(currentPrice >= item.prePrice + item.offset && item.currentLevel > (-1 - item.level) ){
                this.doMulitCelve(item,'Sell')
              }else if(currentPrice <= item.nextPrice - item.offset && item.currentLevel < item.level + 1 ){
                this.doMulitCelve(item,'Buy')
              }
            }


            // if(item.side === 'Buy'){
            //   if(currentPrice <= item.prePrice - item.offset && item.currentLevel < item.level + 1){
            //     this.doCelve(item,'Buy',false)
            //   }else if(currentPrice >= item.preStopPrice + item.offset && item.currentLevel > 2){
            //     this.doCelve(item,'Buy',true)
            //   }
            // }else if(item.side === 'Sell'){
            //   if(currentPrice >= item.prePrice + item.offset && item.currentLevel < item.level + 1){
            //     this.doCelve(item,'Sell',false)
            //   }else if(currentPrice <= item.preStopPrice + item.offset && item.currentLevel > 2){
            //     this.doCelve(item,'Sell',true)
            //   }
            // }
          })
        },
        async createOrder(celve,isPc,firstTime){
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
        async doCelve(item,side,isPc,firstTime){

          //策略锁，防止重复下单
          if (this.lockCelve) {
            console.log('celve locked!')
            return
          }
          console.time()
          this.lockCelve = true

          // if(isPc){
          //   console.log('触发止盈!止盈价格：' + this.currentPrice + '... ' + '触发价:' + item.preStopPrice + '... ' + 'nextPrice:' + item.nextPrice + '... ' + 'nextLevel:' + item.nextLevel)
          // }else{
          //   console.log('触发开单!开单价格：' + this.currentPrice + '... ' + '触发价:' + item.prePrice + '... ' + 'nextPrice:' + item.nextPrice + '... ' + 'nextLevel:' + item.nextLevel)
          // }

          //将所有挂单撤销，以免重复挂单
          console.time("delete");
          // if(item.currentLevel > 1){
          if(!firstTime){
            try{
              console.log('撤单执行！')
              const delRes = await this.delAllOrder(item)
              if(delRes.error){
                console.log('撤单错误：',delRes.error.message)
                return
              }
              console.log('已发送撤单命令：',delRes)
            }catch (e) {
              console.log('撤单错误：',e)
            }
          }
          // }
          console.timeEnd("delete");

          //挂单,当前挂单层级已达到设置层级数时，则不执行

          console.time("挂单")
          if(item.currentLevel < item.level){
            try{
              const res = await this.createOrder(item,isPc,firstTime)
              if (res === 'wait') {
                console.log('createOrder locked! wait!')
                return
              } else {
                if (res.error) {
                  item.actions.unshift(res.error.message)
                } else {
                  const message = res.orderQty
                    ? '挂单 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss')
                    : JSON.stringify(res) + moment().format('YYYY-MM-DD HH:mm:ss')
                  item.actions.unshift(message)
                  console.log(message)
                  this.orderLocks[item._id] = false
                }
              }
            }catch (e) {
              console.log('挂单错误：',e)
            }
          }
          console.timeEnd("挂单");

          //挂止盈单,当前挂单层级不满2时，则不执行
          // console.time("挂止盈单")
          console.time("挂空单")
          if(item.currentLevel > 0 - item.level){
            try{
              const res = await this.pcOrder(item,isPc,firstTime)
              if (res === 'wait') {
                console.log('pcOrder locked! wait!')
                return
              } else {
                if (res.error) {
                  item.actions.unshift(res.error.message)
                } else {
                  const message = res.orderQty
                    // ? '挂止盈单 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss')
                    ? '挂空单 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss')
                    : JSON.stringify(res) + moment().format('YYYY-MM-DD HH:mm:ss')
                  item.actions.unshift(message)
                  console.log(message)
                  this.orderLocks[item._id] = false
                }
              }
            }catch (e) {
              // console.log('挂止盈单错误：',e)
              console.log('挂空单错误：',e)
            }
          }
          // console.timeEnd("止盈");
          console.timeEnd("挂空单");

          //更新策略及日志
          console.time("策略更新")
          try {
            if(firstTime){
              item.firstTime = false
            }else{
              item.currentLevel =  isPc ? item.currentLevel + 1 : item.currentLevel - 1
              item.currentPrice =isPc ? item.currentPrice -  item.levelPrice : item.currentPrice +  item.levelPrice
              item.prePrice =  isPc ? item.prePrice -  item.levelPrice : item.prePrice +  item.levelPrice
              item.nextPrice =  isPc ? item.nextPrice -  item.levelPrice : item.nextPrice +  item.levelPrice
            }
            // item.preLevel = isPc ? item.preLevel-2 : item.preLevel +1
            // 不是原来的代码item.currentLevel =  isPc ? item.currentLevel + 1 : item.currentLevel - 1
            // item.nextLevel = isPc ? item.nextLevel - 2 : item.nextLevel + 1

            // if(isPc){
              // item.currentPrice = side==='Buy'  ? item.currentPrice + 2 * item.levelPrice : item.currentPrice - 2 * item.levelPrice
              // item.prePrice = side==='Buy' ? item.prePrice + 2 * item.levelPrice : item.prePrice - 2 * item.levelPrice
              // item.nextPrice = side==='Buy'  ? item.nextPrice + 2 * item.levelPrice : item.nextPrice - 2 * item.levelPrice
              // item.stopPrice = side==='Buy'  ? item.stopPrice + 2 * item.levelPrice : item.stopPrice - 2 * item.levelPrice
              // item.preStopPrice = side==='Buy'  ? item.preStopPrice + 2 * item.levelPrice : item.preStopPrice - 2 * item.levelPrice
            // }else{
              // item.currentPrice = side==='Buy'  ? item.currentPrice - item.levelPrice : item.currentPrice + item.levelPrice
              // item.prePrice = side==='Buy' ? item.prePrice - item.levelPrice : item.prePrice + item.levelPrice
              // item.nextPrice = side==='Buy'  ? item.nextPrice - item.levelPrice : item.nextPrice + item.levelPrice
              // item.stopPrice = side==='Buy'  ? item.stopPrice - item.levelPrice : item.stopPrice + item.levelPrice
              // item.preStopPrice = side==='Buy'  ? item.preStopPrice - item.levelPrice : item.preStopPrice + item.levelPrice
            // }
            item.postType = 'update'
            console.log('更新策略，参数:',item)
            await postLevelPriceCelve(item)
            await this.getCelves('running')
            this.orderLocks[item._id] = false
            this.lockCelve = false
          } catch (e) {
            this.orderLocks[item._id] = false
            console.log(e)
          }
          console.timeEnd("策略更新");
          console.timeEnd()
        },
        async doMulitCelve(item,side,firstTime){
          //策略锁，防止重复下单
          if (this.lockCelve) {
            console.log('celve locked!')
            return
          }
          console.time()
          this.lockCelve = true
          //将所有挂单撤销，以免重复挂单
          console.time("delete");
          // if(item.currentLevel > 1){
          if(!firstTime){
            try{
              console.log('撤单执行！')
              const delRes = await this.delAllOrder(item)
              if(delRes.error){
                console.log('撤单错误：',delRes.error.message)
                return
              }
              console.log('已发送撤单命令：',delRes)
            }catch (e) {
              console.log('撤单错误：',e)
            }
          }
          // }
          console.timeEnd("delete");
          console.time("挂单")

          if(this.orderLocks[item._id]) {
            // debugger
            return 'wait createOrder locked! wait!'
          }else{
            console.log('发送开单命令！')
            // debugger
            this.orderLocks[item._id] = true
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
            params.postType='create mulit'
            params.username=item.username[0]
            try{
              console.log('开单参数：',JSON.stringify(params))
              const res = await postOrders(params)
              // this.orderLocks[celve._id] = false
              if (res.error) {
                item.actions.unshift(res.error.message)
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
                }
                // console.log(res,JSON.stringify(res))
                this.orderLocks[item._id] = false
              }
            }catch (e) {
              // this.orderLocks[celve._id] = false
              console.log('挂单错误：',e)
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
            item.postType = 'update'
            console.log('更新策略，参数:',item)
            await postLevelPriceCelve(item)
            await this.getCelves('running')
            this.orderLocks[item._id] = false
            this.lockCelve = false
          } catch (e) {
            this.orderLocks[item._id] = false
            console.log(e)
          }
          console.timeEnd("策略更新");
          console.timeEnd()
        }
      }
    }
</script>

<style scoped>

</style>
