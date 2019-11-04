import DataAccess    from '../data-access'
import {
  Collection,
  InsertOneWriteOpResult,
                   } from 'mongodb'

export interface ServiceObj {
  name     : string,
  createAt : number,
  status   : boolean,
  modifyAt?: number,
}

export class ServiceInfo {

  public static async getSerivce(
    name: string,
    )        : Promise<ServiceObj | null> {

    const collection: Collection<ServiceObj> = DataAccess.DB.collection('service-info')
    const bot = await collection.findOne({ name: name })
    return bot
  }

  public static async updateServiceStatus(
    name: string,
    status: boolean,
    )        : Promise<ServiceObj | null> {

    const collection: Collection<ServiceObj> = DataAccess.DB.collection('service-info')
    const result = await collection.findOneAndUpdate({ name: name }, { $set: { status: status }})
    return result.value || null
  }

  public static async create(
    name: string,
    )        : Promise<InsertOneWriteOpResult<ServiceObj> | null> {

    const collection: Collection<ServiceObj> = DataAccess.DB.collection('service-info')
    const result = await collection.insertOne({
      name    : name,
      createAt: Math.floor(new Date().getTime()/1000),
      status  : true,
    })
    return result
  }

}