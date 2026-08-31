import { createServer } from 'node:http'
import { initializeDatabase, queryRows } from './db.mjs'

const port = Number(process.env.API_PORT || 8787)

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  })
  response.end(JSON.stringify(payload))
}

async function platformSnapshot() {
  const assets = await queryRows(`SELECT id, name, cn_name AS cnName, domain, category, level, owner, updated_at AS updatedAt, risk_score AS riskScore, compliance, risk_issue AS riskIssue, description AS desc FROM assets ORDER BY id`)
  const fields = await queryRows(`SELECT asset_id AS assetId, name, description AS desc, data_type AS type, category, level, regulation FROM fields ORDER BY asset_id, id`)
  const relations = await queryRows('SELECT upstream_id AS upstreamId, downstream_id AS downstreamId FROM lineage')
  const trends = await queryRows('SELECT month, added AS "新增", changed AS "变更" FROM trend_points ORDER BY rowid')
  const radar = await queryRows('SELECT dimension, score FROM radar_scores ORDER BY rowid')
  const fieldMap = new Map()
  for (const field of fields) {
    if (!fieldMap.has(field.assetId)) fieldMap.set(field.assetId, [])
    const { assetId, ...assetField } = field
    fieldMap.get(assetId).push(assetField)
  }
  const upstreamMap = new Map()
  const downstreamMap = new Map()
  for (const relation of relations) {
    if (!upstreamMap.has(relation.downstreamId)) upstreamMap.set(relation.downstreamId, [])
    if (!downstreamMap.has(relation.upstreamId)) downstreamMap.set(relation.upstreamId, [])
    upstreamMap.get(relation.downstreamId).push(relation.upstreamId)
    downstreamMap.get(relation.upstreamId).push(relation.downstreamId)
  }
  const tables = assets.map(asset => ({
    ...asset,
    fieldCount: fieldMap.get(asset.id)?.length || 0,
    fields: fieldMap.get(asset.id) || [],
    upstream: upstreamMap.get(asset.id) || [],
    downstream: downstreamMap.get(asset.id) || [],
  }))
  const newestDate = Date.now() - 30 * 24 * 60 * 60 * 1000
  const newLast30Days = tables.filter(table => Date.parse(table.updatedAt) >= newestDate).length
  return { tables, overview: { newLast30Days, trend: trends }, risk: { overallScore: radar.length ? Math.round(radar.reduce((sum, item) => sum + item.score, 0) / radar.length) : 0, radar } }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }); response.end(); return }
  if (request.method === 'GET' && new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname === '/api/platform') {
    try { sendJson(response, 200, await platformSnapshot()) } catch (error) { sendJson(response, 500, { message: error instanceof Error ? error.message : '数据库查询失败' }) }
    return
  }
  sendJson(response, 404, { message: 'Not Found' })
})

initializeDatabase().then(() => server.listen(port, () => console.log(`数据 API 已启动：http://localhost:${port}/api/platform`))).catch(error => { console.error(error); process.exitCode = 1 })
