import * as express from "express";
import { Timing } from "./util/Timing"
import { AdminRouter } from "./router/AdminRouter";
import { RegisterPlugin } from "./plugin/RegisterPlugin";
import { Router } from "./router/Router"
import { SwaggerFile } from "./util/SwaggerFile";

import * as bodyParser from "body-parser";
import * as http from 'http';
import { ServiceInfo } from "./auth/model/service";
import { Token } from "./auth/jwt";
import { TokenObj, TokenInfo } from "./auth/model/token";
let router = new AdminRouter().getRouter();
let registerPlugin: RegisterPlugin = new RegisterPlugin();
let registerApp = registerPlugin.getRegisterApp();
// 初始化注册
(async () => {
    await registerPlugin.init();
    registerApp.listen(8000);
})();


// 生成swagger文件
let swaggerFile: SwaggerFile = new SwaggerFile();
swaggerFile.generateFile();

// 单位时间内单位时间访问次数重置
new Timing().initTiming();


let adminApp = express();
adminApp.use(bodyParser.json());
adminApp.use(bodyParser.urlencoded({extended:true}));

adminApp.use("/", router);

adminApp.get('/auth/service/add', async (req, res) => {
  const name = req.query.name
  if (name) {
    const result = await ServiceInfo.create(name)
    if (result) {
      res.json({retCode: 200, retDesc: '新增成功'})
    } else{
      res.json({retCode: 400, retDesc: '新增失败'})
    }
  } else {
    res.json({retCode: 400, retDesc: 'name不能为空'})
  }
})

adminApp.get('/auth/service/cancel', async (req, res) => {
  const name = req.query.name
  if (name) {
    const result = await ServiceInfo.updateServiceStatus(name, false)
    if (result) {
      res.json({retCode: 200, retDesc: '取消成功'})
    } else{
      res.json({retCode: 400, retDesc: '取消失败'})
    }
  } else {
    res.json({retCode: 400, retDesc: 'name不能为空'})
  }
})

adminApp.post('/auth/token/add', async (req, res) => {
  const username    = req.body.username
  const passwd      = req.body.passwd
  const serviceName = req.body.serviceName
  const expires     = req.body.expires
  if (!username) {
    res.json({retCode: 400, retDesc: 'username不能为空'})
    return
  }
  if (!passwd) {
    res.json({retCode: 400, retDesc: 'passwd不能为空'})
    return
  }
  const token = await Token.sign(username, passwd, expires)
  const tokenInfo = await Token.verify(token)
  const tokenObj: TokenObj = {
    token   : token,
    username: username,
    passwd  : passwd,
    createAt: tokenInfo.iat,
    expire  : tokenInfo.exp,
    serviceName: 'all'
  }
  if (serviceName) {
    tokenObj.serviceName = serviceName
  }
  const result = await TokenInfo.create(tokenObj)
  if (result) {
    res.json({retCode: 200, retDesc: '创建成功', token: token, expire: tokenInfo.exp})
    return
  }
  res.json({retCode: 400, retDesc: '创建失败'})
})

// adminApp.post('/auth/token/verify', async (req, res) => {
//   const token = req.body.token
//   const serviceName = req.body.serviceName
//   if (!token) {
//     res.json({retCode: 400, retDesc: 'token不能为空'})
//     return
//   }
//   if (!serviceName) {
//     res.json({retCode: 400, retDesc: 'serviceName不能为空'})
//     return
//   }
//   const serviceInfo = await ServiceInfo.getSerivce(serviceName)
//   if (serviceInfo && serviceInfo.status === true) {
//     const result = await TokenInfo.getToken(token, serviceName)
//     if (result) {
//       res.json({retCode: 200, retDesc: '认证成功'})
//     } else{
//       res.json({retCode: 400, retDesc: '认证失败'})
//     }
//   } else {
//     res.json({retCode: 200, retDesc: '此服务不需要认证'})
//   }
// })


adminApp.listen(8001);
let wcy_router: Router = new Router();
http.createServer(
    function (request, response) {
        response.writeHead(200, {
            "Content-Type": "text/html;charset=utf-8"
        });

        wcy_router.handleRequest(request, response, http);

    }

).listen(8002);

process.on("uncaughtException", function (err) {
    console.log(err);
});


