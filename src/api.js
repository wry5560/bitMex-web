import { axios } from './lib/request'

export const reqUsers  = async function(userName){
  const options={
    url:'http://localhost:3000/users',
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
