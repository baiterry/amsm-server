/**
 * 消息构造器
 * 
 * 将所收到的字符串形式的ADS-B数据对应转换为JSON格式。
 * 
 * trajectory(msg, callback)适用于dump1090-tty程序
 * 在30004端口提供的trajectory形式的字符串明文数据。
 * 
 * 20190505 wyp
 * 
 */

module.exports = function () {

  this.trajectory = (rawMsg, callback) => {
    // return: msgs_json = [{}, {}, ..., {}]
    let msgs = rawMsg.split('*');
    // 头部检测
    let msgOp = msgs[0];
    if (msgOp[0] != '!') {
      // 不完整, 舍去
      let foo = msgs.shift();
      foo = null;
    }
    else {
      // 头部完整
    }
    // 舍去尾部
    msgs.pop();

    // 取出所需信息
    // version: 20190417 适用于已剔除时间戳&添加hex的dump1090tty-0417
    // trajectory format: !hex,flight,lon,lat,altitude,speed,track*
    let msgs_json = [];
    for (let i in msgs) {
      let tick = msgs[i].substring(1);
      let infos = tick.split(',');
      let tick_json = {};
      tick_json.hex = infos[0];
      tick_json.flight = infos[1];
      tick_json.lon = parseFloat(infos[2]);
      tick_json.lat = parseFloat(infos[3]);
      tick_json.altitude = parseInt(infos[4]);
      tick_json.speed = parseInt(infos[5]);
      tick_json.track = parseInt(infos[6]);
      msgs_json.push(tick_json);
    }
    
    callback(msgs_json);
  };

}