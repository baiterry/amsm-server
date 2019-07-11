/**
 * AMSM服务端
 * 
 * HTTP服务器：
 *  - GET /history/[date]/[flight] 指定日期/航班号的飞行历史
 *  - GET /airwaypoints 航路点数据
 *  - WS /flight 实时飞行数据
 * 
 * 启动参数：
 *    --source [address]:[port] 指定数据源服务器地址
 * 
 * 20190711 wyp
 */

const child_process = require('child_process');

const wlogger = require('./common/wlogger');
const logger = new wlogger('Master ', './logs/main.log'); // 日志记录器

let subprocess_server; // 指向webServer子进程
let subprocess_lib; // 指向Librarian子进程

// web服务器
function init_webserver(source){
  let worker_webserver = child_process.fork('./workers/webserver.js');
  worker_webserver.on('message', (msg)=>{
    if (msg.type === 'ctrl') {
      switch (msg.content) {
        case 'kill': // kill req from worker
          worker_webserver.kill('SIGKILL');
          break;
        default:
          break;
      }
    }
  });
  worker_webserver.on('close', (code, signal)=>{
    // 记录子进程退出日志，延迟10s后重启
    logger.fatal(`Worker_Web服务 - 退出 - Code ${code} Signal ${signal}`);
    logger.info(`Worker_Web服务 - 重启子进程 in 10s`);
    subprocess_server = null;
    setTimeout(()=>{
      init_webserver(source);
    },10000);
  });
  worker_webserver.on('error', (err)=>{
    logger.error(`Worker_Web服务 - 错误 ${err}`);
  });
  subprocess_server = worker_webserver;
}


// 数据存储
function init_lib(){
  let worker_lib = child_process.fork('./workers/librarian.js');
  worker_lib.on('message', (msg)=>{
    if (msg.type === 'ctrl') {
      switch (msg.content) {
        case 'kill': // kill req from worker
          worker_lib.kill('SIGKILL');
          break;
        default:
          break;
      }
    }
  });
  worker_lib.on('close', (code, signal)=>{
    // 记录子进程退出日志，延迟10s后重启
    logger.fatal(`Worker_lib - 退出 - Code ${code} Signal ${signal}`);
    logger.info(`Worker_lib - 重启子进程 in 10s`);
    subprocess_server = null;
    setTimeout(()=>{
      init_lib();
    },10000);
  });
  worker_lib.on('error', (err)=>{
    logger.error(`Worker_Web服务 - 错误 ${err}`);
  });
  subprocess_lib = worker_lib;
}

// 明文获取
function init_fetcher(source){
  let args = [source.address, source.port];
  let worker_fetcher = child_process.fork('./workers/fetcher.js', args);
  // worker_fetcher.send('hello fetcher');
  worker_fetcher.on('message', (msg)=>{
    if (msg.type === 'ctrl') {
      switch (msg.content) {
        case 'kill': // kill req from worker
          worker_fetcher.kill('SIGKILL');
          break;
        default:
          break;
      }
    }
    if (msg.type === 'data') {
      // 将fetcher子进程返回的数据转发给webServer、Librarian子进程
      // todo：设置stdin/stdout，pipe()方法连通
      if (subprocess_server) {
        subprocess_server.send(msg);
      }
      if (subprocess_lib) {
        subprocess_lib.send(msg);
      }
    }
  });
  worker_fetcher.on('close', (code, signal)=>{
    // log close event and re-init
    logger.fatal(`Worker_明文获取 - 退出 - Code ${code} Signal ${signal}`);
    logger.info(`Worker_明文获取 - 重启子进程 in 10s`);
    setTimeout(()=>{
      init_fetcher(source);
    },10000);
  });
  worker_fetcher.on('error', (err)=>{
    logger.error(`Worker_明文获取 - 错误 ${err}`);
  });
}


/* =============================== 初始化 =============================== */

/**
 * 启动参数
 * Default: localhost:30004 (树莓派作为接收机通过网线组网时的默认地址)
 * 通过 --source [address]:[port] 参数指定
 */
let src_plain = {
  address: 'localhost',
  port: 30004
};

const arguments = process.argv.splice(2);
for (let i = 0; i < arguments.length; i++) {
  if (arguments[i] === '--source') {
    let srcConfig;
    srcConfig = arguments[i + 1];
    if (srcConfig) {
      srcConfig = srcConfig.split(':');
      src_plain.address = srcConfig[0];
      src_plain.port = parseInt(srcConfig[1]);
    }
  }
  // todo: other configs
}


init_fetcher(src_plain);
init_webserver();
init_lib();