import { axios } from './lib/request'

const baseUrl='http://localhost:3000'

export const reqUsers  = async function(userName){
  const options={
    url:baseUrl+'/users',
    method:'get',
    params:userName ? {username:userName}:''
  }
  try{
    const users= await axios(options)
    return users
  }catch(err){
    console.log(err)
  }
}

export const reqTradeHistory  = async function(userName){
  const options={
    url:baseUrl+'/execution/tradeHistory',
    method:'get',
    params:userName ? {username:userName}:''
  }
  try{
    const users= await axios(options)
    return users
  }catch(err){
    console.log(err)
  }
}

export const reqWalletHistory  = async function(userName){
  const options={
    url:baseUrl+'/users/walletHistory',
    method:'get',
    params:userName ? {username:userName}:''
  }
  try{
    const users= await axios(options)
    return users
  }catch(err){
    console.log(err)
  }
}

export const reqOrders  = async function(userName){
  const options={
    url:baseUrl+'/order',
    method:'get',
    params:userName ? {username:userName}:''
  }
  try{
    const users= await axios(options)
    return users
  }catch(err){
    console.log(err)
  }
}

export const postOrders  = async function(datas){
  const options={
    url:baseUrl+'/order',
    method:'post',
    data:datas
  }
  try{
    const users= await axios(options)
    return users
  }catch(err){
    console.log(err)
  }
}
