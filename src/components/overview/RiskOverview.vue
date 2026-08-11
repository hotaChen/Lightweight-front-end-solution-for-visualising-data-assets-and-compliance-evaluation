<template>
  <div class="risk-overview">
    <div class="section-heading">
      <div>
        <h2>合规风险概览</h2>
        <p>从总体评分和风险分布定位问题，再进入资产目录完成处置。</p>
      </div>
      <button type="button" class="action-button" @click="openRiskList()">
        查看风险处置清单
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
      </button>
    </div>

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
      <SummaryStat interactive icon-type="check" label="已合规" :value="compliant" desc="查看对应资产" accent="var(--chart-4)" @click="openRiskList({ status: '已合规' })" />
      <SummaryStat interactive icon-type="alert" label="待整改" :value="pending" desc="进入处置清单" accent="var(--chart-2)" @click="openRiskList({ status: '待整改' })" />
      <SummaryStat interactive icon-type="clock" label="超期整改" :value="overdue" desc="优先处置" accent="var(--chart-1)" @click="openRiskList({ status: '超期整改' })" />
    </div>

    <div class="charts-row">
      <section class="card chart-col-2">
        <div class="card-header">
          <h3 class="card-title">风险分布热力图</h3>
          <span class="card-desc">业务域 x 敏感等级的资产数量，点击有数据的单元格查看资产</span>
        </div>
        <div class="card-body"><RiskHeatmap @select="openHeatmapResult" /></div>
      </section>
      <section class="card chart-col-1">
        <div class="card-header">
          <h3 class="card-title">合规能力评估</h3>
          <span class="card-desc">六大维度合规成熟度</span>
        </div>
        <div class="card-body"><ComplianceRadar /></div>
      </section>
    </div>

    <div class="charts-row charts-row--bottom">
      <section class="card status-card">
        <div class="card-header">
          <h3 class="card-title">合规状态分布</h3>
          <span class="card-desc">全部 {{ DATA_TABLES.length }} 张资产表，点击状态进入处置清单</span>
        </div>
        <div class="card-body"><ComplianceStatusDonut @select="status => openRiskList({ status })" /></div>
      </section>
      <section class="risk-guide">
        <div>
          <span class="risk-guide-label">处置入口</span>
          <h3>在数据资产目录中集中处理风险</h3>
          <p>风险概览负责定位，风险处置视图负责搜索、组合筛选、排序和资产级跳转。</p>
        </div>
        <button type="button" class="action-button" @click="openRiskList()">进入风险处置</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Progress from '@/components/ui/Progress.vue'
import SummaryStat from '@/components/risk/SummaryStat.vue'
import RiskHeatmap from '@/components/risk/RiskHeatmap.vue'
import ComplianceRadar from '@/components/risk/ComplianceRadar.vue'
import ComplianceStatusDonut from '@/components/risk/ComplianceStatusDonut.vue'
import {
  COMPLIANCE_STATUS_STATS,
  DATA_TABLES,
  RISK_SUMMARY,
  type BusinessDomain,
  type ComplianceStatus,
  type SensitivityLevel,
} from '@/data'

const router = useRouter()
const overallScore = computed(() => RISK_SUMMARY.overallScore)
const pending = computed(() => COMPLIANCE_STATUS_STATS.find(item => item.status === '待整改')?.count ?? 0)
const overdue = computed(() => COMPLIANCE_STATUS_STATS.find(item => item.status === '超期整改')?.count ?? 0)
const compliant = computed(() => COMPLIANCE_STATUS_STATS.find(item => item.status === '已合规')?.count ?? 0)

function openRiskList(filters: { status?: ComplianceStatus; domain?: BusinessDomain; level?: SensitivityLevel } = {}) {
  void router.push({ path: '/catalog', query: { view: 'risk', ...filters } })
}

function openHeatmapResult(domain: BusinessDomain, level: SensitivityLevel) {
  openRiskList({ domain, level })
}
</script>

<style scoped>
.risk-overview { display: flex; flex-direction: column; gap: 1rem; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.section-heading h2 { font-size: 1rem; font-weight: 600; }
.section-heading p { margin-top: 0.2rem; color: var(--muted-foreground); font-size: 0.8125rem; }
.action-button { min-height: 2.25rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; flex: 0 0 auto; padding: 0 0.75rem; border-radius: var(--radius); background: var(--primary); color: var(--primary-foreground); font-size: 0.8125rem; font-weight: 500; }
.action-button:hover { opacity: 0.9; }
.card { min-width: 0; display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: var(--radius); background: var(--card); color: var(--card-foreground); }
.card-header { padding: 1.25rem 1.25rem 0.5rem; }
.card-body { flex: 1; padding: 0.5rem 1.25rem 1.25rem; }
.card-title { font-size: 1rem; font-weight: 600; }
.card-desc { display: block; margin-top: 0.125rem; color: var(--muted-foreground); font-size: 0.75rem; }
.top-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.score-card .card-header { padding-bottom: 0.5rem; }
.score-value { display: block; font-size: 1.875rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.score-unit { margin-left: 0.25rem; color: var(--muted-foreground); font-size: 1rem; font-weight: 400; }
.score-hint { margin-top: 0.5rem; color: var(--muted-foreground); font-size: 0.75rem; }
.charts-row { display: grid; grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr); gap: 1rem; }
.charts-row--bottom { grid-template-columns: minmax(18rem, 1fr) minmax(0, 2fr); align-items: stretch; }
.chart-col-1, .chart-col-2 { min-width: 0; }
.risk-guide { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius); background: color-mix(in oklab, var(--muted) 35%, transparent); }
.risk-guide-label { color: var(--primary); font-size: 0.75rem; font-weight: 600; }
.risk-guide h3 { margin-top: 0.2rem; font-size: 1rem; font-weight: 600; }
.risk-guide p { margin-top: 0.25rem; color: var(--muted-foreground); font-size: 0.8125rem; line-height: 1.5; }
@media (max-width: 1180px) {
  .top-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .section-heading, .risk-guide { align-items: flex-start; flex-direction: column; }
  .section-heading .action-button, .risk-guide .action-button { width: 100%; }
  .top-metrics { grid-template-columns: 1fr; }
}
</style>
