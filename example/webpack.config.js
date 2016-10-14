var path = require('path')

module.exports = {
  entry: [
    'grommet/scss/vanilla/index',
    'babel-polyfill',
    './src/app'
  ],
  resolve: {
    extensions: ['', '.js', '.jsx', '.scss']
  },
  output: {
    path: 'web',
    filename: 'js/app.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/overpass-websocket')
        ],
        loader: 'babel',
        query: { presets: [ 'latest', 'react' ] }
      },
      {
        test: /\.scss$/,
        loader: 'file?name=css/app.css!sass'
      }
    ]
  },
  sassLoader: {
    includePaths: ['./node_modules']
  },
  devServer: {
    contentBase: 'web',
    setup: function (app) {
      app.get('/config.json', function (request, response) {
        response.json({
          gateway: 'ws://' + encodeURIComponent(request.hostname) + ':8081/'
        })
      })
    }
  }
}
