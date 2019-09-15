<template>
    <div>
      <a-card :headStyle="headStyle" :bodyStyle="bodyStyle">
        <div slot="title">
          <div style="display: inline-block">用户面板</div>
          <div style="float:right">
            <a href="https://www.bitmex.com/register/ZgtBTj" target="_blank">注册链接</a>
          </div>
        </div>
        <span style="display: inline-block;width: 120px;height: 400px;">
          <a-menu style="height:100%;border-top: 1px solid #eaeaea;overflow: auto" v-model="selUser" @select="selsectUser">
            <a-menu-item v-for="item in users" :key="item._id" >{{item.userName}}</a-menu-item>
          </a-menu>
        </span>
        <span style="display: inline-block;width: calc(100% - 120px);height: 400px;float: right">
          <template>
            <a-tabs :animated="false">
              <a-tab-pane tab="账户信息" key="1">
                <a-row class="even-rows wapper">
                    <a-col :lg="12"><b>钱包余额:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.walletBalance/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="wapper">
                  <a-col :lg="12"><b>未实现盈亏:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.unrealisedPnl/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="even-rows wapper">
                  <a-col :lg="12"><b>已实现盈亏:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.realisedPnl/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class=" wapper">
                  <a-col :lg="12"><b>保证金余额:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.marginBalance/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="even-rows wapper">
                  <a-col :lg="12"><b>仓位保证金:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.maintMargin/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="wapper">
                  <a-col :lg="12"><b>委托保证金:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.initMargin/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="even-rows wapper">
                  <a-col :lg="12"><b>可用余额:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.availableMargin/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>

                <a-row class="wapper" style="margin-top: 8px">
                  <a-col :lg="24">
                    <span><b>当前持仓:</b></span>
                    <div style="float: right" :class="positionClass"><b>{{currentPosition.length >0 ? currentPosition[0].currentQty : '0'}}</b></div>
                  </a-col>
                  <!--<a-col :lg="12">-->
                    <!--<div style="text-align: left">-->

                    <!--</div>-->
                  <!--</a-col>-->
                </a-row>
                <a-row class="wapper":gutter="16">
                  <a-col :lg="4">
                    <b>开单仓位:</b>
                  </a-col>
                  <a-col :lg="8">
                      <a-input size="small" placeholder="请输入开单仓位" v-model="position"/>
                  </a-col>
                  <a-col :lg="4">
                    <b>开单限价:</b>
                  </a-col>
                  <a-col :lg="8">
                    <div>
                      <a-input size="small" placeholder="请输入开单限价" v-model="price"/>
                    </div>
                  </a-col>
                  <a-col :lg="24" style="text-align: right;margin-top: 12px">
                    <a-button type="primary"size="small" style="margin-right: 8px" @click="buy">买入</a-button>
                    <a-button size="small"  style="margin-right: 8px"@click="sell">卖出</a-button>
                    <a-button size="small" @click="pc">市价平仓</a-button>
                  </a-col>
                </a-row>
              </a-tab-pane>
              <a-tab-pane tab="充提币记录" key="2">
                <a-row style="padding: 0 16px">
                  <a-col :lg="6"><div style="text-align: left;font-weight: bold;">时间</div></a-col>
                  <a-col :lg="4" ><div class="title">类型</div></a-col>
                  <a-col :lg="4" class="title">金额</a-col>
                  <a-col :lg="3" class="title">地址</a-col>
                  <a-col :lg="3" class="title">状态</a-col>
                  <a-col :lg="4" class="title">钱包余额</a-col>
                </a-row>
                <div style="height: 320px;overflow: auto">
                  <a-row style="padding: 4px 16px" v-for="(item,index) in walletHistory" :key="item.transactID+item.amount" :class="rowClass(item,index)">
                  <a-col :lg="6"><div style="text-align: left;font-weight: bold;">{{item.timestamp ?moment(item.timestamp).format('YYYY-MM-DD HH:mm:ss'):'--' }}</div></a-col>
                  <a-col :lg="4" ><div class="content">{{item.transactType}}</div></a-col>
                  <a-col :lg="4" class="content">{{(item.amount/100000000).toFixed(8).toLocaleString()}}</a-col>
                  <a-col :lg="3" class="content">{{item.address}}</a-col>
                  <a-col :lg="3" class="content">{{item.transactStatus}}</a-col>
                  <a-col :lg="4" class="content">{{(item.walletBalance/100000000).toFixed(8)}}</a-col>
                </a-row>
                </div>
              </a-tab-pane>
              <!--<a-tab-pane tab="委托历史" key="3">Content of tab 3</a-tab-pane>-->
            </a-tabs>
          </template>
        </span>
      </a-card>
    </div>
</template>

<script>

import moment from 'moment'
import 'moment/locale/zh-cn'

export default {
  name: 'userPannel',
  props: {
    users: Array,
    marginData: Object,
    walletHistory: Array,
    currentPosition:Array,
  },
  data () {
    return {
      position:null,
      price:null,
      bodyStyle: {
        height: '400px',
        padding: 0,
        'text-align': 'left'
      },
      headStyle: {
        'text-align': 'left'
      },
      selUser: []
    }
  },
  computed: {
    currentUser () {
      if (this.selUser[0]) {
        // debugger
        const user = this.users.find(user => user._id == this.selUser[0])
        return user
      } else {
        return { email: '' }
      }
    },
    positionClass() {
      if (this.currentPosition.length == 0) {
        return
      }
      if(this.currentPosition[0].currentQty > 0){
        return 'green'
      }else {
        return 'red'
      }
    }
  },
  methods: {
    moment,
    selsectUser ({ key }) {
      console.log(key)
      this.$emit('select', key)
    },
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
    buy(){
      this.$emit('createPosition',['XBTUSD',this.price,this.position,'Buy'])
      this.$info({
        title:'买入指令已发送，等待交易所执行！'
      })
    },
    sell(){
      this.$emit('createPosition',['XBTUSD',this.price,this.position,'Sell'])
      this.$info({
        title:'卖出指令已发送，等待交易所执行！'
      })
    },
    pc(){
      this.$emit('closePosition',['XBTUSD'])
      this.$info({
        title:'平仓指令已发送，等待交易所执行！'
      })
    }
  },
  watch: {
    users (value) {
      this.selUser[0] = value[0]._id
      this.selsectUser({ key: value[0]._id })
    }
  }

}
</script>

<style scoped>
.wapper{
  padding:4px 24px
}
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
