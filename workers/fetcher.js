/**
 * 获取指定TCP服务器数据
 */

const net = require('net');

const wlogger = require('../common/wlogger');
const logger = new wlogger('Fetcher', './logs/main.log');

const msgbuilder = require('../common/msgbuilder');
const builder = new msgbuilder();

let pkg_to_send = [];

let read_old;

// config args
const arguments = process.argv.splice(2);
const source = {
  address: arguments[0],
  port: parseInt(arguments[1]),
};

// log transmitter config
logger.info(`${process.pid} - 启动`);
logger.info(`${process.pid} - 源: ${source.address} ${source.port}`);

// source socket config
const srcfd = net.createConnection(source.port, source.address, () => {
  logger.info(`${process.pid} 源 - 创建`);
});
srcfd.on('error',(err)=>{
  logger.error(`${process.pid} 源 - 错误 : ${err}`);
})
// 'close' follows 'error'
srcfd.on('close', ()=>{
  logger.warn(`${process.pid} 源 - 关闭`);
  let msg = {
    type: 'ctrl',
    content: 'kill'
  };
  process.send(msg);
})
srcfd.on('end', ()=>{
  logger.warn(`${process.pid} 源 - 收到对方关闭请求`);
})

// handle 'data' event
// send all data from src to des
srcfd.on('data', (data)=>{
  builder.trajectory(data.toString(), (msgs) => {
    pkg_to_send = pkg_to_send.concat(msgs);
  });
});


// send package 
setInterval(()=>{
  let msg = {
    type: 'data',
    content: pkg_to_send
  };
  process.send(msg);
  pkg_to_send = [];
},1000);

// heartbeat
setInterval(()=>{
  heartBeat();
},120000);

function heartBeat(){
  logger.info(`HeartBeat - ${process.pid} 源 - 活动 ${!srcfd.destroyed}, 已读 ${srcfd.bytesRead}`);
  if (!read_old) {
    read_old = srcfd.bytesRead;
  }
  else {
    if (read_old === srcfd.bytesRead) {
      // 读取数据无增长，重启fetcher
      logger.warn(`HeartBeat - 数据量无增长，请求重启`);
      let msg = {
        type: 'ctrl',
        content: 'kill'
      };
      process.send(msg);
    }
  }
}