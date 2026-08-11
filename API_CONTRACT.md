# Platform Data API Contract

The frontend loads all business data from one endpoint and contains no asset records in `src/`.

## Endpoint

`GET {VITE_API_BASE_URL}/platform`

Default base URL: `/api`

The endpoint must return JSON directly with HTTP 200 and `Content-Type: application/json`.

## Response

```json
{
  "tables": [
    {
      "id": "t_payment",
      "name": "payment_record",
      "cnName": "支付流水表",
      "domain": "交易系统",
      "category": "财务数据",
      "level": "核心",
      "owner": "李伟",
      "updatedAt": "2026-06-07",
      "fieldCount": 20,
      "riskScore": 95,
      "compliance": "超期整改",
      "riskIssue": "主要风险问题",
      "desc": "资产描述",
      "upstream": ["t_order"],
      "downstream": ["t_finance_report"],
      "fields": [
        {
          "name": "bank_card",
          "desc": "银行卡号",
          "type": "VARCHAR(19)",
          "category": "财务数据",
          "level": "核心",
          "regulation": "个人金融信息保护"
        }
      ]
    }
  ],
  "overview": {
    "newLast30Days": 27,
    "trend": [{ "month": "6月", "新增": 27, "变更": 19 }]
  },
  "risk": {
    "overallScore": 78,
    "radar": [{ "dimension": "个人信息保护", "score": 78 }]
  }
}
```

## Validation Rules

- `level`: `核心 | 敏感 | 内部 | 公开`
- `category`: `个人信息 | 财务数据 | 业务数据 | 公开数据`
- `compliance`: `已合规 | 待整改 | 超期整改`
- `riskScore`, `overallScore`, and radar `score`: number from 0 to 100
- Every `upstream` and `downstream` ID must exist in `tables`
- Every table ID must be unique

Invalid responses are rejected before pages render. The application shows a retryable error state instead of partially rendering inconsistent data.

## Real Backend Configuration

Create `.env.production.local` without committing it:

```env
VITE_API_BASE_URL=https://your-backend.example.com/api
VITE_ENABLE_MOCK_API=false
```

The backend must allow the frontend origin through CORS when it is hosted on a different domain.

The local Vite Mock endpoint is development-only and `mock/platform.json` is not copied into the production `dist` bundle.
