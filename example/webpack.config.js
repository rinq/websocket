var path = require('path')

module.exports = {
  entry: ['./src/app'],
  resolve: {
    extensions: ['', '.js']
  },
  output: {
    path: 'web/js',
    filename: 'app.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/overpass-websocket-client')
        ],
        loader: 'babel',
        query: {presets: ['latest']}
      }
    ]
  },
  devServer: {
    contentBase: 'web'
  }
}
