const fs = require('fs');
const path = require('path');
const async = require('async');
const app = require('express')();
const http = require('http').createServer(app);

// websocket server
const io = require('socket.io')(http, {
  path: '/flight'
});

// airway db
const APdb = require('../common/db.js');
let db_path = path.resolve(__dirname, '../airwaypoints.db');
const apdb = new APdb(db_path);

// logger
const wlogger = require('../common/wlogger');
const logger = new wlogger('Server ', './logs/main.log');

logger.info(`${process.pid} - 启动`);


/*=============================== web服务器相关 ===============================*/

app.get('/history/:date/:flight', function (req, res) {
  let flight = req.params.flight;
  let date = req.params.date;
  logger.info(`收到历史数据请求: ${date}/${flight} from ${req.ip}`);
  readFileLib(date, flight, (err, resBody) => {
    if (err) {
      logger.error(`历史数据读取错误: ${err}`);
    }
    else{
      res.json(resBody);
    }
  });
});

app.get('/airwaypoints', function (req, res) {
  logger.info(`收到航路点数据请求: from ${req.ip}`);
  apdb.findAll().then(points => {
    res.json(points);
  });
});

// websocket server
io.on('connection', (socket) => {
  logger.info(`ws - 用户连入, ${socket.handshake.address}`);
  socket.on('disconnect', () => {
    logger.info(`ws - 用户断开, ${socket.handshake.address}`);
  });
});


http.listen(20628, function(){
  logger.info(`listening on: 20628`);
});


// handle msg from Master
process.on('message', (msg) => {
  if (msg.type === 'data') {
    io.emit('flight', JSON.stringify(msg.content));
  }
});


/*============================ 检索相关 ============================*/

const readFileLib = (date, flight, mainCallback) => {
  let resBody = {
    'flight': flight,
    'exist': false,
    'start': '',
    'end': '',
    'history': []
  };
  async.waterfall([
    // check via file system
    // callback: err, exist
    function (callback) {
      let path = `./data/flight/${date}/${flight}.dat`;
      let exist = fs.existsSync(path);
      callback(null, exist);
    },

    // read file
    // callback: err, exist, data
    function (exist, callback) {
      if (!exist) {
        callback(null, false, null);
      }
      else{
        // todo: handle results more than 1
        // todo: read from files (flight cross days)
        let path = `./data/flight/${date}/${flight}.dat`;
        fs.readFile(path, (err, data) => {
          callback(err, true, data.toString());
        });
      }
    },

    // construct response body
    // callback: err, resBody
    function (exist, data, callback) {
      resBody.exist = exist;
      if (exist) {
        // let result = results[0];
        resBody.start = date;
        if (data) {
          // todo: construct data
          let his = data.split('\n');
          let history = [];
          for (let i = 0; i < his.length - 1; i ++) {
            let infos = his[i].split(',');
            let lon = parseFloat(infos[0]);
            let lat = parseFloat(infos[1]);
            let height = parseInt(infos[2]);
            let tick = [lon,lat,height];
            history.push(tick);
          }
          resBody.history = history;
        }
      }
      callback(null, resBody);
    }
  ], function (err, resbody) {
    mainCallback(err, resbody);
  });
};
