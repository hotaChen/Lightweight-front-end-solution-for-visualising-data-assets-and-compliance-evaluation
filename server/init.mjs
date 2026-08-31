import { initializeDatabase, databasePath } from './db.mjs'

const created = await initializeDatabase()
console.log(created ? `数据库已初始化：${databasePath}` : `数据库已存在：${databasePath}`)
