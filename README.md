# @wujiantao/rollup-dev-server

## Overview
Use together with rollup, simple commands and configuration, no need to wait for rollup to generate the actual compiled files, hope it will be convenient for your development.

## Install 
`npm install @wujiantao/rollup-dev-server --save-dev`

## Configuration

Create a file named `rollup.dev.server.config.[js|ts|json]`, write the following attributes into it.

```js
// rollup.dev.server.config.js
export default {
  publicPath: './public',
  rollupConfigFile: 'rollup.config.js',
  port: 7999,
  pageMap: {
    '/': 'index.html'
  }
}
```

|attributes|description|default|
|--|--|--|
|publicPath|Where the `@wujiantao/rollup-dev-server` looks for the context|`./`|
|rollupConfigFile|The name of the rollup configuration file|`rollup.config.js`|
|port|The port of `@wujiantao/rollup-dev-server` started|`7999`|
|pageMap|When the page is accessed`/`path, `index.html` will be returned|`{'/': 'index.html'}`|

## How to use

1. install `@wujiantao/rollup-dev-server` and `rollup`
2. configure `rollup`
3. configure `@wujiantao/rollup-dev-server`
4. exec `node_modules/.bin/rollup-dev-server`

> Warning ⚠️  
> @wujiantao/rollup-dev-server does not support rollup multi-export mode. If there is a multi-export configuration, the server will read the first exit code by default


### example
```js
// rollup.config.js
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import sass from 'rollup-plugin-sass';
import copy from 'rollup-plugin-copy-assets';
import html from '@rollup/plugin-html';
import imagemin from 'rollup-plugin-imagemin';

export default {
  input: 'src/index.js',
  output: {
    dir: 'public/dist',
    format: 'system',
    sourcemap: true
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-react'],
    }),
    nodeResolve({
      extensions: ['.js'],
      dedupe: ["react", "react-dom", "dayjs"]
    }),
    commonjs(),
    sass({
      insert: true
    }),
    copy({
      assets: [
        "src/assets",
      ],
    }),
    html({
      fileName: 'index.html',
      template({ attributes, bundle, files, publicPath, title }) {
        return `
        <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <script src="https://unpkg.com/systemjs@6.10.0/dist/system.min.js"></script>
          </head>
          <body>
            <div id="root"></div>
            <script type="systemjs-module" src="./dist/index.js"></script>
          </body>
          </html>
        `
      }
    }),
    imagemin()
  ]
}
```

## Auto Refresh

When you modify the code each time, if you want the page to refresh automatically, you only need to add the following method to your front-end code.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { livereload } from '@wujiantao/rollup-dev-server';

ReactDOM.render(
  <div>Hello @wujiantao/rollup-dev-server</div>,
  document.getElementById('root')
);

if(process.env.NODE_ENV === 'development'){
  livereload();
}
```

