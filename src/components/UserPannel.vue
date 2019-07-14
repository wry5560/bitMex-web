<template>
    <div>
      <a-card title="用户面板" :headStyle="headStyle" :bodyStyle="bodyStyle">
        <span style="display: inline-block;width: 120px;height: 400px;">
          <a-menu style="height:100%;border-top: 1px solid #eaeaea" v-model="selUser" @select="selsectUser">
            <a-menu-item v-for="item in users" :key="item.id" >{{item.userName}}</a-menu-item>
          </a-menu>
        </span>
        <span style="display: inline-block;width: calc(100% - 120px);height: 400px;float: right">
          <template>
            <a-tabs>
              <a-tab-pane tab="账户余额" key="1">
                <a-row class="even-rows wapper">
                    <a-col :lg="12"><b>钱包余额:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.walletBalance/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="wapper">
                  <a-col :lg="12"><b>未实现盈亏:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.unrealisedPnl/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="even-rows wapper">
                  <a-col :lg="12"><b>保证金余额:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.marginBalance/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="wapper">
                  <a-col :lg="12"><b>仓位保证金:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.maintMargin/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="even-rows wapper">
                  <a-col :lg="12"><b>委托保证金:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.initMargin/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
                <a-row class="wapper">
                  <a-col :lg="12"><b>可用余额:</b></a-col>
                  <a-col :lg="12" style="text-align: right"><b>{{(marginData.availableMargin/100000000).toFixed(6).slice(0,-2)}}</b></a-col>
                </a-row>
              </a-tab-pane>
              <a-tab-pane tab="充提币记录" key="2">正在开发中...</a-tab-pane>
              <!--<a-tab-pane tab="委托历史" key="3">Content of tab 3</a-tab-pane>-->
            </a-tabs>
          </template>
        </span>
      </a-card>
    </div>
</template>

<script>
export default {
  name: 'userPannel',
  props:{
    users:Array,
    marginData:Object,

  },
  data () {
    return {
      bodyStyle: {
        height: '400px',
        padding: 0,
        'text-align': 'left'
      },
      headStyle: {
        'text-align': 'left'
      },
      selUser:[]
    }
  },
  computed:{
    currentUser(){
      if(this.selUser[0]){
        // debugger
        const user = this.users.find(user=>user.id == this.selUser[0])
        return user
      }else{
        return {email:''}
      }
    }
  },
  methods:{
    selsectUser({key}){
      console.log(key)
      this.$emit('select',key)
    }
  },
  watch:{
    users(value){
      this.selUser[0]=value[0].id
      this.selsectUser({key:value[0].id})
    }
  }

}
</script>

<style scoped>
.wapper{
  padding:4px 24px
}
</style>
