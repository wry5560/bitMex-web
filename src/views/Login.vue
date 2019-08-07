<template>
  <div class="main">
    <div class="title"><b>自动交易系统 登录</b></div>
    <a-form
      class="user-layout-login"
      ref="formLogin"
      :autoFormCreate="(form)=>{this.form = form}"
      id="formLogin"
    >
      <a-form-item
            fieldDecoratorId="username"
            :fieldDecoratorOptions="{rules: [{ required: true, message: '请输入帐户名' }],initialValue: 'bitmex', validateTrigger: 'change'}"
          >
            <a-input size="large" type="text" placeholder="请输入帐户名">
              <a-icon slot="prefix" type="user" :style="{ color: 'rgba(0,0,0,.25)' }"/>
            </a-input>
          </a-form-item>
      <a-form-item
            v-if="!isUpdate"
            fieldDecoratorId="password"
            :fieldDecoratorOptions="{rules: [{ required: true, message: '请输入密码' }], validateTrigger: 'blur'}"
          >
            <a-input size="large" type="password" autocomplete="false" placeholder="请输入密码">
              <a-icon slot="prefix" type="lock" :style="{ color: 'rgba(0,0,0,.25)' }"/>
            </a-input>
          </a-form-item>
      <a-form-item
            v-if="isUpdate"
            fieldDecoratorId="oldpassword"
            :fieldDecoratorOptions="{rules: [{ required: true, message: '请输入原密码' }], validateTrigger: 'blur'}"
          >
            <a-input size="large" type="password" autocomplete="false" placeholder="请输入原密码">
              <a-icon slot="prefix" type="lock" :style="{ color: 'rgba(0,0,0,.25)' }"/>
            </a-input>
          </a-form-item>
      <a-form-item
            v-if="isUpdate"
            fieldDecoratorId="newpassword"
            :fieldDecoratorOptions="{rules: [{ required: true, message: '请输入新密码' }], validateTrigger: 'blur'}"
          >
            <a-input size="large" type="password" autocomplete="false" placeholder="请输入新密码">
              <a-icon slot="prefix" type="lock" :style="{ color: 'rgba(0,0,0,.25)' }"/>
            </a-input>
          </a-form-item>
      <a-form-item
            v-if="isUpdate"
            fieldDecoratorId="newpassword2"
            :fieldDecoratorOptions="{rules: [{ required: true, message: '请再次输入新密码' }], validateTrigger: 'blur'}"
          >
            <a-input size="large" type="password" autocomplete="false" placeholder="请再次输入新密码">
              <a-icon slot="prefix" type="lock" :style="{ color: 'rgba(0,0,0,.25)' }"/>
            </a-input>
          </a-form-item>
      <a-form-item style="margin-top:24px">
        <a-row :gutter="16">
          <a-col :lg="12">
            <a-button
              size="large"
              type="primary"
              htmlType="submit"
              class="login-button"
              :loading="loginBtn"
              @click.stop.prevent="handleSubmit"
              :disabled="loginBtn"
            >确定</a-button>
          </a-col>
          <a-col :lg="12">
            <a-button
              v-if="!isUpdate"
              size="large"
              htmlType="submit"
              class="login-button"
              :loading="loginBtn"
              @click.stop.prevent="handleUpdate"
              :disabled="loginBtn"
            >修改密码</a-button>
            <a-button
              v-else
              size="large"
              htmlType="submit"
              class="login-button"
              :loading="loginBtn"
              @click.stop.prevent="handleUpdate"
              :disabled="loginBtn"
            >返回登录</a-button>
          </a-col>
        </a-row>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
import md5 from 'md5-node'
import { mapActions } from 'vuex'
import { login, updatePassword } from '@/api'
export default {
  components: {},
  data () {
    return {
      customActiveKey: 'tab1',
      loginBtn: false,
      isUpdate: false,
      // login type: 0 email, 1 username, 2 telephone
      loginType: 0,
      requiredTwoStepCaptcha: false,
      stepCaptchaVisible: false,
      form: null,
      state: {
        time: 60,
        smsSendBtn: false
      },
      formLogin: {
        username: '',
        password: '',
        captcha: '',
        mobile: '',
        rememberMe: true
      }
    }
  },
  created () {
  },
  methods: {
    ...mapActions(['Login', 'Logout']),
    // handler
    handleUsernameOrEmail (rule, value, callback) {
      const regex = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/
      if (regex.test(value)) {
        this.loginType = 0
      } else {
        this.loginType = 1
      }
      callback()
    },

    handleSubmit () {
      const that = this
      let flag = false

      let loginParams = {
      //   remember_me: that.formLogin.rememberMe
      }
      // debugger
      if (this.isUpdate) {
        that.form.validateFields(['username', 'oldpassword', 'newpassword', 'newpassword2'], { force: true }, (err, values) => {
          // debugger
          if (values.newpassword !== values.newpassword2) {
            this.$message.error('新密码输入不一致，请再次输入！')
          }
          if (!err) {
            flag = true
            loginParams.username = values.username
            loginParams.password = md5('bitmex' + values.oldpassword)
            loginParams.newpassword = md5('bitmex' + values.newpassword)
          }
        })
        if (!flag) return

        that.loginBtn = true
        updatePassword(loginParams)
          .then((res) => {
            // debugger
            // that.loginSuccess()
            if (res.success) {
              that.$message.success(res.message)
              this.isUpdate = false
              this.loginBtn = false
            } else {
              that.$message.error(res.message)
              this.loginBtn = false
            }
          })
          .catch(err => {
            // console.log(err)
            that.requestFailed(err)
          })
      } else {
        // 使用账户密码登陆
        that.form.validateFields(['username', 'password'], { force: true }, (err, values) => {
          // debugger
          if (!err) {
            flag = true
            loginParams.username = values.username
            loginParams.password = md5('bitmex' + values.password)
          }
        })

        if (!flag) return

        that.loginBtn = true

        login(loginParams)
          .then((res) => {
            // debugger
            // that.loginSuccess()
            if (res.success) {
              that.$store.commit('INIT_USER', res.user)
              that.loginSuccess()
            } else {
              that.$message.error(res.message)
              this.loginBtn = false
            }
          })
          .catch(err => {
            // console.log(err)
            that.requestFailed(err)
          })
      }
    },

    loginSuccess () {
      this.loginBtn = false
      this.$router.push({ name: 'home' })
      this.$notification.success({
        message: '登录成功'
        // description: `${timeFix()}，欢迎回来`
      })
    },
    requestFailed () {
      this.$notification['error']({
        message: '错误',
        description: '请求出现错误，请稍后再试',
        duration: 4
      })
      this.loginBtn = false
    },
    handleUpdate () {
      this.isUpdate = !this.isUpdate
    }
  }
}
</script>

<style lang="scss" scoped>
  .main{
    width:500px;
    padding-top:100px;
    margin: auto;
    .title{
      text-align: center;
      width: 100%;
      margin-top: 100px;
      margin-bottom: 30px;
    }
  }
  .user-layout-login {
    label {
      font-size: 14px;
    }

    .getCaptcha {
      display: block;
      width: 100%;
      height: 40px;
    }

    .forge-password {
      font-size: 14px;
    }

    button.login-button {
      padding: 0 15px;
      font-size: 16px;
      height: 40px;
      width: 100%;
    }

    .user-login-other {
      text-align: left;
      margin-top: 24px;
      line-height: 22px;

      .item-icon {
        font-size: 24px;
        color: rgba(0, 0, 0, 0.2);
        margin-left: 16px;
        vertical-align: middle;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: #1890ff;
        }
      }

      .register {
        float: right;
      }
    }
  }
</style>
