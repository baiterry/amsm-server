/**
 * 由航路点数据构建r*树检索目录，提供搜索方法
 */

const KDBush = require('kdbush');

module.exports = class aptree {
  
  /**
   * init
   * @param {array} points 航路点数据
   */
  constructor(points) {
    this.tree = new KDBush(points, p => p.LONGITUDE, p => p.LATITUDE);
    this.points = points;
  }

  /**
   * 圆形范围检索
   * @param {number} lon 中心点经度
   * @param {number} lat 中心点纬度
   * @param {number} radius 搜索半径
   */
  search_radius(lon, lat, radius) {
    let index = this.tree.within(lon, lat, radius);
    let results = [];
    for (let i in index) {
      results.push(this.points[index[i]]);
    }
    return results;
  }

}