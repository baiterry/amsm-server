/**
 * 
 */

const fs = require('fs');
const dayjs = require('dayjs');

const write = (path, msg) => {
  let fd = fs.openSync(path, 'a');
  let bytesWritten = fs.writeSync(fd, msg);
  fs.closeSync(fd);
  return bytesWritten;
};

const buildHeadMsg = (name, level, msg) => {
  let head = `[${dayjs().format('YYYYMMDDTHH:mm:ss')}]`;
  head += ` `;
  head += `[${name}]`;
  head += ` `;
  head += `[${level}]`;
  if (level != 'ERROR' && level != 'FATAL') {
    head += ` `; // add a space for a more readable format on ERROR and FATAL level
  }
  head += ` : `;
  head += `${msg}`;
  head += `\n`;
  return head;
}

module.exports = function (name, path){

  this.info = (msg) => {
    let head = buildHeadMsg(name, 'INFO', msg);
    return write(path, head);
  };

  this.error = (msg) => {
    let head = buildHeadMsg(name, 'ERROR', msg);
    return write(path, head);
  };

  this.warn = (msg) => {
    let head = buildHeadMsg(name, 'WARN', msg);
    return write(path, head);
  };

  this.fatal = (msg) => {
    let head = buildHeadMsg(name, 'FATAL', msg);
    return write(path, head);
  };
};
