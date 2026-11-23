const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: path.resolve(__dirname, '../src/popup/index.tsx'),
    background: path.resolve(__dirname, '../src/background/service-worker.ts'),
    content: path.resolve(__dirname, '../src/content/content-script.ts'),
    welcome: path.resolve(__dirname, '../src/welcome/welcome.ts'),
    report: path.resolve(__dirname, '../src/report/report.ts')
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/popup.html'),
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/welcome.html'),
      filename: 'welcome.html',
      chunks: ['welcome']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/report.html'),
      filename: 'report.html',
      chunks: ['report']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/icons', to: 'icons', noErrorOnMissing: true }
      ]
    })
  ]
};
