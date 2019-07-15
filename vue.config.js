const path = require('path')
const webpack = require('webpack')


function resolve (dir) {
  return path.join(__dirname, dir)
}

// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      // Ignore all locale files of moment.js
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],

    // externals:process.env.NODE_ENV === 'production'
    // ?{'vue': 'Vue', 'vue-router': 'VueRouter',}
    // :{}
  },
}
