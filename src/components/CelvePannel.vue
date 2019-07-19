<template>
  <a-card title="策略操作面板" :headStyle="headStyle" :bodyStyle="bodyStyle">
    <div>
      <template v-if="currentCelve && currentCelve.state === true && !isEdit">
        <a-row style="padding: 12px 24px" :gutter="16">
          <a-col :lg="12"><a-button  style="width:100%" @click="stop">停止策略</a-button></a-col>
          <a-col :lg="12"><a-button style="width:100%"  type="primary" @click="toEdit">修改策略</a-button></a-col>
        </a-row>
      </template>
      <template v-else>
      <a-form  :form="form" >
          <a-row style="padding-top:12px">
            <a-col :lg="12" style="text-align: center">
              <a-form-item>
                <template>
                  <a-radio-group name="radioGroup1"
                                 v-decorator="['type',{initialValue:currentCelve ? currentCelve.type : 'Limit'}]"
                                 @change="changeType"
                                 :disabled="isEdit">
                    <a-radio value="Limit">限价单</a-radio>
                    <a-radio value="Market">市价单</a-radio>
                  </a-radio-group>
                </template>
              </a-form-item>
            </a-col>
            <a-col :lg="12" style="text-align: center" >
              <a-form-item>
              <template>
                <a-radio-group name="radioGroup2"
                               v-decorator="['side',{initialValue:currentCelve ? currentCelve.side : 'Buy'}]"
                               :disabled="isEdit">
                  <a-radio value="Buy">多单</a-radio>
                  <a-radio value="Sell">空单</a-radio>
                </a-radio-group>
              </template>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row style="padding: 0px 24px" >
            <a-col :lg="24">
              <a-form-item label="开仓价格" :labelCol="{ span: 6 }" :wrapperCol="{ span: 18 }">
                <a-input-number
                  placeholder="请输入开仓价格"
                  v-decorator="['startPrice',{rules: [{ required: true, message: '请输入开仓价格',type:'number'}],initialValue:currentCelve ? currentCelve.startPrice : null}]"
                  style="width:100%"
                  :disabled="type==='Market' || isEdit"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="24">
              <a-form-item label="仓位" :labelCol="{ span: 6 }" :wrapperCol="{ span: 18 }">
                <a-input-number
                  placeholder="请输入仓位"
                  v-decorator="['qt',{rules: [{ required: true, message: '请输入仓位',type:'number'}],initialValue:currentCelve ? currentCelve.qt : null}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="24">
              <a-form-item label="开单层级" :labelCol="{ span: 6 }" :wrapperCol="{ span: 18 }">
                <a-input-number
                  placeholder="请输入开单层级"
                  v-decorator="['level',{rules: [{ required: true, message: '请输入开单层级',type:'number'}],initialValue:currentCelve ? currentCelve.level : null}]"
                  style="width:100%"
                />
              </a-form-item>
            </a-col>
            <a-col :lg="24">
              <a-form-item label="层级价差" :labelCol="{ span: 6 }" :wrapperCol="{ span: 18 }">
                <a-input-number
                  placeholder="请输入开仓价格"
                  v-decorator="['levelPrice',{rules: [{ required: true, message: '请输入层级价差',type:'number'}],initialValue:currentCelve ? currentCelve.levelPrice : null}]"
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
          <a-col :lg="12"><a-button style="width:100%"  type="primary" @click="toEdit">保存修改</a-button></a-col>
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
    }
  },

  methods: {
    changeType (e) {
      this.type = e.target.value
    },
    start () {
      this.form.validateFields((err, values) => {
        if (!err) {
          this.$emit('insert', values)
        }
      })
    },
    stop () {
      this.$emit('stop', this.currentCelve._id)
    },
    toEdit () {
      this.isEdit = true
    },
    cancelEdit () {
      this.isEdit = false
    }
  }
}
</script>

<style scoped>

</style>
