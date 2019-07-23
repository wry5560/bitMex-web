const levelPriceCelve1 = function (currentPrice) {
  this.celves.forEach(async item => {
    if (item.side === 'Buy') {
      if (currentPrice <= item.nextPrice + item.offset && item.nextLevel <= item.level) {
        if (this.lockCelve) {
          console.log('celve locked!')
          return
        }
        console.time()
        this.lockCelve = true
        console.log('触发开单!当前价格：' + currentPrice + '... ' + 'nextPrice:' + item.nextPrice + '... ' + 'nextLevel:' + item.nextLevel)
        const res = await this.createOrder(item)
        if (res === 'wait') {
          console.log('locked!wait!')
          return
        } else {
          console.log('')
          if (res.error) {
            item.actions.unshift(res.error.message)
          } else {
            item.actions.unshift('下单 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
            console.log('下单 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
            item.preLevel = item.currentLevel
            item.currentLevel = item.nextLevel
            item.nextLevel = item.nextLevel + 1
            item.stopPrice = item.currentLevel === 1 ? 999999 : item.prePrice
            item.prePrice = item.nextPrice
            item.nextPrice = item.nextPrice - item.levelPrice
          }
          try {
            item.postType = 'update'
            await postLevelPriceCelve(item)
            await this.getCelves('running')
            this.orderLocks[item._id] = false
            this.lockCelve = false
            console.timeEnd()
          } catch (e) {
            this.orderLocks[item._id] = false
            console.log(e)
          }
        }
        // debugger
      }
      if (currentPrice >= item.stopPrice - item.offset && item.currentLevel > 1) {
        if (this.lockCelve) {
          console.log('celve locked!')
          return
        }
        console.time()
        this.lockCelve = true
        console.log('触发平仓!当前价格：' + currentPrice + '... ' + 'stopPrice:' + item.stopPrice + '... ' + 'currentLevel:' + item.currentLevel)
        const res = await this.pcOrder(item)
        if (res === 'wait') {
          console.log('locked!wait!')
        } else {
          if (res.error) {
            item.actions.unshift(res.error.message)
          } else {
            item.actions.unshift('平仓 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
            console.log('平仓 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'), res)
            item.nextPrice = item.prePrice
            item.prePrice = item.prePrice + item.levelPrice
            item.nextLevel = item.currentLevel
            item.currentLevel = item.preLevel
            item.preLevel = item.preLevel - 1
            item.stopPrice = item.stopPrice = item.currentLevel === 1 ? 999999 : item.prePrice + item.levelPrice
          }
          try {
            item.postType = 'update'
            await postLevelPriceCelve(item)
            await this.getCelves('running')
            this.orderLocks[item._id] = false
            this.lockCelve = false
            console.timeEnd()
          } catch (e) {
            this.orderLocks[item._id] = false
            console.log(e)
          }
        }
      }
    } else if (item.side === 'Sell') {
      if (currentPrice >= item.nextPrice - item.offset && item.nextLevel <= item.level) {
        if (this.lockCelve) {
          console.log('celve locked!')
          return
        }
        console.time()
        this.lockCelve = true
        console.log('触发开单!当前价格：' + currentPrice + '... ' + 'nextPrice:' + item.nextPrice + '... ' + 'nextLevel:' + item.nextLevel)
        const res = await this.createOrder(item)
        if (res === 'wait') {
          console.log('locked!wait!')
          return
        } else {
          if (res.error) {
            item.actions.unshift(res.error.message)
          } else {
            item.actions.unshift('下单 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
            console.log('下单 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
            item.preLevel = item.currentLevel
            item.currentLevel = item.nextLevel
            item.nextLevel = item.nextLevel + 1
            item.stopPrice = item.currentLevel == 1 ? 999999 : item.prePrice
            item.prePrice = item.nextPrice
            item.nextPrice = item.nextPrice + item.levelPrice
          }
          try {
            item.postType = 'update'
            await postLevelPriceCelve(item)
            await this.getCelves('running')
            this.orderLocks[item._id] = false
            this.lockCelve = false
            console.timeEnd()
          } catch (e) {
            this.orderLocks[item._id] = false
            console.log(e)
          }
        }
      }
      if (currentPrice <= item.stopPrice - item.offset && item.currentLevel > 1) {
        if (this.lockCelve) {
          console.log('celve locked!')
          return
        }
        console.time()
        this.lockCelve = true
        console.log('触发平仓!当前价格：' + currentPrice + '... ' + 'stopPrice:' + item.stopPrice + '... ' + 'currentLevel:' + item.currentLevel)
        const res = await this.pcOrder(item)
        if (res === 'wait') {
          console.log('locked!wait!')
        } else {
          if (res.error) {
            item.actions.unshift(res.error.message)
          } else {
            item.actions.unshift('平仓 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
            console.log('平仓 ' + res.orderQty + '... ' + '价格 ' + res.price + '... ' + ' 时间 ' + moment().format('YYYY-MM-DD HH:mm:ss'))
            item.nextPrice = item.prePrice
            item.prePrice = item.prePrice - item.levelPrice
            item.nextLevel = item.currentLevel
            item.currentLevel = item.preLevel
            item.preLevel = item.preLevel - 1
            console.log('currentLevel:', item.currentLevel)
            item.stopPrice = item.currentLevel == 1 ? 999999 : item.prePrice - item.levelPrice
          }
          try {
            item.postType = 'update'
            await postLevelPriceCelve(item)
            await this.getCelves('running')
            this.orderLocks[item._id] = false
            this.lockCelve = false
            console.timeEnd()
          } catch (e) {
            this.orderLocks[item._id] = false
            console.log(e)
          }
        }
      }
    }
  })
}
