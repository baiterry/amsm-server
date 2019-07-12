# amsm-server
基于[express](https://github.com/expressjs/express)、[socket.io](https://github.com/socketio/socket.io)的amsm服务端，提供实时飞行数据、历史航班数据、航路点数据服务。

## API
- ws /flight 实时飞行数据
- GET /history/[date]/[flight] 指定日期/航班号的飞行历史
- GET /airwaypoints 航路点数据
- POST /airwaypoints {type, params} 航路点搜索
  - 矩形范围搜索
  ```javascript
  {
    type: 'range',
    params: {
      lon1: 1163500,
      lat1: 400400,
      lon2: 1163600,
      lat2: 400500
    }
  }
  ```
  - 圆形范围搜索
  ```javascript
  {
    type: 'radius',
    params: {
      lon: 1163548,
      lat: 400418,
      radius: 3000
    }
  }
  ```

## 部署

- 将数据库文件`airwaypoints.db`拷贝到工程目录下。

- 安装依赖
  ```bash
  $ yarn
  ```
  
- 通过PM2部署
  ```bash
  $ pm2 start main.js --name amsm-server -- --source localhost:30004
  ```
  `--name`参数指定服务别名。
  `--source`参数指定明文格式的报文数据所在地址。
