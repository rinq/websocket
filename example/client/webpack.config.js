const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')
const webpack = require('webpack')

const extractSass = new ExtractTextPlugin({
  filename: 'css/app.css'
})

module.exports = {
  entry: [
    'grommet/scss/vanilla/index',
    './src/app'
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.scss']
  },
  output: {
    path: path.resolve(__dirname, 'web'),
    filename: 'js/app.js'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        loader: 'json-loader',
        test: /\.json$/,
        enforce: 'pre'
      },
      {
        loader: 'babel-loader',
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        options: {
          presets: ['latest', 'react']
        }
      },
      {
        test: /\.scss$/,
        loader: extractSass.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: false,
                includePaths: [
                  path.resolve(__dirname, 'node_modules')
                ]
              }
            }
          ]
        })
      }
    ],
    noParse: [
      /node_modules\/localforage\/dist/
    ]
  },
  plugins: [
    extractSass,
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ],
  devServer: {
    contentBase: 'web',
    historyApiFallback: true,
    setup: function (app) {
      app.get('/config.json', function (request, response) {
        response.json({
          gateway: `ws://${encodeURIComponent(request.hostname)}:8081/`
        })
      })
    }
  }
}
