# RAG 前后端接口交接文档

内容：目前 main 的已实现api接口、前端页面与功能建议、A/B 库完整表结构及 E\-R 关系。

## 1\. 系统与对接约定



|项目|约定|
|---|---|
|后端|FastAPI；本地示例地址 `http://127.0.0.1:8000`，联调时替换为后端可访问地址|
|API 前缀|`/api`|
|请求|POST 使用 `Content-Type: application/json`；GET 参数放在查询字符串|
|文档|`/docs`（Swagger）、`/openapi.json`（实际接口模型）|
|A 库|`enterprise_source`，保存业务数据；后端通过 `SOURCE_DATABASE_URL` 读取|
|B 库|`compliance_result`，保存任务、结果和依据；后端通过 `TARGET_DATABASE_URL` 读写|
|知识库|Chroma 冻规/标准/规则库，与 A/B 两个 MySQL 库独立|
|前端连接|浏览器调用 API；A/B 库连接串配置在后端，不作为前端请求参数|
|跨域|当前没还有 实现CORS 中间件；开发使用前端代理转发 `/api`，部建议署使用同源反反向代理|
|鉴权|当前路由未实现登录、令牌校验及用户级结果隔离 ，只是实现了最基础的功能展示|
|标识|`run_id`、`field_id` 是 UUID 字符串；结果/依据/预测 ID 是整数|



\| 分页 \| `limit` 默认 100、范围 1–200；`offset` 默认 0、最小 0；返回数组，无 `total` \|



### 1\.1 RAG 主线与输出含义



```Plain Text
单字段 API / MySQL / CSV → FieldProfile
→ field_name + sample_values → 本地 Embedding → 冻结知识库 Top-3
→ 完整字段画像 + 检索依据 → 结构化 LLM
→ 分类结果 → API 返回或写入 B 库
```



当前冻结版本为 `b-rebuild-20260917`，快照包含分类规则及四份标准/指引，共 260 个块。Top\-K 固定为 3，前无需能传入检索策和或 Top\-K 参数。



|字段/枚举|展示含义|
|---|---|
|`is_personal` / `predicted_personal`|true：个人信息；false：非个人信息；null：未知，不能展示为非个人信息|
|`category` / `subcategory`|数据类别/子类别；当前无固定类别字典接口|
|`L1` / `L2` / `L3` / `L4`|项目定义：公开数据/内部数据/敏感数据/核心敏感数据|
|`UNKNOWN`|分类处理失败；不是正常分级等级|
|`confidence`|模型输出的分类置信度，0–1；不代表已校准的准确率|
|`score` / `relevance_score`|检索相关分数，裁剪至 0–1；不等同于分类置信度|
|`need_review`|建议人工复核；目前只支持查看和筛选，没有复核提交接口|
|`decision_path`|正常主线 `rag_llm`；失败可能为 `rag_llm_error`、`api_error`|
|任务状态|`RUNNING` 执行中；`SUCCESS` 成功；`PARTIAL_FAILED` 部分失败；`FAILED` 失败|



依据属于当次实际检索的知识片段，不表示模型逐条确认其全部适用性。`article` 可能为空或为层级标题，来源可能是企业分类规则。当前冻结快照没有原始页码，接口没有 PDF 链接或页码跳转字段。



### 1\.2 响应及错误处理



只有 `/api/classify` 使用 `{code,message,data}` 包装；其他接口直接返回对象或数组。



|情况|当前行为|前端处理|
|---|---|---|
|分类成功|HTTP 200，响应体 `code=200`|展示 `data`|
|分类处理失败|通常 HTTP 200，但 `code=500`、`level=UNKNOWN`、`need_review=true`|检查业务 code 和 level，展示失败及复核提示|
|参数错误|HTTP 422，`detail` 是校验错误数组|展示参数问题，例如非法 UUID、分页超限、额外请求字段|
|任务不存在|任务详情接口 HTTP 404，`{"detail":"... run not found"}`|展示任务不存在|
|数据库配置缺失|相关数据库接口 HTTP 503，`detail` 字符串|展示服务配置不可用|
|无匹配结果/依据|列表接口返回 `[]`；依据接口不单独检查 result 是否存在|展示空态，不能仅由空依据判定结果不存在|
|未捕获系统异常|可能 HTTP 500，不保证 JSON 格式|请求层支持通用错误提示|



健康接口仅返回服务存活标记，不是数据库、LLM 或检索链路的完整健康诊断。应用启动时会加载模型及检查知识库非空。



## 2\. 已实现接口

|编号|方法及路径|用途|响应模型|
|---|---|---|---|
|1|`GET /api/health`|健康检查|`{status:string}`|
|2|`POST /api/classify`|单字段分类|`ClassifyResponse`|
|3|`POST /api/pipeline/run`|同步数据库扫描分类|`PipelineSummary`|
|4<br>|`GET /api/runs/{run_id}`|数据库任务详情|`RunDetail`|
|5|`GET /api/results`|数据库分类结果列表|`ClassificationResultRow[]`|
|6|`GET /api/results/{result_id}/evidence`|结果检索依据|`ClassificationEvidenceRow[]`|
|7|`GET /api/benchmark/runs/{run_id}`|CSV/评测任务详情|`BenchmarkRunSummary`|
|8|`GET /api/benchmark/results`|CSV/评测逐字段结果|`BenchmarkPredictionRow[]`|

|9|`GET /api/runs`|分类历史列表|`PaginatedRuns[RunDetail]`|
|---|---|---|---|
|10|`GET /api/benchmark/runs`|CSV/评测历史列表|`PaginatedRuns[BenchmarkRunSummary]`|
|11|`GET /api/source/tables`|A 库基础表列表|`SourceTableMetadata[]`|
|12|`GET /api/source/fields`|A 库字段列表|`SourceFieldMetadata[]`|
|13|`GET /api/results/{result_id}`|完整分类详情|`ClassificationResultDetail`|
|14|`GET /api/results/statistics`|分类结果统计|`ClassificationStatistics`|
|15|`POST /api/csv/runs`|上传 CSV 并分类|`BenchmarkRunSummary`|
|16|`POST /api/classify/persist`|单字段分类并保存|`PersistClassifyResponse`|
|17|`GET /api/runs/{run_id}/failures`|逐字段失败记录|`FailurePage`|



### 2\.1 GET /api/health



无请求参数。响应：



```JSON
{"status":"ok"}
```



### 2\.2 POST /api/classify



请求体是 `FieldProfile`（完整字段定义见第 3 节）。`field_name` 必填；其余字段可按默认值省略。不接受额外字段。



```JSON
{
  "field_name": "mobile",
  "field_cn": "手机号",
  "field_comment": "客户联系电话",
  "data_type": "varchar(20)",
  "sample_values": ["13800000000"],
  "business_domain": "customer"
}
```



成功响应格式示例（以下理由和依据正文是占位说明）：



```JSON
{
  "code": 200,
  "message": "success",
  "data": {
    "field_name": "mobile",
    "is_personal": true,
    "category": "个人信息",
    "subcategory": "联系方式",
    "level": "L3",
    "confidence": 0.9,
    "reason": "示例分类理由，实际以模型返回为准。",
    "need_review": false,
    "decision_path": "rag_llm",
    "evidence": [
      {
        "source": "示例知识来源",
        "article": null,
        "content": "实际接口返回检索片段正文。",
        "score": 0.6,
        "chunk_id": "example-chunk"
      }
    ]
  }
}
```



该接口同步执行，直接返回依据；不写入 B 库，没有历史任务 ID。



### 2\.3 POST /api/pipeline/run



请求体为 `PipelineRequest`，可提交 `{}` 使用默认值。



|参数|类型|默认值/限制|含义|
|---|---|---|---|
|`table_names`|string\[\] 或 null|null；每个表名去空白后 1–256 字符|null/省略扫描配置源库全部基础表；空数组不扫描字段|
|`sample_limit`|integer|3；0–5|每个字段的采样数量；0 不采样|
|`continue_on_error`|boolean|true|字段失败后继续；false 在首次失败后停止|



```JSON
{"table_names":["employee","customer_account"],"sample_limit":3,"continue_on_error":true}
```



响应格式示例：



```JSON
{
  "run_id":"11111111-1111-4111-8111-111111111111",
  "source_database":"enterprise_source",
  "total_fields":23,
  "success_fields":23,
  "review_fields":2,
  "failed_fields":0,
  "status":"SUCCESS",
  "started_at":"2026-09-18T01:00:00Z",
  "finished_at":"2026-09-18T01:02:00Z"
}
```



该请求执行完毕才返回 `run_id`，不是异步提交。当前计数在任务结束时统一更新，不支持实时字段进度。`review_fields` 是成功字段中的待复核子集，不应再次计入总数。提前停止时 total 仍为扫描字段数，未处理字段不计入 failed，不能假定 success \+ failed 一定等于 total。空扫描最终为 FAILED。



后端读取 A 库元数据及样例，写入 B 库，不修改 A 库。MySQL 采样按字段名对身份证、电话、银行卡、邮箱等部分类型做掩码；不是对所有输入路径/所有敏感数据的统一脱敏。



### 2\.4 GET /api/runs/\{run\_id\}



`run_id` 必须是 UUID。返回 `RunDetail`：包含上述任务摘要，并增加 `source_system`、`model_name`、`knowledge_base_version`、`error_message`。不存在返回 HTTP 404。



### 2\.5 GET /api/results



所有参数均可选，多条件按 AND 精确匹配；暂不支持关键词模糊搜索或时间范围筛选。



|参数|类型|含义|
|---|---|---|
|`run_id`|UUID|某次数据库任务；省略可跨任务查询|
|`database_name`、`table_name`、`column_name`|string|库、表、列名|
|`level`|L1/L2/L3/L4|等级；不接受 UNKNOWN|
|`category`|string|类别|
|`need_review`、`is_personal`|boolean|待复核、个人信息条件|
|`limit`、`offset`|integer|第 1 节分页约定|



```HTTP
GET /api/results?run_id=11111111-1111-4111-8111-111111111111&need_review=true&limit=20&offset=0
```



返回 `ClassificationResultRow[]`，按 `created_at DESC, result_id DESC` 排序。结果行不含依据、完整输入快照、字段类型/注释和模型版本；模型版本从任务详情获取，依据用下一接口查询。同一字段多次任务会返回多条结果，不会自动只保留最新结果。



### 2\.6 GET /api/results/\{result\_id\}/evidence



`result_id` 为大于等于 1 的整数。返回 `ClassificationEvidenceRow[]`，按 `rank_no ASC` 排序。



```JSON
[
  {
    "evidence_id":1,
    "result_id":1,
    "rank_no":1,
    "document_name":"示例知识来源",
    "article":null,
    "content":"实际接口返回保存的检索片段正文。",
    "relevance_score":0.6,
    "chunk_id":"example-chunk"
  }
]
```



读取当次持久化依据，不会重新执行向量检索。注意与单字段响应的字段名映射：`source → document_name`、`score → relevance_score`。



### 2\.7 GET /api/benchmark/runs/\{run\_id\}



`run_id` 必须是 UUID。返回 `BenchmarkRunSummary`；不存在返回 HTTP 404。通过 `source_type=csv` 区分 CSV，通过 `input_mode=catalog/tabular` 区分目录/业务表格格式。



评分仅针对个人信息二分类，非 L1–L4 分级准确率。无真实标签时 Precision、Recall、F1、Accuracy、effective recall 为 null，前端显示“未评分”。`coverage_score` 是成功案例数/总案例数；普通 Recall 仅统计有标签且分类成功案例，effective recall 将有标签的正例失败也计入分母。



### 2\.8 GET /api/benchmark/results



|参数|类型|必填/默认|含义|
|---|---|---|---|
|`run_id`|UUID|必填|CSV/评测任务|
|`outcome`|TP/FP/TN/FN/FAILED/UNLABELED|否|真阳性/假阳性/真阴性/假阴性/失败/无标签|
|`predicted_personal`|boolean|否|预测个人信息条件|
|`need_review`|boolean|否|待复核条件|
|`limit`、`offset`|integer|100、0|第 1 节分页约定|



### 2\.9 GET /api/runs

status/source\_system/started\_from/started\_to 筛选；新分页对象；按 started\_at、run\_id 倒序。手动任务来源 manual。



### 2\.10 GET /api/benchmark/runs

status/source\_type=csv/mysql\_benchmark/source\_name/started\_from/started\_to 精确筛选；新分页对象，按 started\_at、run\_id 倒序。



### 2\.11 GET /api/source/tables

无参数；数组返回库名、表名、注释、column\_count；仅元数据，不读取业务行。



### 2\.12 GET /api/source/fields

table\_name 必填，1–256字符；按 ordinal\_position 升序，返回类型、注释、可空性和键，不采样。



### 2\.13 GET /api/results/\{result\_id\}

result\_id\>=1；包含 input\_snapshot、raw\_output、模型/知识库版本及保存的 evidence。raw\_output 是校验后的结构化输出，不是模型原始响应全文。



### 2\.14 GET /api/results/statistics

筛选与旧 results 一致；返回 total、levels 的 L1–L4 数量、personal\_count、review\_count；统计结果记录，不去重资产，不包含失败字段。



### 2\.15 POST /api/csv/runs

multipart：file必填；input\_mode=auto/catalog/tabular；可选limit\>=1、field\_name\_column、sample\_columns（逗号分隔）、label\_column、labels文件。同步返回 BenchmarkRunSummary。



### 2\.16 POST /api/classify/persist

JSON PersistentFieldProfile；资产标识 source\_system/database\_name/table\_name/field\_name 最多64字符，column\_key最多64；默认manual。不改变原 classify 限制。成功返回 result\_id，分类失败返回 failure\_id。



### 2\.17 GET /api/runs/\{run\_id\}/failures

UUID路径参数；新分页对象，按failure\_id升序；包含阶段ASSET\_WRITE/CLASSIFY/RESULT\_WRITE、错误摘要、画像和可用依据。旧任务可能没有逐字段失败记录。

```HTTP
GET /api/benchmark/results?run_id=22222222-2222-4222-8222-222222222222&limit=20&offset=0
```



返回 `BenchmarkPredictionRow[]`，按 `benchmark_id` 升序。每行内嵌 `sample_values` 和 `evidence[]`，数据库中的 `sample_values_json/evidence_json` 已由后端解析。当前不支持按等级或类别筛选此列表。



CSV 执行仍通过 `scripts.run_csv_pipeline`；目前没有上传、创建 CSV 任务或恢复任务的 HTTP 接口。前端先用后端提供的 run\_id 查看结果，不应将服务器本地文件路径作为上传接口。



## 3\. 请求与响应完整字段字典



下列字典从当前 Pydantic 模型生成。类型中的 null 表示响应允许空值；“必须出现”对应模型必填项，并不表示请求需传入所有响应字段。默认值为“—”表示无默认。`$ref` 指向本节同名模型。



### 3\.1 FieldProfile



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`schema_version`|"1\.0"|否|"1\.0"|—|
|`source_system`|string|否|"manual"|最短字符 1；最长字符 256|
|`database_name`|string|否|"manual"|最短字符 1；最长字符 256|
|`table_name`|string|否|"manual"|最短字符 1；最长字符 256|
|`table_comment`|string / null|否|null|最长字符 1000|
|`field_name`|string|是|—|最短字符 1；最长字符 128|
|`field_cn`|string / null|否|null|最长字符 256|
|`field_comment`|string / null|否|null|最长字符 1000|
|`data_type`|string|否|"unknown"|最短字符 1；最长字符 256|
|`is_nullable`|boolean|否|true|—|
|`column_key`|string / null|否|null|最长字符 256|
|`sample_values`|string\[\]|否|\[\]|最多项 5|
|`business_domain`|string|否|"general"|最长字符 256|



### 3\.2 PipelineRequest



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`sample_limit`|integer|否|3|最小值 0；最大值 5|
|`table_names`|string\[\] / null|否|null|—|
|`continue_on_error`|boolean|否|true|—|



### 3\.3 ClassifyResponse



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`code`|integer|否|200|—|
|`message`|string|否|"success"|—|
|`data`|ClassificationResult / null|否|null|—|



### 3\.4 ClassificationResult



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`field_name`|string|是|—|—|
|`is_personal`|boolean / null|否|null|—|
|`category`|string|是|—|—|
|`subcategory`|string / null|否|null|—|
|`level`|L1, L2, L3, L4, UNKNOWN|是|—|—|
|`confidence`|number|是|—|最小值 0\.0；最大值 1\.0|
|`reason`|string|是|—|—|
|`evidence`|Evidence\[\]|否|\[\]|—|
|`need_review`|boolean|是|—|—|
|`decision_path`|string|是|—|—|



### 3\.5 Evidence



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`content`|string|是|—|—|
|`source`|string|是|—|—|
|`article`|string / null|否|null|—|
|`score`|number / null|否|null|最小值 0\.0；最大值 1\.0|
|`chunk_id`|string / null|否|null|—|



### 3\.6 PipelineSummary



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`run_id`|uuid|是|—|—|
|`source_database`|string|是|—|—|
|`total_fields`|integer|是|—|最小值 0|
|`success_fields`|integer|是|—|最小值 0|
|`review_fields`|integer|是|—|最小值 0|
|`failed_fields`|integer|是|—|最小值 0|
|`status`|RUNNING, SUCCESS, PARTIAL\_FAILED, FAILED|是|—|—|
|`started_at`|date\-time|是|—|—|
|`finished_at`|date\-time / null|否|null|—|



### 3\.7 RunDetail



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`run_id`|uuid|是|—|—|
|`source_database`|string|是|—|—|
|`total_fields`|integer|是|—|最小值 0|
|`success_fields`|integer|是|—|最小值 0|
|`review_fields`|integer|是|—|最小值 0|
|`failed_fields`|integer|是|—|最小值 0|
|`status`|RUNNING, SUCCESS, PARTIAL\_FAILED, FAILED|是|—|—|
|`started_at`|date\-time|是|—|—|
|`finished_at`|date\-time / null|否|null|—|
|`source_system`|string|是|—|—|
|`model_name`|string|是|—|—|
|`knowledge_base_version`|string|是|—|—|
|`error_message`|string / null|否|null|—|



### 3\.8 ClassificationResultRow



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`result_id`|integer|是|—|—|
|`run_id`|uuid|是|—|—|
|`field_id`|uuid|是|—|—|
|`source_system`|string|是|—|—|
|`database_name`|string|是|—|—|
|`table_name`|string|是|—|—|
|`column_name`|string|是|—|—|
|`business_domain`|string|是|—|—|
|`category`|string|是|—|—|
|`subcategory`|string / null|否|null|—|
|`is_personal`|boolean / null|否|null|—|
|`level`|L1, L2, L3, L4|是|—|—|
|`confidence`|number|是|—|最小值 0\.0；最大值 1\.0|
|`reason`|string|是|—|—|
|`need_review`|boolean|是|—|—|
|`decision_path`|string|是|—|—|
|`created_at`|date\-time|是|—|—|



### 3\.9 ClassificationEvidenceRow



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`evidence_id`|integer|是|—|—|
|`result_id`|integer|是|—|—|
|`rank_no`|integer|是|—|最小值 1|
|`document_name`|string|是|—|—|
|`article`|string / null|否|null|—|
|`content`|string|是|—|—|
|`relevance_score`|number / null|否|null|最小值 0\.0；最大值 1\.0|
|`chunk_id`|string / null|否|null|—|



### 3\.10 BenchmarkRunSummary



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`total_cases`|integer|否|0|—|
|`success_cases`|integer|否|0|—|
|`failed_cases`|integer|否|0|—|
|`labeled_cases`|integer|否|0|—|
|`unlabeled_cases`|integer|否|0|—|
|`tp`|integer|否|0|—|
|`fp`|integer|否|0|—|
|`tn`|integer|否|0|—|
|`fn`|integer|否|0|—|
|`precision_score`|number / null|否|0\.0|—|
|`recall_score`|number / null|否|0\.0|—|
|`f1_score`|number / null|否|0\.0|—|
|`accuracy_score`|number / null|否|0\.0|—|
|`coverage_score`|number|否|0\.0|—|
|`effective_recall_score`|number / null|否|0\.0|—|
|`run_id`|uuid|是|—|—|
|`batch_name`|string|是|—|—|
|`personal_limit`|integer / null|否|null|—|
|`non_personal_limit`|integer / null|否|null|—|
|`source_type`|mysql\_benchmark, csv|否|"mysql\_benchmark"|—|
|`input_mode`|catalog, tabular / null|否|null|—|
|`source_name`|string / null|否|null|—|
|`source_fingerprint`|string / null|否|null|—|
|`label_fingerprint`|string / null|否|null|—|
|`status`|RUNNING, SUCCESS, PARTIAL\_FAILED, FAILED|是|—|—|
|`model_name`|string|是|—|—|
|`knowledge_base_version`|string|是|—|—|
|`started_at`|date\-time|是|—|—|
|`finished_at`|date\-time / null|否|null|—|
|`error_message`|string / null|否|null|—|



### 3\.11 BenchmarkPredictionRow



|字段|类型/枚举|必须出现|默认值|限制|
|---|---|---|---|---|
|`prediction_id`|integer|是|—|—|
|`run_id`|uuid|是|—|—|
|`benchmark_id`|integer|是|—|—|
|`field_name_snapshot`|string|是|—|—|
|`sample_values`|string\[\]|否|\[\]|—|
|`expected_personal`|boolean / null|是|—|—|
|`predicted_personal`|boolean / null|否|null|—|
|`outcome`|TP, FP, TN, FN, FAILED, UNLABELED|是|—|—|
|`category`|string / null|否|null|—|
|`subcategory`|string / null|否|null|—|
|`level`|string / null|否|null|—|
|`confidence`|number / null|否|null|—|
|`reason`|string / null|否|null|—|
|`need_review`|boolean / null|否|null|—|
|`decision_path`|string / null|否|null|—|
|`evidence`|Evidence\[\]|否|\[\]|—|
|`status`|SUCCESS, FAILED|是|—|—|
|`error_message`|string / null|否|null|—|
|`created_at`|date\-time|是|—|—|



## 4\. 前端建议页面与调用流程



### 4\.1 可基于现有接口实现



|页面/组件|页面功能|对接接口及限制|
|---|---|---|
|服务连接状态|显示服务可访问性|GET health；仅表示存活|
|单字段分类页|字段名、中文名、注释、类型、样例、业务域输入；提交后展示类别、等级、理由、置信度、复核标记|POST classify；直接展示 evidence；不保存历史|
|数据库批量分类页|手动填写表名或选择预置演示表；设置采样数及失败继续策略；等待并展示最终计数|POST pipeline/run；同步等待，暂无动态表名查询和实时进度|
|数据库结果列表|展示库/表/列、个人信息、类别、等级、置信度、时间；支持现有条件筛选及下一页|GET results；默认展示历史全部结果，建议固定 run\_id|
|数据库任务详情|状态、字段计数、模型和知识库版本、起止时间；进入该任务结果|GET runs/\{run\_id\}；无任务列表，需保存返回 ID 或输入 ID|
|分类详情及依据抽屉|使用结果行展示理由；按顺序展开来源、条款/层级、正文、分数、chunk ID|GET results/\{result\_id\}/evidence；没有独立完整结果详情接口|
|待复核视图|筛选 need\_review=true，展示复核提示及依据|GET results 或 benchmark/results；暂不能提交复核结论|
|CSV/评测结果页|输入 run\_id；任务摘要、逐字段结果、成功/失败、个人信息判定、样例与依据；有标签展示混淆矩阵及指标|GET benchmark/runs/\{run\_id\} 和 benchmark/results；无前端上传入口|



数据库批量分类调用顺序：



```Plain Text
填写表名与采样数 → POST /api/pipeline/run（等待完成）
→ 保存返回 run_id → GET /api/runs/{run_id}
→ GET /api/results?run_id=... → 点击某行 result_id
→ GET /api/results/{result_id}/evidence
```



请求期间禁用重复提交，并将任务 ID 写入页面 URL，以便刷新后查看。当前超时不能证明任务已终止；重复提交会创建新任务。任务计数是最终汇总，不适合据此制作实时百分比。



单字段/数据库/CSV 可以共用结果与依据组件，但请求层要映射 `field_name/column_name/field_name_snapshot`、`is_personal/predicted_personal`、`source/document_name`、`score/relevance_score`。等级 UNKNOWN、空值、无依据、无标签评分、网络错误均需要独立空态或错误提示。

## 5\. A/B 库表结构与对接关系



### 5\.1 数据流及连接配置



后端读取 A 库的字段元数据和少量样例，生成字段画像；RAG 分类结果及依据写入 B 库。A 的每一条业务行并不会在 B 产生一条结果：分类粒度是“字段/列”。



```Plain Text
SOURCE_DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:3306/enterprise_source
TARGET_DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:3306/compliance_result
```



连接信息由后端维护。前端现有可对接范围是“扫描 A 库 \+ 查询 B 库结果”，并没有 A 库业务记录浏览接口。若页面需要员工、客户、订单、商品的业务行展示，应另行补充后端接口，不能把本节表结构当作已实现的 API。



`data_field_asset` 的源系统、库、表、列名称映射 A 库字段；field\_id 根据这些标识生成稳定 UUID。同一字段跨任务身份稳定。A/B 之间没有跨库物理外键，不能把 A 的 employee\_id/customer\_id 等业务行主键关联到 B 的 field\_id。



### 5\.2 表结构说明



以下按建表 SQL 列出全部字段、可空性、默认值及完整约束。BOOLEAN 在 MySQL 中通常表现为 TINYINT\(1\)，API 中为 JSON boolean。JSON 列与 API 的解析字段见接口字典。



### 5\.2\.1 employee（员工信息）



所属：A 库 enterprise\_source；定义：\[sql/source\_schema\.sql\]\(\.\./sql/source\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`employee_id`|`VARCHAR(32)`|否|—|PK；员工内部编号|
|`employee_name`|`VARCHAR(64)`|否|—|员工姓名|
|`id_card_no`|`VARCHAR(18)`|否|—|员工身份证号码|
|`phone`|`VARCHAR(20)`|是|—|员工联系电话|
|`email`|`VARCHAR(128)`|是|—|员工工作邮箱|
|`gender`|`VARCHAR(16)`|是|—|员工性别|
|`birth_date`|`DATE`|是|—|出生日期|
|`home_address`|`VARCHAR(255)`|是|—|家庭住址|
|`salary`|`DECIMAL(12, 2)`|是|—|税前月工资|
|`department`|`VARCHAR(64)`|是|—|所属部门|
|`job_title`|`VARCHAR(64)`|是|—|职位名称|
|`join_date`|`DATE`|是|—|入职日期|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`employee_id`)
```



### 5\.2\.2 customer\_account（客户账户）



所属：A 库 enterprise\_source；定义：\[sql/source\_schema\.sql\]\(\.\./sql/source\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`customer_id`|`VARCHAR(32)`|否|—|PK；客户内部编号|
|`login_name`|`VARCHAR(64)`|否|—|登录账号|
|`real_name`|`VARCHAR(64)`|是|—|客户真实姓名|
|`mobile`|`VARCHAR(20)`|是|—|手机号|
|`email`|`VARCHAR(128)`|是|—|电子邮箱|
|`password_hash`|`VARCHAR(255)`|否|—|登录密码哈希|
|`bank_card_no`|`VARCHAR(32)`|是|—|绑定银行卡号|
|`registered_ip`|`VARCHAR(45)`|是|—|注册IP地址|
|`device_id`|`VARCHAR(128)`|是|—|登录设备编号|
|`account_status`|`VARCHAR(32)`|否|—|账户状态|
|`created_at`|`DATETIME`|否|—|创建时间|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`customer_id`),
  UNIQUE KEY `uq_customer_login_name` (`login_name`)
```



### 5\.2\.3 customer\_order（客户订单）



所属：A 库 enterprise\_source；定义：\[sql/source\_schema\.sql\]\(\.\./sql/source\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`order_id`|`VARCHAR(32)`|否|—|PK；订单编号|
|`customer_id`|`VARCHAR(32)`|否|—|客户编号|
|`receiver_name`|`VARCHAR(64)`|否|—|收货人姓名|
|`receiver_phone`|`VARCHAR(20)`|否|—|收货人联系电话|
|`delivery_address`|`VARCHAR(255)`|否|—|配送地址|
|`product_name`|`VARCHAR(128)`|否|—|商品名称|
|`order_amount`|`DECIMAL(12, 2)`|否|—|订单金额|
|`transaction_no`|`VARCHAR(64)`|是|—|支付交易流水号|
|`order_status`|`VARCHAR(32)`|否|—|订单状态|
|`created_at`|`DATETIME`|否|—|订单创建时间|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`order_id`),
  KEY `idx_order_customer_id` (`customer_id`)
```



### 5\.2\.4 product（商品信息）



所属：A 库 enterprise\_source；定义：\[sql/source\_schema\.sql\]\(\.\./sql/source\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`product_id`|`VARCHAR(32)`|否|—|PK；商品编号|
|`product_name`|`VARCHAR(128)`|否|—|商品名称|
|`category`|`VARCHAR(64)`|否|—|商品类别|
|`price`|`DECIMAL(12, 2)`|否|—|商品价格|
|`stock`|`INT`|否|—|库存数量|
|`supplier_name`|`VARCHAR(128)`|是|—|供应商名称|
|`description`|`VARCHAR(500)`|是|—|商品描述|
|`created_at`|`DATETIME`|否|—|创建时间|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`product_id`)
```



### 5\.2\.5 classification\_run（分类任务）



所属：B 库 compliance\_result；定义：\[sql/target\_schema\.sql\]\(\.\./sql/target\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`run_id`|`CHAR(36)`|否|—|PK|
|`source_system`|`VARCHAR(64)`|否|—|—|
|`source_database`|`VARCHAR(256)`|否|—|—|
|`status`|`VARCHAR(32)`|否|—|—|
|`total_fields`|`INT`|否|0|—|
|`success_fields`|`INT`|否|0|—|
|`review_fields`|`INT`|否|0|—|
|`failed_fields`|`INT`|否|0|—|
|`model_name`|`VARCHAR(128)`|否|—|—|
|`knowledge_base_version`|`VARCHAR(64)`|否|—|—|
|`started_at`|`DATETIME(6)`|否|—|—|
|`finished_at`|`DATETIME(6)`|是|—|—|
|`error_message`|`TEXT`|是|—|—|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`run_id`),
  CONSTRAINT `chk_run_status`
    CHECK (`status` IN ('RUNNING', 'SUCCESS', 'PARTIAL_FAILED', 'FAILED')),
  KEY `idx_run_status` (`status`),
  KEY `idx_run_started_at` (`started_at`)
```



### 5\.2\.6 data\_field\_asset（字段资产）



所属：B 库 compliance\_result；定义：\[sql/target\_schema\.sql\]\(\.\./sql/target\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`field_id`|`CHAR(36)`|否|—|PK|
|`source_system`|`VARCHAR(64)`|否|—|—|
|`database_name`|`VARCHAR(64)`|否|—|—|
|`table_name`|`VARCHAR(64)`|否|—|—|
|`table_comment`|`TEXT`|是|—|—|
|`column_name`|`VARCHAR(64)`|否|—|—|
|`column_comment`|`TEXT`|是|—|—|
|`data_type`|`VARCHAR(256)`|否|—|—|
|`is_nullable`|`BOOLEAN`|否|—|—|
|`column_key`|`VARCHAR(64)`|是|—|—|
|`business_domain`|`VARCHAR(256)`|否|—|—|
|`first_seen_at`|`DATETIME(6)`|否|—|—|
|`last_seen_at`|`DATETIME(6)`|否|—|—|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`field_id`),
  UNIQUE KEY `uq_field_identity`
    (`source_system`, `database_name`, `table_name`, `column_name`),
  KEY `idx_asset_database_table` (`database_name`, `table_name`),
  KEY `idx_asset_business_domain` (`business_domain`)
```



### 5\.2\.7 field\_classification\_result（字段分类结果）



所属：B 库 compliance\_result；定义：\[sql/target\_schema\.sql\]\(\.\./sql/target\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`result_id`|`BIGINT`|否|—|PK；自增|
|`run_id`|`CHAR(36)`|否|—|FK|
|`field_id`|`CHAR(36)`|否|—|FK|
|`category`|`VARCHAR(256)`|否|—|—|
|`subcategory`|`VARCHAR(256)`|是|—|—|
|`is_personal`|`BOOLEAN`|否|—|—|
|`level`|`VARCHAR(2)`|否|—|—|
|`confidence`|`DECIMAL(6, 5)`|否|—|—|
|`reason`|`TEXT`|否|—|—|
|`need_review`|`BOOLEAN`|否|—|—|
|`decision_path`|`VARCHAR(128)`|否|—|—|
|`input_snapshot_json`|`JSON`|否|—|—|
|`raw_output_json`|`JSON`|否|—|—|
|`created_at`|`DATETIME(6)`|否|—|—|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`result_id`),
  UNIQUE KEY `uq_run_field` (`run_id`, `field_id`),
  KEY `idx_result_level` (`level`),
  KEY `idx_result_category` (`category`),
  KEY `idx_result_need_review` (`need_review`),
  KEY `idx_result_field_id` (`field_id`),
  CONSTRAINT `fk_result_run`
    FOREIGN KEY (`run_id`) REFERENCES `classification_run` (`run_id`),
  CONSTRAINT `fk_result_field`
    FOREIGN KEY (`field_id`) REFERENCES `data_field_asset` (`field_id`)
```



### 5\.2\.8 classification\_evidence（分类法规依据）



所属：B 库 compliance\_result；定义：\[sql/target\_schema\.sql\]\(\.\./sql/target\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`evidence_id`|`BIGINT`|否|—|PK；自增|
|`result_id`|`BIGINT`|否|—|FK|
|`rank_no`|`INT`|否|—|—|
|`document_name`|`VARCHAR(512)`|否|—|—|
|`article`|`VARCHAR(256)`|是|—|—|
|`content`|`TEXT`|否|—|—|
|`relevance_score`|`DECIMAL(6, 5)`|是|—|—|
|`chunk_id`|`VARCHAR(256)`|是|—|—|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`evidence_id`),
  KEY `idx_evidence_result_id` (`result_id`),
  KEY `idx_evidence_document_name` (`document_name`),
  CONSTRAINT `fk_evidence_result`
    FOREIGN KEY (`result_id`) REFERENCES `field_classification_result` (`result_id`)
    ON DELETE CASCADE
```



### 5\.2\.9 benchmark\_run（字段识别评测任务）



所属：B 库 compliance\_result；定义：\[sql/benchmark\_target\_schema\.sql\]\(\.\./sql/benchmark\_target\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`run_id`|`CHAR(36)`|否|—|PK|
|`batch_name`|`VARCHAR(64)`|否|—|—|
|`personal_limit`|`INT`|是|—|—|
|`non_personal_limit`|`INT`|是|—|—|
|`source_type`|`VARCHAR(32)`|否|'mysql\_benchmark'|—|
|`input_mode`|`VARCHAR(16)`|是|—|—|
|`source_name`|`VARCHAR(255)`|是|—|—|
|`source_fingerprint`|`CHAR(64)`|是|—|—|
|`label_fingerprint`|`CHAR(64)`|是|—|—|
|`status`|`VARCHAR(32)`|否|—|—|
|`total_cases`|`INT`|否|0|—|
|`success_cases`|`INT`|否|0|—|
|`failed_cases`|`INT`|否|0|—|
|`labeled_cases`|`INT`|否|0|—|
|`unlabeled_cases`|`INT`|否|0|—|
|`tp`|`INT`|否|0|—|
|`fp`|`INT`|否|0|—|
|`tn`|`INT`|否|0|—|
|`fn`|`INT`|否|0|—|
|`precision_score`|`DECIMAL(10,8)`|是|—|—|
|`recall_score`|`DECIMAL(10,8)`|是|—|—|
|`f1_score`|`DECIMAL(10,8)`|是|—|—|
|`accuracy_score`|`DECIMAL(10,8)`|是|—|—|
|`coverage_score`|`DECIMAL(10,8)`|否|0|—|
|`effective_recall_score`|`DECIMAL(10,8)`|是|—|—|
|`model_name`|`VARCHAR(128)`|否|—|—|
|`knowledge_base_version`|`VARCHAR(64)`|否|—|—|
|`started_at`|`DATETIME(6)`|否|—|—|
|`finished_at`|`DATETIME(6)`|是|—|—|
|`error_message`|`TEXT`|是|—|—|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`run_id`),
  KEY `idx_benchmark_run_batch` (`batch_name`),
  KEY `idx_benchmark_run_started` (`started_at`)
```



### 5\.2\.10 benchmark\_prediction（字段识别逐案例预测）



所属：B 库 compliance\_result；定义：\[sql/benchmark\_target\_schema\.sql\]\(\.\./sql/benchmark\_target\_schema\.sql\)。



|字段|SQL 类型|允许 NULL|默认值|键/说明|
|---|---|---|---|---|
|`prediction_id`|`BIGINT`|否|—|PK；自增|
|`run_id`|`CHAR(36)`|否|—|FK|
|`benchmark_id`|`BIGINT`|否|—|—|
|`field_name_snapshot`|`VARCHAR(128)`|否|—|—|
|`sample_values_json`|`JSON`|否|—|—|
|`expected_personal`|`BOOLEAN`|是|—|—|
|`predicted_personal`|`BOOLEAN`|是|—|—|
|`outcome`|`VARCHAR(16)`|否|—|—|
|`category`|`VARCHAR(256)`|是|—|—|
|`subcategory`|`VARCHAR(256)`|是|—|—|
|`level`|`VARCHAR(8)`|是|—|—|
|`confidence`|`DECIMAL(10,8)`|是|—|—|
|`reason`|`TEXT`|是|—|—|
|`need_review`|`BOOLEAN`|是|—|—|
|`decision_path`|`VARCHAR(128)`|是|—|—|
|`evidence_json`|`JSON`|是|—|—|
|`status`|`VARCHAR(16)`|否|—|—|
|`error_message`|`TEXT`|是|—|—|
|`created_at`|`DATETIME(6)`|否|—|—|



约束与索引（与原 SQL 一致）：



```SQL
PRIMARY KEY (`prediction_id`),
  UNIQUE KEY `uq_benchmark_run_case` (`run_id`, `benchmark_id`),
  KEY `idx_benchmark_prediction_outcome` (`run_id`, `outcome`),
  CONSTRAINT `fk_benchmark_prediction_run`
    FOREIGN KEY (`run_id`) REFERENCES `benchmark_run` (`run_id`)
    ON DELETE CASCADE
```



### 5\.3 重要表语义



- A 库 `customer_order.customer_id` 与 `customer_account.customer_id` 是业务逻辑上的一对多关联，源 SQL 没有声明外键。`customer_order.product_name` 是文本，不是 product 外键，不按名称绘制商品关联。

- B 库 classification\_run 和 data\_field\_asset 分别与 field\_classification\_result 为一对多；field\_classification\_result 与 classification\_evidence 为一对多，删除结果时级联删除依据。

- benchmark\_run 与 benchmark\_prediction 为一对多，删除任务时级联删除预测。benchmark\_id 是案例标识，CSV 路径使用案例序号；当前 SQL 没有对应案例表或外键，不连接到 A 库业务主键。

- 同一 run\_id \+ field\_id 只保存一条数据库分类结果；不同任务各自保存。字段资产元数据可更新，历史完整画像应以结果的 input\_snapshot\_json 为准。

- raw\_output\_json 保存已校验的 ClassificationOutput 结构，不是模型原始响应全文。

- 数据库 UNKNOWN 不写入 field\_classification\_result；CSV 失败写入 benchmark\_prediction，但分类详情/依据可能为空。

- 本文 E\-R 图中的“1 对 0\.\.N”表示子记录可以不存在；实际执行 Top\-3 不等于 SQL 限制每个结果只能有 3 条依据。

## 6\. draw\.io E\-R 图文件

![A 库 E\-R 图\.png](图片和附件/A%20库%20E-R%20图.png)

![B 库 E\-R 图\.png](图片和附件/B%20库%20E-R%20图.png)

## 7\.说明：



- 目前后端部署了知识库和本地的 Embedding 模型，以及本地的MySQL的 A/B 库连接与配置。

- 仍未实现CORS跨域配置，建议使用同源Nginx的反向代理。以及未使用用户级鉴权配置以及JWT等中间件，无法检查用户信息，仅能进行功能展示。

- A库与B库仅在后端本地MySQL中存储，建议前端实现时先用mock占位处理。



