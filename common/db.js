const Sequelize = require('sequelize');
const KDBush = require('kdbush');

module.exports = class airwaydb {

  /**
   * 初始化Sequelize实例、AIRWAY_POINT表模型
   * @param {string} path 
   * @param {string} dbtype 
   */
  constructor(path, dbtype='sqlite') {
    this.index = null;
    this.points = null;

    this.sequelize = new Sequelize({
      dialect: dbtype,
      storage: path,
    });

    this.table = this.sequelize.define('AIRWAY_POINT', {
      // 属性
      AIRWAY_POINT_ID: {
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      AIRWAY_POINT_NAME: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      SOUTH_OR_NORTH: {
        type: Sequelize.CHAR(1),
      },
      LATITUDE: {
        type: Sequelize.STRING(50),
      },
      EAST_OR_WEST: {
        type: Sequelize.CHAR(1),
      },
      LONGITUDE: {
        type: Sequelize.STRING(50),
      },
    }, {
      // 参数
      timestamps: false,
    });

  }

  /**
   * 测试链接，异步地
   * @param {function(Error,boolean)} callback 
   */
  connectTest(callback) {
    this.sequelize.authenticate()
      .then(() => {
        console.log(`Connection has been established successfully.`);
        callback(null, true);
      })
      .catch((err) => {
        callback(err, false);
        console.error(new Error(err));
      })
  }

  /**
   * 查询全部 
   */
  findAll() {
    return new Promise((resolve, reject) => {
      this.table.findAll({
        attributes: ['AIRWAY_POINT_ID', 'AIRWAY_POINT_NAME', 'LATITUDE', 'LONGITUDE']
      })
      .then((res)=>{
        let points = [];
        for (let i in res) {
          points.push(res[i].dataValues);
        }
        this.points = points;
        resolve(points);
      })
      .catch((err) => {
        reject(new Error(err));
      });
    });
  }

  /**
   * 插入新AIRWAY_POINT
   * @param {number} id 
   * @param {string} name 
   * @param {string} south_or_north 
   * @param {string} latitude 
   * @param {string} east_or_west 
   * @param {string} longitude 
   */
  add(id, name, south_or_north, latitude, east_or_west, longitude) {
    this.table.create({
      AIRWAY_POINT_ID: id,
      AIRWAY_POINT_NAME: name,
      SOUTH_OR_NORTH: south_or_north,
      LATITUDE: latitude,
      EAST_OR_WEST: east_or_west,
      LONGITUDE: longitude
    });
  }

  refreshIndex() {
    return new Promise((resolve, reject) => {
      this.findAll().then((res) => {
        let index = new KDBush(res, p => p.LONGITUDE, p => p.LATITUDE);
        this.index = index;
        resolve(index);
      }, (err) => {
        reject(new Error(err));
      })
    }) 
  }

  search_range(lon1, lat1, lon2, lat2) {
    return new Promise((resolve, reject) => {
      if (!this.index) {
        this.refreshIndex()
        .then((index) => {
          resolve(index.range(lon1, lat1, lon2, lat2));
        }, (err) => {
          reject(new Error(err));
        })
      }
      else{
        resolve(this.index.range(lon1, lat1, lon2, lat2));
      }
    }) 
  }

  search_radius(lon, lat, radius) {
    return new Promise((resolve, reject) => {
      if (!this.index) {
        this.refreshIndex()
        .then((index) => {
          resolve(index.within(lon, lat, radius));
        }, (err) => {
          reject(new Error(err));
        })
      }
      else{
        resolve(this.index.within(lon, lat, radius));
      }
    }) 
  }
}
