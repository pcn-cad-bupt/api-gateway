import express = require("express");
import proxy = require("express-http-proxy");
import {PerformanceMonitorPlugin} from "./PerformanceMonitorPlugin"
import { request } from "https";
import { print } from "util";
import {CombinationUrlService} from "../service/CombinationUrlService";
import { ApiInfoService } from "../service/ApiInfoService";
import { GeneralResult } from "../general/GeneralResult";
import {AdminPlugin} from "../plugin/AdminPlugin";
import { CombinationPlugin } from "./CombinationPlugin";
import { UrlService } from "../service/UrlService";
import { config } from "bluebird";
import { Config } from "../config/config";
import {Request, Response} from "express";
let registerApp = express();
/**
 * 注册API数据
 */
class RegisterPlugin{
    private _registerApp = registerApp;
    public getRegisterApp(){
        return this._registerApp;
    }

    /**
     * 重新加载注册API
     * @param url 
     */
    public async loadData(url: { [key: string]: any }[]): Promise<void>{
        let data = new Map();
        // 保存真实的API服务地址
        let config: Config = new Config();
        let realhost: string = config.getApiServer().host + ":" + config.getApiServer().port;
        let combinationPlugin: CombinationPlugin = new CombinationPlugin();
        // _router数组存在数据，则清空
        if(this._registerApp._router){
            this._registerApp._router.stack.length = 2;
        }
        // 加载数据
        for(let i = 0; i < url.length; i++){
            // 注册原子API
            if(url[i].status == 0 && url[i].is_atom === "1"){
                let value = { "to": url[i].to, "status": url[i].status };
                data.set(url[i].from, value);
                let performanceMonitorPlugin:PerformanceMonitorPlugin =  new PerformanceMonitorPlugin();
                performanceMonitorPlugin.soursePerformanceHost = url[i].to ;
                this._registerApp.use(url[i].from,performanceMonitorPlugin.soursePerformanceMonitor.bind(performanceMonitorPlugin),proxy(url[i].to, {
                    proxyReqPathResolver: function (req) {
                        return req.originalUrl;
                    }
                }));
                // 为相关的API标注，以便后期注销
                this._registerApp._router.stack[this._registerApp._router.stack.length - 1].appId = url[i].APPId;
                this._registerApp._router.stack[this._registerApp._router.stack.length - 1].url = url[i].from;
            }
            // 注册分子API
            if (url[i].status == 0 && url[i].is_atom === "0") {
                let value = { "to": url[i].to, "status": url[i].status };
                data.set(url[i].from, value);
                this._registerApp.use(url[i].from, combinationPlugin.combinationService);
                // 为相关的API标注，以便后期注销
                this._registerApp._router.stack[this._registerApp._router.stack.length - 1].appId = url[0].appId;
                this._registerApp._router.stack[this._registerApp._router.stack.length - 1].url = url[i];
                data.set(url[i].from, { to: realhost, status: "0" });
            }
        }
        console.log(data);
    }


    /**
     * 添加注册
     * 使用swagger文件完成API注册版本管理
     * @param url 
     */
    public addData(url): void{
        let data = new Map();
        // 先清空之前已经注册公司的数据，再重新重新注册改公司的API数据
        let appId: string = url[0].APPId;
        if(this._registerApp._router && this._registerApp.stack){
            for(let i = 2; i < this._registerApp._router.stack.length; i++){
                if(this._registerApp._router.stack[i].appId === appId){
                    // 删除一个元素
                    this._registerApp._router.stack.splice(i, 1);
                    i--;
                }
            }
        }
        // 加载新数据
        for (let i = 0; i < url.length; i++) {
            let value = {"to": url[i].to, "status": url[i].status};
            data.set(url[i].from, value);
            if(url[i].status == 0){
                this._registerApp.use(url[i].from, proxy(url[i].to, {
                    proxyReqPathResolver: function (req) {
                        return req.originalUrl;
                    }
                }));
                // 为相关的API标注，以便后期注销
                this._registerApp._router.stack[this._registerApp._router.stack.length - 1].appId = url[0].appId;
                this._registerApp._router.stack[this._registerApp._router.stack.length - 1].url = url[i].from;
            }
        }
        console.log(data);
    }


    /**
     * 修改单个API信息
     * @param req 
     * @param res
     */
    public async updateSingleAPI(req: Request, res: Response): Promise<{[key: string]: any}>{
        let oldURL: string = req.query.oldURL;
        let newURL: string = req.query.newURL || oldURL;
        let APPId: string = req.query.APPId;
        
        // 查询要更改的API对应的信息是否存在
        let urlService: UrlService = new UrlService();
        let apiInfoService: ApiInfoService = new ApiInfoService();
        let urlResult: GeneralResult = await urlService.query({"from": oldURL, "APPId": APPId});
        let apiInfoResult: GeneralResult = await apiInfoService.query({"appId": APPId, "URL": oldURL});

        // 修改单个API
        if(urlResult.getResult() === false){
            return new GeneralResult(false, "需要修改的API对应的URL不存在，请检查输入是否正确", null).getReturn();
        }
        // 数据库表url对应的字段
        let url: {[key: string]: any} = {
            "APPId": APPId,
            "from": newURL,
            "to": urlResult.getDatum()[0].to,
            "status": req.query.status || "",
            "is_new": 1,
            "method": req.query.method || "",
            "is_atom": 1,
            "register_time": "",
            "publisher": ""
        };
        let apiInfo: {[key: string]: any} = {
            "appId": APPId,
            "name": req.query.name || "",
            "type": req.query.type || "",
            "argument": req.query.argument,
            "event": req.query.event,
            "URL": newURL,
            "status": req.query.status || ""
        } 
        this.removeSingleAPIFromMemory(url);
        url.from = url.newFrom;
        this.addSingleAPIToMemory(url);

        // 数据持久化存储
        urlService.updateSelectiveByAPPIdAndFrom(url);
        apiInfoService.updateSelectiveByAppIdAndURL(apiInfo);
        return new GeneralResult(true, null, null).getReturn();
    }

    /**
     * 根据url和APPID注销一个API
     * @param APPId 使用API网关的公司对应的APPId
     * @param from 注销API对应的URL
     */
    public async removeSingleAPI(req: Request, res: Response){
         let APPId: string = req.query.APPId;
         let from: string = req.query.from;
        // 查询要更改的API对应的信息是否存在
        let urlService: UrlService = new UrlService();
        let apiInfoService: ApiInfoService = new ApiInfoService();
        let generalResult: GeneralResult = await urlService.query({"from": from, "APPId": APPId});
        // 注销单个API
        if(generalResult.getResult() === false){
            return new GeneralResult(false, "需要注销的url不存在，请检查您的输入", null).getReturn();
        }
        let result: Boolean = this.removeSingleAPIFromMemory({"from": from, "APPId": APPId});
        // 数据库表url对应的字段
        let url: {[key: string]: any} = {
            "APPId": APPId,
            "from": from,
            "to": "",
            "status": "1",
            "is_new": "1",
            "method": req.query.method || "",
            "is_atom": "1",
            "register_time": "",
            "publisher": ""
        };
        let apiInfo: {[key: string]: any} = {
            "appId": APPId,
            "name": "",
            "type": "",
            "argument": "",
            "event": "",
            "URL": from,
            "status": "1"
        } 
        urlService.updateSelectiveByAPPIdAndFrom(url);
        apiInfoService.updateSelectiveByAppIdAndURL(apiInfo);
        return new GeneralResult(true, null, null);
    }
        
    /**
     * 注册单个API
     * @param url 数据库表url对应的字段
     * @param APIInfo 数据库表API_info对应的字段
     */
    public async addSingleAPI(req: Request, res: Response){
        let from: string = req.body.from;
        let APPId: string = req.body.APPId;
        // 查询要更改的API对应的信息是否存在
        let urlService: UrlService = new UrlService();
        let apiInfoService: ApiInfoService = new ApiInfoService();
        let generalResult: GeneralResult = await urlService.query({"from": from, "APPId": APPId});
        // 增加单个API
        if(generalResult.getResult() === true){
            return new GeneralResult(false, "此URL已经存在，无法添加", null).getReturn();
        }
        // 数据库表url对应的字段
        let url: {[key: string]: any} = {
            "APPId": APPId,
            "from": from,
            "to": req.body.to,
            "status": req.query.status,
            "is_new": 1,
            "method": req.query.method,
            "is_atom": 1,
            "register_time": new Date().toLocaleString(),
            "publisher": req.body.userName
        };
        let apiInfo: {[key: string]: any} = {
            "appId": APPId,
            "name": req.body.name || "",
            "type": req.body.type || "",
            "argument": req.body.argument || "",
            "event": req.body.event || "",
            "URL": from,
            "status": req.body.status
        } 
        this.addSingleAPIToMemory(url);
        // 持久化存储
        urlService.insert([url]);
        apiInfoService.insert([apiInfo]);
        return new GeneralResult(true, null, null).getReturn();
    }


    /**
     * 注册一个API
     * @param url 
     */
    private addSingleAPIToMemory(url: {[key: string]: any}): Boolean{
        let data = new Map();
        let value = {"to": url.to, "status": url.status};
        data.set(url.from, value);
        if(url.status == 0){
            this._registerApp.use(url.from, proxy(url.to, {
                proxyReqPathResolver: function (req) {
                    return req.originalUrl;
                }
            }));
            // 为相关的API标注，以便后期注销
            this._registerApp._router.stack[this._registerApp._router.stack.length - 1].appId = url.appId;
            this._registerApp._router.stack[this._registerApp._router.stack.length - 1].url = url.from;
            return true;
        }
        return false;
    }

    /**
     * 注销一个API
     * @param url 
     */
    private removeSingleAPIFromMemory(url: {[key: string]: any}): Boolean{
        let data = new Map();
        // 先清空之前已经注册公司的数据，再重新重新注册改公司的API数据
        let appId: string = url.APPId;
        if(this._registerApp._router && this._registerApp.stack){
            for(let i = 2; i < this._registerApp._router.stack.length; i++){
                if(this._registerApp._router.stack[i].appId === appId && this._registerApp._router.stack[i].url === url.from){
                    // 删除一个元素
                    this._registerApp._router.stack.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
        return true;
    }

    /**
     * 初始化系统时从数据库读取数据进行注册
     */
    public async init(): Promise<void>{
        let urlService: UrlService = new UrlService();
        let apiInfoService: ApiInfoService = new ApiInfoService();
        // 获取url表中的所有数据
        let urlResult: GeneralResult = await urlService.query({});
        await this.loadData(urlResult.getDatum());
        
    }
}
export{RegisterPlugin};