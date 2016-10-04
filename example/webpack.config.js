module.exports = {
  entry: ['babel-polyfill', './src/app'],
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
        exclude: /node_modules/,
        loader: 'babel',
        query: { presets: [ 'latest' ] }
      }
    ]
  },
  devServer: {
    contentBase: 'web'
  }
}
