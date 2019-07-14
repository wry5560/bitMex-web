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
              <a-tab-pane tab="钱包" key="1">Content of tab 1</a-tab-pane>
              <a-tab-pane tab="交易历史" key="2">Content of tab 2</a-tab-pane>
              <a-tab-pane tab="委托历史" key="3">Content of tab 3</a-tab-pane>
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
    users:Array
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

</style>
