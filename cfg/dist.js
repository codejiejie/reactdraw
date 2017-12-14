'use strict';

let path = require('path');
let webpack = require('webpack');

let baseConfig = require('./base');
let defaultSettings = require('./defaults');

// Add needed plugins here
let BowerWebpackPlugin = require('bower-webpack-plugin');

let config = Object.assign({}, baseConfig, {
  entry: path.join(__dirname, '../src/index'),
  cache: false,//不缓存生成的代码块
  devtool: 'sourcemap',//在开发者工具中方便调试  生成map文件
  plugins: [
    new webpack.optimize.DedupePlugin(),//用来检测相似的文件  文件中相似的内容  然后这些冗余在output中消除掉
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new BowerWebpackPlugin({
      searchResolveModulesDirectories: false
    }),
    new webpack.optimize.UglifyJsPlugin(),//用来压缩输出的js代码
    new webpack.optimize.OccurenceOrderPlugin(),//引用频率  越频繁 id值越短
    new webpack.optimize.AggressiveMergingPlugin(),//优化生成的代码段  合并相似  提取公共
    new webpack.NoErrorsPlugin()//保证编译过程不能出错
  ],
  module: defaultSettings.getDefaultModules()
});

// Add needed loaders to the defaults here
config.module.loaders.push({
  test: /\.(js|jsx)$/,
  loader: 'babel',//语法检测  语言转化
  include: [].concat(
    config.additionalPaths,
    [ path.join(__dirname, '/../src') ]
  )
});

module.exports = config;
