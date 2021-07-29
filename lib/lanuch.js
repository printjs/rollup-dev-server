/* @wujiantao/rollup-dev-server 1.0.7 */
'use strict';

var chokidar = require('chokidar');
var worker_threads = require('worker_threads');
var fs = require('fs');
var path = require('path');
var esm = require('esm');
var rollup = require('rollup');
var log4js = require('log4js');
var http = require('http');
var mime = require('mime');
var ws = require('ws');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var esm__default = /*#__PURE__*/_interopDefaultLegacy(esm);
var mime__default = /*#__PURE__*/_interopDefaultLegacy(mime);

class ServerOption {
    publicPath = './';
    rollupConfigFile = 'rollup.config.js';
    port = 7999;
    https = false;
    cert;
    key;
    proxy;
    notFoundPage;
    pageMap = {
        '/': 'index.html',
    };
    constructor(option) {
        const keys = Object.keys(option);
        keys.forEach((key) => {
            if (key === 'pageMap' && Reflect.has(option, key)) {
                Reflect.set(this, key, {
                    ...Reflect.get(this, key),
                    ...Reflect.get(option, key)
                });
                return;
            }
            if (Reflect.has(option, key)) {
                Reflect.set(this, key, Reflect.get(option, key));
            }
        });
    }
}

function getPath(fileName) {
    return path.join(process.cwd(), fileName);
}
function isConfigFile(fileName) {
    return new Promise((resolve) => {
        fs.stat(getPath(fileName), (err, stats) => {
            if (err) {
                resolve(false);
                return;
            }
            resolve(stats.isFile());
        });
    });
}
async function importConfigFile(rollup = false, rollupConfigFile) {
    if (rollup) {
        return new Promise((resolve) => {
            const loader = esm__default['default'](module);
            resolve(loader(getPath(rollupConfigFile)));
        });
    }
    const prefixFileName = 'rollup.dev.server.config';
    const exts = ['.ts', '.js', '.json'];
    const fileNames = exts.map((ext) => `${prefixFileName}${ext}`);
    const result = [];
    for (const fileName of fileNames) {
        if (await isConfigFile(fileName)) {
            result.push(fileName);
        }
    }
    if (result.length === 0) {
        throw new Error("Not Found Rollup Dev Server Config File");
    }
    if (result.length > 1) {
        throw new Error("The Project Has Multiple Default Configuration Files ");
    }
    return new Promise((resolve) => {
        const loader = esm__default['default'](module);
        resolve(loader(getPath(result[0])));
    });
}
async function getConfigFile(rollup = false, rollupConfigFile = '') {
    return new Promise((resolve) => {
        importConfigFile(rollup, rollupConfigFile).then((file) => {
            let config;
            const esModule = file;
            const commonjs = file;
            if (esModule.__esModule) {
                config = esModule.default;
            }
            else {
                config = commonjs;
            }
            resolve(config);
        });
    });
}

class OptionServer {
    serverConfig;
    rollupConfig;
    start() {
        return new Promise(async (resolve) => {
            await this.loadConfig();
            await this.loadRollupConfig();
            resolve({
                rollupConfig: this.rollupConfig,
                serverConfig: this.serverConfig
            });
        });
    }
    async loadConfig() {
        return new Promise((resolve) => {
            getConfigFile(false).then((config) => {
                const defaultServerOption = new ServerOption(config);
                this.serverConfig = (defaultServerOption);
                resolve();
            });
        });
    }
    loadRollupConfig() {
        return new Promise((resolve) => {
            getConfigFile(true, this.serverConfig.rollupConfigFile).then((config) => {
                this.rollupConfig = config;
                resolve();
            });
        });
    }
}
const optionServer = new OptionServer();

log4js.configure({
    appenders: {
        '@wujiantao/rollup-dev-server': { type: "console" },
        error: { type: 'multiprocess', mode: 'master' }
    },
    categories: { default: { appenders: ['@wujiantao/rollup-dev-server'], level: "debug" } }
});
class LoggerService {
    cheese = log4js.getLogger('@wujiantao/rollup-dev-server');
    logger = log4js.getLogger("error");
    trace(value) {
        this.logger.trace(value);
    }
    debug(value) {
        this.cheese.debug(value);
    }
    info(value) {
        this.cheese.info(value);
    }
    warn(value) {
        this.cheese.warn(value);
    }
    error(value) {
        this.logger.error(value);
    }
    fatal(value) {
        this.logger.fatal(value);
    }
}
const logger = new LoggerService();

const style = `
/*

Visual Studio-like style based on original C# coloring by Jason Diamond <jason@diamond.name>

*/
.hljs {
  background: white;
  color: black;
}

.hljs-comment,
.hljs-quote,
.hljs-variable {
  color: #008000;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-built_in,
.hljs-name,
.hljs-tag {
  color: #00f;
}

.hljs-string,
.hljs-title,
.hljs-section,
.hljs-attribute,
.hljs-literal,
.hljs-template-tag,
.hljs-template-variable,
.hljs-type,
.hljs-addition {
  color: #a31515;
}

.hljs-deletion,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-meta {
  color: #2b91af;
}

.hljs-doctag {
  color: #808080;
}

.hljs-attr {
  color: #f00;
}

.hljs-symbol,
.hljs-bullet,
.hljs-link {
  color: #00b0e8;
}


.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}
`;

const hljs = require('highlight.js');
class RollupGenerateCodeServer {
    bundle;
    javascriptBundle = [];
    error;
    get codeBundle() {
        return this.javascriptBundle;
    }
    get watchFiles() {
        return this.bundle ? this.bundle.watchFiles : [];
    }
    get err() {
        return `${this.error}`;
    }
    async build(config) {
        this.error = '';
        if (Array.isArray(config)) {
            const rollupConfigs = config;
            for (const rollupConfig of rollupConfigs) {
                await this.bundleStep(rollupConfig);
            }
        }
        else {
            const rollupConfig = config;
            await this.bundleStep(rollupConfig);
        }
    }
    async bundleStep(rollupConfig) {
        try {
            this.bundle = await rollup.rollup(rollupConfig);
            if (rollupConfig.output) {
                await this.generateOutput(rollupConfig.output);
            }
            else {
                throw new Error("Rollup output is not defined");
            }
        }
        catch (error) {
            console.log('---------bundleStep---------');
            if (typeof error === 'object') {
                this.error = `
          <pre style="margin: 0px">
            <code class="hljs language-typescript" style="font-size: large;white-space: break-spaces;">
              ${hljs.highlight(`${error.stack || error.message || error}`, { language: 'javascript' }).value}
            </code>
          </pre>
          <style>${style}</style>
        `;
            }
        }
    }
    async generateOutput(outputOption) {
        let bundleInBuildingProcess = [];
        let resultOutputOptions = outputOption;
        if (outputOption && Array.isArray(outputOption)) {
            resultOutputOptions = outputOption[0];
        }
        if (resultOutputOptions) {
            const outputConfig = resultOutputOptions;
            try {
                const { output } = await this.bundle.generate(outputConfig);
                bundleInBuildingProcess = bundleInBuildingProcess.concat(output);
                this.javascriptBundle = bundleInBuildingProcess.slice(0);
            }
            catch (error) {
                console.log('---------generateOutput---------');
                this.error = error;
                logger.error(error);
            }
            return;
        }
        throw new Error("Rollup Output Option is not defined");
    }
}

var operationStatus;
(function (operationStatus) {
    operationStatus["normal"] = "normal";
    operationStatus["error"] = "error";
    operationStatus["notFound"] = "not found";
})(operationStatus || (operationStatus = {}));
class FileOperation {
    status;
    data;
    constructor(status, data) {
        this.status = status;
        this.data = data;
    }
}

const notFoundTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404</title>
</head>
<body>
  <div id="page-not-found">
    <div class="fof">
      <h1>Error 404</h1>
    </div>
  </div>
  <style type="text/css">
    *{
      transition: all 0.6s;
    }
    html {
        height: 100%;
    }

    body{
      font-family: 'Lato', sans-serif;
      color: #888;
      margin: 0;
    }

    #page-not-found {
        display: table;
        width: 100%;
        height: 100vh;
        text-align: center;
    }

    #page-not-found .fof{
        display: table-cell;
        vertical-align: middle;
    }

    #page-not-found .fof h1{
        font-size: 50px;
        display: inline-block;
        padding-right: 12px;
        animation: type .5s alternate infinite;
    }

    @keyframes type {
      from{box-shadow: inset -3px 0px 0px #888;}
      to{box-shadow: inset -3px 0px 0px transparent;}
    }
  </style>
</body>
</html>
`;

class Server {
    serverOption;
    bundle;
    error;
    constructor(serverOption) {
        this.serverOption = serverOption;
    }
    set bundleData(bundle) {
        this.bundle = bundle;
    }
    set err(error) {
        this.error = error;
    }
    runHttpServer() {
        if (!this.bundle) {
            throw new Error("Bundle Not Ready");
        }
        if (this.serverOption.https) {
            try {
                const options = {
                    key: fs.readFileSync(this.serverOption.key),
                    cert: fs.readFileSync(this.serverOption.cert)
                };
                return http.createServer(options, this.requestListener);
            }
            catch (error) {
                throw new Error(error);
            }
        }
        return http.createServer(this.requestListener);
    }
    requestListener = async (req, res) => {
        let result;
        logger.debug(`req.url: ${req.url}`);
        try {
            if (this.error) {
                res.writeHead(200, { 'Content-type': 'text/html' });
                res.write(this.error);
                res.end();
                return;
            }
            const rootPath = this.getPath(req.url);
            result = await this.isFile(rootPath);
            const chunkOrAssetResult = this.bundle.find((chunkOrAsset) => {
                if (chunkOrAsset.type === 'asset') {
                    const file = new RegExp(`\.${chunkOrAsset.fileName}$`);
                    if (req.url && file.test(rootPath)) {
                        res.writeHead(200, { 'Content-type': this.getMimeType(chunkOrAsset.fileName) });
                        res.write(chunkOrAsset.source);
                        res.end();
                        return true;
                    }
                }
                else {
                    const file = new RegExp(`\.${chunkOrAsset.fileName}$`);
                    if (req.url && file.test(req.url)) {
                        res.writeHead(200, { 'Content-type': this.getMimeType(req.url) });
                        res.write(chunkOrAsset.map !== null ? `${chunkOrAsset.code}//# sourceMappingURL=${chunkOrAsset.fileName}.map` : chunkOrAsset.code);
                        res.end();
                        return true;
                    }
                    const map = /\.map$/;
                    if (req.url && map.test(req.url) && chunkOrAsset.map && file.test(req.url.replace('.map', ''))) {
                        res.writeHead(200, { 'Content-type': this.getMimeType(req.url) });
                        res.write(JSON.stringify(chunkOrAsset.map));
                        res.end();
                        return true;
                    }
                }
                return false;
            });
            if (!chunkOrAssetResult) {
                if (result.status === operationStatus.normal) {
                    result = await this.readyFile(rootPath);
                    res.writeHead(200, { 'Content-Type': this.getMimeType(rootPath) });
                    res.write(result.data);
                    res.end();
                }
                if (result.status === operationStatus.notFound) {
                    res.writeHead(404, { 'Content-type': 'text/html' });
                    const notFound = await this.ready404File();
                    res.write(notFound.data);
                    res.end();
                }
            }
        }
        catch (error) {
            if (error.status === operationStatus.notFound) {
                res.writeHead(500, { 'Content-type': 'text/html' });
                res.write(error.data);
                res.end();
            }
        }
    };
    ready404File() {
        if (this.serverOption.notFoundPage) {
            return this.readyFile(this.getPath(this.serverOption.notFoundPage));
        }
        return new Promise((resolve) => {
            resolve(new FileOperation(operationStatus.normal, notFoundTemplate));
        });
    }
    readyFile(reqUrl) {
        return new Promise((resolve, reject) => {
            fs.readFile(reqUrl, (err, data) => {
                if (err) {
                    reject(new FileOperation(operationStatus.error, err.message));
                }
                else {
                    resolve(new FileOperation(operationStatus.normal, this.isImage(reqUrl) ? data : data.toString()));
                }
            });
        });
    }
    urlFromPageMap(reqUrl) {
        const { pageMap } = this.serverOption;
        if (pageMap) {
            const keys = Object.keys(pageMap);
            return !!keys.find((key) => key === reqUrl);
        }
        return false;
    }
    getPath(reqUrl = '/') {
        const { pageMap } = this.serverOption;
        if (this.urlFromPageMap(reqUrl)) {
            return path.join(process.cwd(), this.serverOption.publicPath, pageMap[reqUrl]);
        }
        return path.join(process.cwd(), this.serverOption.publicPath, reqUrl);
    }
    isFile(reqUrl) {
        return new Promise((resolve) => {
            fs.stat(reqUrl, (err, stat) => {
                if (err || !stat.isFile()) {
                    resolve(new FileOperation(operationStatus.notFound, ''));
                    return;
                }
                resolve(new FileOperation(operationStatus.normal, ''));
            });
        });
    }
    getMimeType(path) {
        if (path === '/') {
            return 'text/html';
        }
        return mime__default['default'].getType(path) || '';
    }
    isImage(path) {
        const mimeType = this.getMimeType(path);
        return mimeType.indexOf('image') > -1;
    }
}

class WobSocketServer {
    wsInstance;
    constructor(config) {
        this.wsInstance = new ws.Server(config);
    }
    get ws() {
        return this.wsInstance;
    }
}

if (worker_threads.isMainThread) {
    const rollupGenerateCodeServer = new RollupGenerateCodeServer();
    optionServer.start().then(async (data) => {
        const { serverConfig, rollupConfig } = data;
        await rollupGenerateCodeServer.build(rollupConfig);
        const { codeBundle, watchFiles, err } = rollupGenerateCodeServer;
        const work = new worker_threads.Worker(__filename, { workerData: { watchFiles } });
        const server = new Server(serverConfig);
        server.bundleData = codeBundle;
        server.err = err;
        const rollupDevServer = server.runHttpServer();
        const websocketServer = new WobSocketServer({ server: rollupDevServer });
        rollupDevServer.listen(serverConfig.port);
        logger.info(`Rollup Dev Server with port number ${serverConfig.port} has been started`);
        let postMessageToBrowser;
        work.on('message', (data) => {
            if (data === 'reload') {
                logger.info('New bundle has generated');
                rollupGenerateCodeServer.build(rollupConfig).then(() => {
                    const { codeBundle: codeBundleNew, watchFiles: watchFilesNew, err: errNew } = rollupGenerateCodeServer;
                    server.bundleData = codeBundleNew;
                    server.err = errNew;
                    work.postMessage({ watchFiles: watchFilesNew });
                    if (postMessageToBrowser)
                        postMessageToBrowser.send('reload');
                });
            }
        });
        work.on('exit', (exitCode) => {
            logger.info(`Work end with number ${exitCode}`);
        });
        websocketServer.ws.on('connection', (ws) => {
            ws.on('message', (message) => {
                console.log('received: %s', message);
            });
            postMessageToBrowser = ws;
        });
    });
}
else {
    const watcher = chokidar.watch(`${process.cwd()}`);
    let watchFiles = worker_threads.workerData.watchFiles;
    worker_threads.parentPort?.on('message', (obj) => {
        watchFiles = obj.watchFiles;
    });
    watcher.on('change', (path) => {
        if (watchFiles.find((file) => file === path)) {
            worker_threads.parentPort?.postMessage('reload');
        }
    });
}
