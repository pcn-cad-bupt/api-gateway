import * as jwt from 'jsonwebtoken'

const secret = 'universe-auth'

export interface TokenInfo {
  username: string,
  passwd  : string,
  iat     : number, // 创建时间
  exp     : number  // 过期时间
}
export class Token {
  // 时间单位为天
  public static async sign(username: string, passwd: string, expires?: number): Promise<string> {
    let expiresIn: number | string = '100y'
    if (expires) {
      expires = expires * 24 * 60 * 60
      expiresIn = expires
    }
    return jwt.sign({username: username, passwd: passwd}, secret, {expiresIn: expiresIn})
  }
  
  public static async verify(token: string): Promise<TokenInfo> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data as TokenInfo)
        }
      })
    })
  }
}
