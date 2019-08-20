import { axios } from './lib/request'
import { settings } from '../config/dev-setting'
const { isTest } = settings

const baseUrl = isTest ? 'http://localhost:3001' : 'http://8.208.9.176:3001'
// const baseUrl = 'http://47.245.26.247:3001'

export const reqUsers = async function (userName) {
  const options = {
    url: baseUrl + '/users',
    method: 'get',
    params: userName ? { username: userName } : ''
  }
  try {
    const users = await axios(options)
    return users
  } catch (err) {
    console.log(err)
  }
}

export const reqTradeHistory = async function (userName) {
  const options = {
    url: baseUrl + '/execution/tradeHistory',
    method: 'get',
    params: userName ? { username: userName } : ''
  }
  try {
    const users = await axios(options)
    return users
  } catch (err) {
    console.log(err)
  }
}

export const reqWalletHistory = async function (userName) {
  const options = {
    url: baseUrl + '/users/walletHistory',
    method: 'get',
    params: userName ? { username: userName } : ''
  }
  try {
    const users = await axios(options)
    return users
  } catch (err) {
    console.log(err)
  }
}

export const reqOrders = async function (userName) {
  const options = {
    url: baseUrl + '/order',
    method: 'get',
    params: userName ? { username: userName } : ''
  }
  try {
    const users = await axios(options)
    return users
  } catch (err) {
    console.log(err)
  }
}

export const postOrders = async function (datas) {
  const options = {
    url: baseUrl + '/order',
    method: 'post',
    data: datas
  }
  try {
    const res = await axios(options)
    return res
  } catch (err) {
    console.log(err)
  }
}

export const getLevelPriceCelve = async function (params) {
  const options = {
    url: baseUrl + '/levelPriceCelve',
    method: 'get',
    params: params
  }
  try {
    const res = await axios(options)
    return res
  } catch (err) {
    console.log(err)
  }
}

export const postLevelPriceCelve = async function (datas) {
  const options = {
    url: baseUrl + '/levelPriceCelve',
    method: 'post',
    data: datas
  }
  try {
    const res = await axios(options)
    return res
  } catch (err) {
    console.log(err)
  }
}
export const postLog = async function (data) {
  const options = {
    url: baseUrl + '/logApi',
    method: 'post',
    data: {
      log: JSON.stringify(data)
    }
  }
  try {
    await axios(options)
  } catch (err) {
    console.log(err)
  }
}

export const login = async function (data) {
  // debugger
  const options = {
    url: baseUrl + '/login',
    method: 'post',
    data: data
  }
  try {
    const res = await axios(options)
    return res
  } catch (err) {
    console.log(err)
  }
}

export const updatePassword = async function (data) {
  // debugger
  const options = {
    url: baseUrl + '/login/password',
    method: 'post',
    data: data
  }
  try {
    const res = await axios(options)
    return res
  } catch (err) {
    console.log(err)
  }
}

export const loginInfo = async function (data) {
  // debugger
  const options = {
    url: 'http://feooe.changeip.org:17103/login/info',
    method: 'post',
    data: data
  }
  try {
    const res = await axios(options)
    return res
  } catch (err) {
    console.log(err)
  }
}

export const websocketLog = async function (data) {
  // debugger
  const options = {
    url:baseUrl +  '/logApi/websocket',
    method: 'post',
    data: {
      message:data
    }
  }
  try {
    const res = await axios(options)
    return res
  } catch (err) {
    console.log(err)
  }
}

export const permission = async function (data) {
  // debugger
  const options = {
    url: baseUrl + '/permission',
    method: 'post',
    data: data
  }
  try {
    const res = await axios(options)
    return res
  } catch (err) {
    console.log(err)
  }
}
