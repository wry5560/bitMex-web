<template>
  <a-card  :headStyle="headStyle" :bodyStyle="bodyStyle">
    <div slot="title">
<!--      <div style="display: inline-block">策略操作面板 ( 策略A )</div>-->
      <div style="display: inline-block">策略操作面板</div>
      <div style="float:right">
<!--        <a @click="()=>{this.$router.push({ name: 'CelveB' })}">前往策略B</a>-->
<!--        <a href="/#/celveB/" target="_blank">前往策略B</a>-->
      </div>
    </div>
    <div class="celve">
      <template v-if="currentCelve && currentCelve.state === true && !isEdit">
        <a-row style="padding: 12px 24px;padding-bottom: 4px" :gutter="16">
          <a-col :lg="12"><a-button  style="width:100%" @click="stop">停止策略</a-button></a-col>
          <a-col :lg="12"><a-button style="width:100%"  type="primary" @click="toEdit">修改策略</a-button></a-col>

        </a-row>
        <a-row style="padding: 8px 24px;" :gutter="48">
          <a-col :lg="12"><b>运行参数：</b></a-col>
          <a-col :lg="12"><div style="float: right"><b>{{levelStopType + ' '+  ' '+ sideString}}</b></div></a-col>
        </a-row>
        <a-row style="padding: 0 24px;" :gutter="48">
          <a-col :lg="12">
            起始价格：<div style="float: right"><b>{{this.currentCelve.startPrice}}</b></div>
          </a-col>
          <a-col :lg="12">
            每层仓位：<div style="float: right"><b>{{this.currentCelve.qt}}</b></div>
          </a-col>
<!--          <a-col :lg="12">-->
<!--            下一级开单价：<div style="float: right"><b>{{this.currentCelve.nextPrice}}</b></div>-->
<!--          </a-col>-->
          <a-col :lg="12">
            总层级：<div style="float: right"><b>{{this.currentCelve.level}}</b></div>
          </a-col>
          <a-col :lg="12">
            当前层级：<div style="float: right"><b>{{this.currentCelve.currentLevel}}</b></div>
          </a-col>
          <a-col :lg="12">
            层级价差：<div style="float: right"><b>{{this.currentCelve.levelPrice}}</b></div>
          </a-col>
          <a-col :lg="12" v-if="currentCelve.isReduce">
            减仓层级：<div style="float: right"><b>{{this.currentCelve.stopLevel}}</b></div>
          </a-col>
          <a-col :lg="12" v-if="currentCelve.autoStop">
            自动关闭层级：<div style="float: right"><b>{{this.currentCelve.autoStopLevel}}</b></div>
          </a-col>
          <template  v-if="currentCelve.levelStopType === 'stop'">
            <a-col :lg="12">
              向上平仓价：<div style="float: right"><b>{{this.currentCelve.sellStopPrice}}</b></div>
            </a-col>
            <a-col :lg="12">
              向下平仓价：<div style="float: right"><b>{{this.currentCelve.buyStopPrice}}</b></div>
            </a-col>
          </template>
          <a-col :lg="12">
            策略启动时间：<div style="float: right"><b>{{this.currentCelve.startTime}}</b></div>
          </a-col>
        </a-row>
        <a-row :gutter="8">
          <a-col :lg="14">
            <div style="padding: 8px 24px;padding-right: 0"><b>运行日志：</b></div>
            <div style="padding: 0 24px;padding-right: 0;width:98%; height:170px;overflow: auto" ref="log">
              <div v-for="(item,index) in currentCelve.actions" :key="index">{{item}}</div>
            </div>
          </a-col>
          <a-col :lg="10">
            <div style="padding: 8px 24px;padding-left: 0"><b>成交统计：</b></div>
            <div style="padding: 0 24px;width:98%;padding-left: 0; height:170px;overflow: auto" >
              <div>总成交次数：<div style="float: right"><b>{{this.currentCelve.totalTimes}}</b></div></div>
              <div v-for="(item,index) in currentCelve.dayTradeTimes" :key="index">
                {{item.date}}：<div style="float: right"><b>{{item.times}}</b></div>
              </div>
            </div>
          </a-col>
        </a-row>
      </template>
      <template v-else>
      <a-form  :form="form" >
          <a-row style=" padding: 0px 12px; padding-top:12px" >
<!--            <a-col :lg="6" style="text-align: center">-->
<!--              平仓策略：-->
<!--            </a-col>-->
            <a-col :lg="12" style="text-align: center">
              <a-form-item>
                <template>
                  <a-radio-group name="radioGroup1"
                                 v-decorator="['levelStopType',{initialValue:currentCelve ? currentCelve.levelStopType : levelStopTypeValue}]"
                                 @change="levelStopTypeChange"
                                >
                    <a-radio value="normal">普通模式</a-radio>
<!--                                  <a-radio value="reduce">减仓模式</a-radio>-->
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
            <a-col :lg="12" style="text-align: center" >
              <a-form-item >
              <template>
                <a-radio-group name="radioGroup2"
                               v-decorator="['side',{initialValue:currentCelve ? currentCelve.side : 'Both'}]"
                               :disabled="isEdit">
                  <a-radio value="Both">双向挂单</a-radio>
                  <a-radio value="Buy">单边多</a-radio>
                  <a-radio value="Sell">单边空</a-radio>
                </a-radio-group>
              </template>
              </a-form-item>
            </a-col>
            <a-col :lg="12"  style="text-align: center">
              <a-form-item label="是否减仓"  :labelCol="{ span: 12 }" :wrapperCol="{ span: 12 }">
                <a-switch   v-decorator="['isReduce',{initialValue:currentCelve ? currentCelve.isReduce : isReduce,valuePropName: 'checked'}]"
                            @change='isReduceChange'
                />
              </a-form-item>
            </a-col>
            <a-col :lg="8">
              <a-form-item label="是否自动关闭"  :labelCol="{ span: 12 }" :wrapperCol="{ span: 12 }">
                <a-switch   v-decorator="['autoStop',{initialValue:currentCelve ? currentCelve.autoStop : autoStop,valuePropName: 'checked'}]"
                            @change='autoStopChange'
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row style="padding: 0px 24px" >
            <a-col :lg="12">
              <a-form-item label="基准价格" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                <a-input-number
                  placeholder="请输入基准价格"
                  :min="1"
                  v-decorator="['startPrice',{rules: [{ required: true, message: '请输入基准价格',type:'number'}],initialValue:currentCelve ? currentCelve.startPrice : 1}]"
                  style="width:100%"
                  :disabled="type==='Market' || isEdit"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="12">
              <a-form-item label="仓位" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                <a-input-number
                  placeholder="请输入仓位"
                  :min="1"
                  v-decorator="['qt',{rules: [{ required: true, message: '请输入仓位',type:'number'}],initialValue:currentCelve ? currentCelve.qt : 1}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="12">
              <a-form-item label="底仓" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                <a-input-number
                  placeholder="请输入底仓"
                  v-decorator="['startPosition',{rules: [{ required: true, message: '请输入底仓',type:'number'}],initialValue:currentCelve ? currentCelve.startPosition : 0}]"
                  style="width:100%"
                  :disabled="isEdit"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="12">
              <a-form-item label="开单层级" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                <a-input-number
                  placeholder="请输入开单层级"
                  :min="1"
                  :precision="0"
                  v-decorator="['level',{rules: [{ required: true, message: '请输入开单层级',type:'number'}],initialValue:currentCelve ? currentCelve.level : 1}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>

            <a-col :lg="12">
              <a-form-item label="层级价差" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                <a-input-number
                  placeholder="请输入层级价差"
                  :min="1"
                  v-decorator="['levelPrice',{rules: [{ required: true, message: '请输入层级价差',type:'number'}],initialValue:currentCelve ? currentCelve.levelPrice : 1}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
            <template v-if="levelStopTypeValue==='stop'">
              <a-col :lg="12">
                <a-form-item label="向上平仓价" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                  <a-input-number
                    placeholder="请输入向上平仓价"
                    v-decorator="['sellStopPrice',{rules: [{ required: true, message: '请输入向上平仓价',type:'number'}],initialValue:currentCelve ? currentCelve.sellStopPrice : sellStopPrice}]"
                    style="width:100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :lg="12">
                <a-form-item label="向下平仓价" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                  <a-input-number
                    placeholder="请输入向下平仓价"
                    v-decorator="['buyStopPrice',{rules: [{ required: true, message: '请输入向下平仓价',type:'number'}],initialValue:currentCelve ? currentCelve.buyStopPrice : buyStopPrice}]"
                    style="width:100%"
                  />
                </a-form-item>
              </a-col>
            </template>
            <a-col :lg="12" v-if="isReduce">
              <a-form-item label="减仓层级" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                <a-input-number
                  placeholder="请输入减仓层级"
                  :min="0"
                  :precision="0"
                  v-decorator="['stopLevel',{rules: [{ required: true, message: '请输入减仓层级',type:'number'}],initialValue:currentCelve ? currentCelve.stopLevel : 0 }]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="12" v-if="autoStop">
              <a-form-item label="自动关闭层级" :labelCol="{ span: 8 }" :wrapperCol="{ span: 16 }">
                <a-input-number
                  placeholder="请输入自动关闭层级"
                  :min="0"
                  :precision="0"
                  v-decorator="['autoStopLevel',{rules: [{ required: true, message: '请输入自动关闭层级',type:'number'}],initialValue:currentCelve ? currentCelve.autoStopLevel : 0 }]"
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
import { reqUsers, reqOrders, postOrders, postLevelPriceCelve, getLevelPriceCelve, websocketLog } from '@/api'

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
      levelStopTypeValue: 'normal',
      side: 1,
      isRun: 0,
      isReduce: false,
      sellStopPrice: 1000000,
      buyStopPrice: 0,
      autoStop: false,
      bodyStyle: {
        height: '400px',
        padding: 0,
        'overflow-y': 'auto',
        'overflow-x': 'hidden'
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
    sideString(){
      if(this.currentCelve){
        switch (this.currentCelve.side) {
          case 'Both':
            return ' 双向挂单'
          case 'Buy':
            return ' 只挂多单'
          case 'Sell':
            return ' 只挂空单'
          default:
            return ''
        }
      }
      return ''
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
    // async autoStopChange (checked) {
    //   const values = this.currentCelve
    //   values.autoStop = checked
    //   values.postType = 'update'
    //   try {
    //     await postLevelPriceCelve(values)
    //     return
    //   } catch (e) {
    //     console.log(e)
    //   }
    // },
    isReduceChange (checked) {
      this.isReduce = checked
    },
    autoStopChange (checked) {
      this.autoStop = checked
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
      this.levelStopTypeValue = 'normal'
      this.isReduce = false
      this.autoStop = false
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
    margin-bottom: 8px;
  }
}
</style>
