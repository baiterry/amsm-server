/**
 * 解析秒包中JSON格式的数据，按flight航班号分文件存储。
 * 存储路径：./[date]/[flight].dat
 */


const fs = require('fs');
const dayjs = require('dayjs');

const wlogger = require('../common/wlogger');
const logger = new wlogger('Librarian', './logs/librarian.log');

// report & log worker start event
let msg = {
  type: 'ctrl',
  content: 'start'
};
process.send(msg);
logger.info(`${process.pid} - 启动`);


let Planes = {};
let Fresh = {};

// handle msg from Master
process.on('message', (msg) => {
  if (msg.type === 'data') {
    let data_json = msg.content;
    handleData(data_json);
  }
});

/**
 * 将收到的JSON数据按航班号写入文件
 * @param {*} planes 
 */
const handleData = (planes) => {
  for (let i in planes) {
    let plane = planes[i];
    if (!plane.flight) {
      continue; // ignore those who have no flight info
    }
    plane.flight = plane.flight.trim(); // delete the space

    // write file
    Planes[plane.hex] = plane;
    let tick = {
      flight: plane.flight,
      info: [plane.lon, plane.lat, plane.altitude, plane.track, plane.speed]
    };
    writeFile(tick);

    Fresh[plane.hex] = 0; // refresh FRESH LEVEL
  }
};

/**
 * 不断被调用的数据新鲜度检查，对超期120s的数据，视为已过期
 */
const freshCheck = () => {
  for (let i in Fresh) {
    Fresh[i] += 1;
    if (Fresh[i] > 120) {
      // out of date
      delete Fresh[i];
      delete Planes[i];
    }
  }
};


/**
 * 每天建立新目录
 * @param {string} date 
 */
const genNewDir = (date) => {
  let dir = './data/flight/' + date;
  fs.mkdirSync(dir, { recursive: true });
};


/**
 * 将该帧数据写入对应文件
 * @param {*} tick 
 */
const writeFile = (tick) => {
  let path = pathHead + tick.flight + '.dat';
  let msg = tick.info;
  let datafd = fs.openSync(path, 'a');
  let writeLen = fs.writeSync(datafd, msg, 'utf8');
  writeLen = fs.writeSync(datafd, '\n', 'utf8');
  fs.closeSync(datafd);
};




// init
let startDay = dayjs().format('YYYYMMDD');
let pathHead = './data/flight/' + startDay +'/';
genNewDir(startDay);


setInterval(()=>{
  // 新日期检查
  let today = dayjs().format('YYYYMMDD');
  if (today != startDay) {
    // re-init
    genNewDir(today);
    startDay = today;
    pathHead = './data/flight/' + startDay +'/';
    logger.info(`日期切换完成`);
  }

  // 离场检查
  freshCheck();
}, 1000);