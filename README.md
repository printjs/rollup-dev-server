# @wujiantao/rollup-dev-server

## Overview
Use together with rollup, simple commands and configuration, no need to wait for rollup to generate the actual compiled files, hope it will be convenient for your development.

## Install 
`npm install @wujiantao/rollup-dev-server --save-dev`

## Configuration

Create a file named `rollup.dev.server.config.[js|ts|json]`, write the following attributes into it.

|attributes|description|default|
|--|--|--|
|publicPath|Where the `@wujiantao/rollup-dev-server` looks for the context|`./`|
|rollupConfigFile|The name of the rollup configuration file|`rollup.config.js`|
|port|The port of `@wujiantao/rollup-dev-server` started|`6666`|
|pageMap|When the page is accessed`/`path, `index.html` will be returned|`{'/': 'index.html'}`|

## How to use

1. install `@wujiantao/rollup-dev-server` and `rollup`
2. configure `rollup`
3. configure `@wujiantao/rollup-dev-server`
4. exec `node_modules/.bin/rollup-dev-server`

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

