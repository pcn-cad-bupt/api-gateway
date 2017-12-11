"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LogModel_1 = require("../model/LogModel");
const TopPerformanceModel_1 = require("../model/TopPerformanceModel");
const SoursePerformanceModel_1 = require("../model/SoursePerformanceModel");
const sd = require("silly-datetime");
const GetIp_1 = require("../util/GetIp");
const fs = require("fs");
const util = require("util");
const os = require("os");
const osUtils = require("os-utils");
/**
 * 性能监控插件
 */
class PerformanceMonitorPlugin {
    constructor() {
        this._topPerformance = new TopPerformanceModel_1.TopPerformanceModel();
        this._soursePerformanceHost = '_soursePerformanceHost';
    }
    set soursePerformanceHost(soursePerformanceHost) {
        this._soursePerformanceHost = soursePerformanceHost;
    }
    get soursePerformanceHost() {
        return this._soursePerformanceHost;
    }
    /**
     *
     * @param req
     * @param res
     * @param next
     */
    logPerformanceMonitor(req, res, next) {
        let logModel = new LogModel_1.LogModel();
        logModel.time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        logModel.ip = GetIp_1.GetIP.getClientIP(req);
        logModel.status = 'succeed'; //默认为成功
        logModel.service = '访问服务';
        logModel.device = req.rawHeaders[5];
        req.on('end', function () {
            logModel.responseTime = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
            console.log(logModel.get());
        }).on('error', function () {
            logModel.status = 'error';
            console.log(logModel.get());
        });
        fs.writeFileSync('req', util.inspect(req, { depth: null })); //depth:null 展开全部层级
        next();
    }
    /**
* 一级网关能力平台性能监控1
* 获取系统自带信息,cpu,memory信息
*/
    topPerformanceMonitorCommen() {
        TopPerformanceModel_1.TopPerformanceModel.topPerformance.memoryUsage = ((os.totalmem() - os.freemem()) / os.totalmem()).toFixed(3);
        osUtils.cpuUsage(function (value) {
            TopPerformanceModel_1.TopPerformanceModel.topPerformance.cpuUsage = value;
        });
    }
    /**
   * 一级网关能力平台性能监控2
   * @param req
   * @param res
   * @param next
   *
   */
    topPerformanceMonitor(req, res, next) {
        TopPerformanceModel_1.TopPerformanceModel.topPerformance.totleVisit++;
        TopPerformanceModel_1.TopPerformanceModel.topPerformance.unitTimeTotleVisit++;
        TopPerformanceModel_1.TopPerformanceModel.topPerformance.concurrentVolume++;
        let visitTime = new Date();
        req.on('end', function () {
            let responseTime = new Date();
            //这里得到的时间是毫秒为单位
            let time = (responseTime.getTime() - visitTime.getTime());
            TopPerformanceModel_1.TopPerformanceModel.topPerformance.averageResponseTime = (TopPerformanceModel_1.TopPerformanceModel.topPerformance.averageResponseTime * (TopPerformanceModel_1.TopPerformanceModel.topPerformance.unitTimeTotleVisit - 1) + time) / TopPerformanceModel_1.TopPerformanceModel.topPerformance.unitTimeTotleVisit;
            TopPerformanceModel_1.TopPerformanceModel.topPerformance.concurrentVolume--;
        }).on('error', function () {
            TopPerformanceModel_1.TopPerformanceModel.topPerformance.concurrentVolume--;
        });
        next();
    }
    /**
    * 二级能力平台性能监控1
    * @param req
    * @param res
    * @param next
    */
    soursePerformanceMonitor(req, res, next) {
        //二级平台性能监控的的服务名称
        let serverName = this._soursePerformanceHost.toString() + req.originalUrl.toString();
        let SoursePerformance;
        let visitTime = new Date();
        if (SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.has(serverName)) {
            SoursePerformance = SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.get(serverName);
        }
        else {
            SoursePerformance = new SoursePerformanceModel_1.SoursePerformanceModel();
        }
        SoursePerformance.totleVisit++;
        SoursePerformance.unitTimeTotleVisit++;
        SoursePerformance.concurrentVolume++;
        SoursePerformance.serverName = serverName;
        SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.set(serverName, SoursePerformance);
        req.on('end', function () {
            SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.get(serverName).concurrentVolume--;
            let responseTime = new Date();
            //这里得到的时间是毫秒为单位
            let time = (responseTime.getTime() - visitTime.getTime());
            SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.get(serverName).averageResponseTime = (SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.get(serverName).averageResponseTime * (SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.get(serverName).unitTimeTotleVisit - 1) + time) / SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.get(serverName).unitTimeTotleVisit;
        }).on('error', function () {
            SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.get(serverName).concurrentVolume--;
        });
        SoursePerformanceModel_1.SoursePerformanceModel._soursePerformanceMap.forEach(function (value, key, map) {
            console.log(key + ' value= ' + value.totleVisit + ' ' + value.unitTimeTotleVisit + ' ' + value.concurrentVolume + ' ' + value.averageResponseTime);
        });
        next();
    }
}
exports.PerformanceMonitorPlugin = PerformanceMonitorPlugin;