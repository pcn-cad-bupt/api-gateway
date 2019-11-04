import {
  MongoClient,
  Db,
                  } from 'mongodb'

const isProd = process.env['NODE_ENV']

const host1 = 'dds-2ze08b5aef5540841155-pub.mongodb.rds.aliyuncs.com:3717'

const replSetName = 'mgset-3757479'
const username = 'qrcodeUser'
const password = 'qrcodeBestPsw'

// 数据库名称
const database = 'auth'
// const mongodbUrl = (isProd === 'production')
//   ? `mongodb://${username}:${password}@${host1}/${database}?replicaSet=${replSetName}&authMechanism=SCRAM-SHA-1`
//   : `mongodb://127.0.0.1:27017/${database}`

const mongodbUrl = 'mongodb://localhost:27017'

class DataAccess {
  public static DB: Db
  public static async connect() {
    if (this.DB) return
    try {
      const client: MongoClient  = await MongoClient.connect(mongodbUrl)
      const db: Db = client.db(database)
      this.DB = db

      if (!db) {
        console.log('cannot connect to mongodb')
      } else {
        console.log('connect to mongodb')
      }
    } catch (error) {
      console.log(error)
    }
  }
}

setTimeout(async () => {
  await DataAccess.connect()
}, 1)

export default DataAccess
