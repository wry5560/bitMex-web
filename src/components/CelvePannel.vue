<template>
  <a-card  :headStyle="headStyle" :bodyStyle="bodyStyle">
    <div slot="title">
<!--      <div style="display: inline-block">策略操作面板 ( 策略A )</div>-->
      <div style="display: inline-block">策略操作面板</div>
<!--      <div style="float:right">-->
<!--        <a @click="()=>{this.$router.push({ name: 'CelveB' })}">前往策略B</a>-->
<!--      </div>-->
    </div>
    <div class="celve">
      <template v-if="currentCelve && currentCelve.state === true && !isEdit">
        <a-row style="padding: 12px 24px;padding-bottom: 4px" :gutter="16">
          <a-col :lg="24"><a-button  style="width:100%" @click="stop">停止策略</a-button></a-col>
<!--          <a-col :lg="12"><a-button style="width:100%"  type="primary" @click="toEdit">修改策略</a-button></a-col>-->
        </a-row>
        <a-row style="padding: 8px 24px;" :gutter="48">
          <a-col :lg="12"><b>运行参数：</b></a-col>
          <a-col :lg="12"><div style="float: right"><b>{{levelStopType}}</b></div></a-col>
        </a-row>
        <a-row style="padding: 0 24px;" :gutter="48">
          <a-col :lg="12">
            起始价格：<div style="float: right"><b>{{this.currentCelve.startPrice}}</b></div>
          </a-col>
          <a-col :lg="12">
            每层仓位：<div style="float: right"><b>{{this.currentCelve.qt}}</b></div>
          </a-col>
          <a-col :lg="12">
            下一级开单价：<div style="float: right"><b>{{this.currentCelve.nextPrice}}</b></div>
          </a-col>
          <a-col :lg="12">
            当前层级：<div style="float: right"><b>{{this.currentCelve.currentLevel}}</b></div>
          </a-col>
          <a-col :lg="12">
            层级价差：<div style="float: right"><b>{{this.currentCelve.levelPrice}}</b></div>
          </a-col>
          <a-col :lg="12">
            总层级：<div style="float: right"><b>{{this.currentCelve.level}}</b></div>
          </a-col>
          <a-col :lg="12" >
            减仓层级：<div style="float: right"><b>{{this.currentCelve.stopLevel}}</b></div>
          </a-col>
          <a-col :lg="12">
            总成交次数：<div style="float: right"><b>{{this.currentCelve.totalTimes}}</b></div>
          </a-col>
        </a-row>
        <div style="padding: 8px 24px;"><b>运行日志：</b></div>
        <div style="padding: 0 24px;height: 190px;overflow: auto" ref="log">
          <div v-for="(item,index) in currentCelve.actions" :key="index">{{item}}</div>
        </div>
      </template>
      <template v-else>
      <a-form  :form="form" >
          <a-row style="padding-top:12px" >
<!--            <a-col :lg="6" style="text-align: center">-->
<!--              平仓策略：-->
<!--            </a-col>-->
            <a-col :lg="24" style="text-align: center">
                            <a-form-item>
                              <template>
                                <a-radio-group name="radioGroup1"
                                               v-decorator="['levelStopType',{initialValue:currentCelve ? currentCelve.levelStopType : 'reduce'}]"
                                               @change="levelStopTypeChange"
                                               :disabled="isEdit">
                                  <a-radio value="normal">普通模式</a-radio>
                                  <a-radio value="reduce">减仓模式</a-radio>
                                  <a-radio value="stop">平仓模式</a-radio>
                                </a-radio-group>
                              </template>
                            </a-form-item>
            </a-col>
<!--            <a-col :lg="12" style="text-align: center">-->
<!--              <a-form-item>-->
            <!--                <template>-->
            <!--                  <a-radio-group name="radioGroup1"-->
            <!--                                 v-decorator="['type',{initialValue:currentCelve ? currentCelve.type : 'Limit'}]"-->
            <!--                                 @change="changeType"-->
            <!--                                 :disabled="isEdit">-->
            <!--                    <a-radio value="Limit">限价单</a-radio>-->
            <!--                    <a-radio value="Market">市价单</a-radio>-->
            <!--                  </a-radio-group>-->
            <!--                </template>-->
<!--              </a-form-item>-->
<!--            </a-col>-->
<!--            <a-col :lg="12" style="text-align: center" >-->
<!--              <a-form-item>-->
<!--              <template>-->
<!--                <a-radio-group name="radioGroup2"-->
<!--                               v-decorator="['side',{initialValue:currentCelve ? currentCelve.side : 'Buy'}]"-->
<!--                               :disabled="isEdit">-->
<!--                  <a-radio value="Buy">多单</a-radio>-->
<!--                  <a-radio value="Sell">空单</a-radio>-->
<!--                </a-radio-group>-->
<!--              </template>-->
<!--              </a-form-item>-->
<!--            </a-col>-->
          </a-row>
          <a-row style="padding: 0px 24px" >
            <a-col :lg="24">
              <a-form-item label="开仓价格" :labelCol="{ span: 7 }" :wrapperCol="{ span: 17 }">
                <a-input-number
                  placeholder="请输入开仓价格"
                  :min="1"
                  v-decorator="['startPrice',{rules: [{ required: true, message: '请输入开仓价格',type:'number'}],initialValue:currentCelve ? currentCelve.startPrice : 1}]"
                  style="width:100%"
                  :disabled="type==='Market' || isEdit"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="24">
              <a-form-item label="仓位" :labelCol="{ span: 7 }" :wrapperCol="{ span: 17 }">
                <a-input-number
                  placeholder="请输入仓位"
                  :min="1"
                  v-decorator="['qt',{rules: [{ required: true, message: '请输入仓位',type:'number'}],initialValue:currentCelve ? currentCelve.qt : 1}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="24">
              <a-form-item label="开单层级" :labelCol="{ span: 7 }" :wrapperCol="{ span: 17 }">
                <a-input-number
                  placeholder="请输入开单层级"
                  :min="1"
                  :precision="0"
                  v-decorator="['level',{rules: [{ required: true, message: '请输入开单层级',type:'number'}],initialValue:currentCelve ? currentCelve.level : 1}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="24" v-if="levelStopTypeValue === 'reduce'">
              <a-form-item label="减仓层级" :labelCol="{ span: 7 }" :wrapperCol="{ span: 17 }">
                <a-input-number
                  placeholder="请输入减仓层级"
                  :min="0"
                  :precision="0"
                  v-decorator="['stopLevel',{rules: [{ required: true, message: '请输入减仓层级',type:'number'}],initialValue:currentCelve ? currentCelve.stopLevel : 0}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="24">
              <a-form-item label="层级价差" :labelCol="{ span: 7 }" :wrapperCol="{ span: 17 }">
                <a-input-number
                  placeholder="请输入层级价差"
                  :min="1"
                  v-decorator="['levelPrice',{rules: [{ required: true, message: '请输入层级价差',type:'number'}],initialValue:currentCelve ? currentCelve.levelPrice : 1}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
      </a-form>
      <a-row style="padding: 12px 24px">
        <a-button v-if="!currentCelve" type="primary" style="width:100%" @click="start">开始策略</a-button>
        <a-row v-if="currentCelve && currentCelve.state === true && isEdit " :gutter="16">
          <a-col :lg="12"><a-button  style="width:100%" @click="cancelEdit">取 消</a-button></a-col>
          <a-col :lg="12"><a-button style="width:100%"  type="primary" @click="updateCelve">保存修改</a-button></a-col>
        </a-row>
      </a-row>
      </template>
    </div>
  </a-card>
</template>

<script>
export default {
  name: 'CelvePannel',
  props: {
    runState: Boolean,
    celves: Array,
    user: Object
  },
  data () {
    return {
      form: this.$form.createForm(this),
      isEdit: false,
      type: 1,
      levelStopTypeValue: 'reduce',
      side: 1,
      isRun: 0,
      bodyStyle: {
        height: '400px',
        padding: 0
      },
      headStyle: {
        'text-align': 'left'
      }
    }
  },
  computed: {
    currentCelve () {
      for (let i = 0; i < this.celves.length; i++) {
        const index = this.celves[i].username.findIndex(i => i === this.user.userName)
        if (index > -1) {
          return this.celves[i]
        }
      }
      return null
    },
    levelStopType () {
      let value = ''
      switch (this.currentCelve.levelStopType) {
        case 'normal':
          value = '普通模式'
          break
        case 'reduce':
          value = '减仓模式'
          break
        case 'stop':
          value = '平仓模式'
          break
      }
      return value
    }
  },

  methods: {
    changeType (e) {
      this.type = e.target.value
    },
    levelStopTypeChange (e) {
      this.levelStopTypeValue = e.target.value
    },
    start () {
      this.form.validateFields((err, values) => {
        if (!err) {
          this.$emit('insert', values)
        }
      })
    },
    stop () {
      this.$emit('stop', this.currentCelve)
    },
    toEdit () {
      this.isEdit = true
    },
    updateCelve () {
      this.form.validateFields((err, values) => {
        if (!err) {
          const data = {
            ...this.currentCelve,
            ...values
          }
          this.$emit('update', data)
          this.isEdit = false
        }
      })
    },
    cancelEdit () {
      this.isEdit = false
    }
  }
}
</script>

<style lang="scss" scoped>
.celve{
  .ant-form-item{
    margin-bottom: 14px;
  }
}
</style>
