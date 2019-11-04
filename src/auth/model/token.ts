import DataAccess    from '../data-access'
import {
  Collection, InsertOneWriteOpResult,
                   } from 'mongodb'

export interface TokenObj {
  token       : string,
  username    : string,
  passwd      : string,
  createAt    : number,
  serviceName : string,
  expire?     : number,
}

export class TokenInfo {

  public static async getToken(
    token: string,
    serviceName?: string,
    )        : Promise<TokenObj | null> {

    const collection: Collection<TokenObj> = DataAccess.DB.collection('token-info')
    const bot = await collection.findOne({ token: token, serviceName: 'all' })
    if (bot) {
      return bot
    }
    return await collection.findOne({ token: token, serviceName: serviceName })
  }

  public static async create(
    obj: TokenObj,
    )        : Promise<InsertOneWriteOpResult<TokenObj> | null> {

    const collection: Collection<TokenObj> = DataAccess.DB.collection('token-info')
    const result = await collection.insertOne(obj)
    return result
  }

}