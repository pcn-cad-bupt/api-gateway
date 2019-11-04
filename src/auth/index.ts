// import * as express from 'express'
// import { ServiceInfo, ServiceObj } from './model/service';
// import { Token } from './jwt';
// import { TokenObj, TokenInfo } from './model/token';

// const app = express()
// app.use(express.json())

// app.get('/auth/service/add', async (req, res) => {
//   const name = req.query.name
//   if (name) {
//     const result = await ServiceInfo.create(name)
//     if (result) {
//       res.json({retCode: 200, retDesc: '新增成功'})
//     } else{
//       res.json({retCode: 400, retDesc: '新增失败'})
//     }
//   } else {
//     res.json({retCode: 400, retDesc: 'name不能为空'})
//   }
// })

// app.get('/auth/service/cancel', async (req, res) => {
//   const name = req.query.name
//   if (name) {
//     const result = await ServiceInfo.updateServiceStatus(name, false)
//     if (result) {
//       res.json({retCode: 200, retDesc: '取消成功'})
//     } else{
//       res.json({retCode: 400, retDesc: '取消失败'})
//     }
//   } else {
//     res.json({retCode: 400, retDesc: 'name不能为空'})
//   }
// })

// app.post('/auth/token/add', async (req, res) => {
//   const username    = req.body.username
//   const passwd      = req.body.passwd
//   const serviceName = req.body.serviceName
//   const expires     = req.body.expires
//   if (!username) {
//     res.json({retCode: 400, retDesc: 'username不能为空'})
//     return
//   }
//   if (!passwd) {
//     res.json({retCode: 400, retDesc: 'passwd不能为空'})
//     return
//   }
//   const token = await Token.sign(username, passwd, expires)
//   const tokenInfo = await Token.verify(token)
//   const tokenObj: TokenObj = {
//     token   : token,
//     username: username,
//     passwd  : passwd,
//     createAt: tokenInfo.iat,
//     expire  : tokenInfo.exp,
//     serviceName: 'all'
//   }
//   if (serviceName) {
//     tokenObj.serviceName = serviceName
//   }
//   const result = await TokenInfo.create(tokenObj)
//   if (result) {
//     res.json({retCode: 200, retDesc: '创建成功', token: token, expire: tokenInfo.exp})
//     return
//   }
//   res.json({retCode: 400, retDesc: '创建失败'})
// })

// app.post('/auth/token/verify', async (req, res) => {
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

// app.listen(8081, () => {
//   console.log('universe auth listen 8081')
// })