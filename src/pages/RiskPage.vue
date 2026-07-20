<template>
  <AppShell :breadcrumbs="[{ label: '数据资产平台', href: '/' }, { label: '合规风险看板' }]">
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">合规风险看板</h1>
        <p class="page-desc">监控数据合规健康度、风险分布与待整改事项</p>
      </div>

      <!-- 顶部指标 -->
      <div class="top-metrics">
        <div class="score-card card">
          <div class="card-header">
            <span class="card-desc">综合合规评分</span>
            <span class="score-value">{{ overallScore }}<span class="score-unit">/ 100</span></span>
          </div>
          <div class="card-body">
            <Progress :value="overallScore" />
            <p class="score-hint">健康度良好，仍有改进空间</p>
          </div>
        </div>
        <SummaryStat icon-type="check" label="已合规" :value="compliant" desc="资产表数量" accent="var(--chart-4)" />
        <SummaryStat icon-type="alert" label="待整改" :value="pending" desc="需关注事项" accent="var(--chart-2)" />
        <SummaryStat icon-type="clock" label="超期整改" :value="overdue" desc="高优先级处置" accent="var(--chart-1)" />
      </div>

      <!-- 热力图 + 雷达 -->
      <div class="charts-row">
        <div class="chart-col-2">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">风险分布热力图</h3>
              <span class="card-desc">业务域 × 敏感等级的风险指数聚合，颜色越深风险越高</span>
            </div>
            <div class="card-body">
              <RiskHeatmap />
            </div>
          </div>
        </div>
        <div class="chart-col-1">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">合规能力评估</h3>
              <span class="card-desc">六大维度合规成熟度</span>
            </div>
            <div class="card-body">
              <ComplianceRadar />
            </div>
          </div>
        </div>
      </div>

      <!-- 状态分布 + 待办清单 -->
      <div class="charts-row">
        <div class="chart-col-1">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">合规状态分布</h3>
              <span class="card-desc">全部 {{ DATA_TABLES.length }} 张资产表</span>
            </div>
            <div class="card-body">
              <ComplianceStatusDonut />
            </div>
          </div>
        </div>

        <div class="chart-col-2">
          <div class="card card--no-pad">
            <div class="card-header" style="padding: 1.25rem 1.25rem 0.5rem">
              <h3 class="card-title">高风险资产待处置清单</h3>
              <span class="card-desc">按风险评分降序，点击查看详情</span>
            </div>
            <div class="card-body" style="padding: 0">
              <ul class="risk-table-list">
                <li v-for="t in topRisk" :key="t.id" class="risk-table-row">
                  <router-link :to="`/catalog/${t.id}`" class="risk-table-link">
                    <div class="rt-col">
                      <span class="rt-name">{{ t.cnName }}</span>
                      <span class="rt-domain">{{ t.domain }} · 负责人 {{ t.owner }}</span>
                    </div>
                    <Badges badge-type="level" :level="t.level" />
                    <Badges badge-type="compliance" :status="t.compliance" />
                    <div class="rt-score">
                      <Badges badge-type="risk" :score="t.riskScore" />
                    </div>
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import Badges from '@/components/Badges.vue'
import Progress from '@/components/ui/Progress.vue'
import SummaryStat from '@/components/risk/SummaryStat.vue'
import RiskHeatmap from '@/components/risk/RiskHeatmap.vue'
import ComplianceRadar from '@/components/risk/ComplianceRadar.vue'
import ComplianceStatusDonut from '@/components/risk/ComplianceStatusDonut.vue'
import { HIGH_RISK_TABLES, COMPLIANCE_STATUS_STATS, DATA_TABLES } from '@/data'

const overallScore = Math.round([78, 65, 84, 72, 88, 80].reduce((a, b) => a + b, 0) / 6)
const pending = COMPLIANCE_STATUS_STATS.find(s => s.status === '待整改')?.count ?? 0
const overdue = COMPLIANCE_STATUS_STATS.find(s => s.status === '超期整改')?.count ?? 0
const compliant = COMPLIANCE_STATUS_STATS.find(s => s.status === '已合规')?.count ?? 0
const topRisk = computed(() => HIGH_RISK_TABLES.slice(0, 6))
</script>

<style scoped>
.page {
  margin: 0 auto;
  max-width: 80rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.page-header { display: flex; flex-direction: column; gap: 0.25rem; }
.page-title { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.025em; }
.page-desc { font-size: 0.875rem; color: var(--muted-foreground); }

.card { border-radius: 0.625rem; border: 1px solid var(--border); background: var(--card); color: var(--card-foreground); display: flex; flex-direction: column; gap: 0; }
.card--no-pad { overflow: hidden; }
.card-header { padding: 1.25rem 1.25rem 0.5rem; }
.card-body { padding: 0.5rem 1.25rem 1.25rem; flex: 1; }
.card-title { font-size: 1rem; font-weight: 600; }
.card-desc { font-size: 0.75rem; color: var(--muted-foreground); display: block; margin-top: 0.125rem; }

.top-metrics { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 1024px) {
  .top-metrics { grid-template-columns: 1fr 1fr 1fr 1fr; }
}

.score-card .card-header { padding-bottom: 0.5rem; }
.score-value { font-size: 1.875rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.score-unit { font-size: 1rem; font-weight: 400; color: var(--muted-foreground); margin-left: 0.25rem; }
.score-hint { font-size: 0.75rem; color: var(--muted-foreground); margin-top: 0.5rem; }

.charts-row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 1024px) {
  .charts-row { grid-template-columns: 2fr 1fr; }
}
.chart-col-1 { min-width: 0; }
.chart-col-2 { min-width: 0; }

.risk-table-list { display: flex; flex-direction: column; }
.risk-table-row:first-child .risk-table-link { border-top: none; }
.risk-table-link {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--border); transition: background 0.15s; text-decoration: none; color: inherit;
}
.risk-table-link:hover { background: color-mix(in oklab, var(--muted) 50%, transparent); }
.rt-col { display: flex; flex-direction: column; gap: 0.125rem; flex: 1; min-width: 0; }
.rt-name { font-size: 0.875rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rt-domain { font-size: 0.75rem; color: var(--muted-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rt-score { width: 3rem; text-align: right; }
</style>
