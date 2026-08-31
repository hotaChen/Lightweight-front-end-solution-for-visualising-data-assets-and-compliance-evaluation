import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const databasePath = resolve(process.env.DATABASE_PATH || resolve(projectRoot, 'db/platform.sqlite'))
const schemaPath = resolve(projectRoot, 'db/schema.sql')
const mockPath = resolve(projectRoot, 'mock/platform.json')

export async function runSql(sql, json = false) {
  await mkdir(dirname(databasePath), { recursive: true })
  const args = json ? ['-json', databasePath] : [databasePath]
  return new Promise((resolvePromise, reject) => {
    const child = spawn('sqlite3', args)
    const outputChunks = []
    const errorChunks = []
    child.stdout.on('data', chunk => outputChunks.push(chunk))
    child.stderr.on('data', chunk => errorChunks.push(chunk))
    child.on('error', error => reject(new Error(`无法启动 sqlite3：${error.message}`)))
    child.on('close', code => {
      const output = Buffer.concat(outputChunks).toString('utf8')
      const errorOutput = Buffer.concat(errorChunks).toString('utf8')
      if (code !== 0) reject(new Error(errorOutput.trim() || `sqlite3 退出码 ${code}`))
      else resolvePromise(output)
    })
    child.stdin.end(sql)
  })
}

export async function queryRows(sql) {
  const output = await runSql(sql, true)
  return output.trim() ? JSON.parse(output) : []
}

function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function sqlNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`无效数字：${value}`)
  return String(number)
}

export async function initializeDatabase() {
  const schema = await readFile(schemaPath, 'utf8')
  const mock = JSON.parse(await readFile(mockPath, 'utf8'))
  await runSql(schema)
  const existing = await queryRows('SELECT COUNT(*) AS count FROM assets')
  if (existing[0]?.count > 0) return false

  const statements = ['BEGIN TRANSACTION;']
  for (const table of mock.tables) {
    statements.push(`INSERT INTO assets VALUES (${[table.id, table.name, table.cnName, table.domain, table.category, table.level, table.owner, table.updatedAt, table.riskScore, table.compliance, table.riskIssue, table.desc].map(sqlText).join(',')});`)
  }
  for (const table of mock.tables) {
    for (const field of table.fields) {
      statements.push(`INSERT INTO fields (asset_id,name,description,data_type,category,level,regulation) VALUES (${[table.id, field.name, field.desc, field.type, field.category, field.level, field.regulation].map(sqlText).join(',')});`)
    }
    for (const downstreamId of table.downstream) {
      statements.push(`INSERT INTO lineage VALUES (${sqlText(table.id)},${sqlText(downstreamId)});`)
    }
  }
  for (const point of mock.overview.trend) statements.push(`INSERT INTO trend_points VALUES (${sqlText(point.month)},${sqlNumber(point['新增'])},${sqlNumber(point['变更'])});`)
  for (const score of mock.risk.radar) statements.push(`INSERT INTO radar_scores VALUES (${sqlText(score.dimension)},${sqlNumber(score.score)});`)
  statements.push('COMMIT;')
  await runSql(statements.join('\n'))
  return true
}
