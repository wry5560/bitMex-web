import BitMEXClient from './index'
// 'use strict'
console.log('start!')
// See 'options' reference below
console.log('import end')
const client = new BitMEXClient.BitMEXClient({ testnet: true })
// handle errors here. If no 'error' callback is attached. errors will crash the client.
client.on('error', console.error)
client.on('open', () => console.log('Connection opened.'))
client.on('close', () => console.log('Connection closed.'))
client.on('initialize', () => console.log('Client initialized, data is flowing.'))

client.addStream('XBTUSD', 'instrument', function (data, symbol, tableName) {
  console.log(`Got update for ${tableName}:${symbol}. Current state:\n${JSON.stringify(data).slice(0, 100)}...`)
  // Do something with the table data...
})
