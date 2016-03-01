var webpack = require('webpack');

module.exports = {
  entry: [
    './public/src/scripts/main'
  ],
  output: {
    path: __dirname + '/public/build',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test:/\.js?$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/
      }
    ],
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ]
};