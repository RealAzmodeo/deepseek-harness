# @deepseek-ai/dsh-usage

[English](README.md) | 中文

宿主端 Remote（`ctx.usage`），代理 DeepSeek 的 `/user/balance` 接口，使 Web 客户端无需持有 DeepSeek API 密钥。`balance` Remote 方法在每次调用时从凭据层解析密钥，发起一次 `GET {baseUrl}/user/balance`，校验响应数据，并返回规范化且不含密钥的余额快照。密钥缺失与任何上游错误都会作为稳定的业务失败（`missing-credential` / `upstream`）返回而非抛出异常，因此浏览器调用方可以把它们渲染为“余额不可用”而非 RPC 故障。

该包无状态：两次调用之间不保留任何余额值或 API 密钥。可配置项为基地址与凭据引用（默认 `https://api.deepseek.com` 与 `DEEPSEEK_API_KEY`），均可从 cordis.yml 覆盖。Remote 命名空间与生成的客户端声明由 Typert 生成器在宿主构建阶段产出。

## Model Experience

无。这是面向浏览器的 Remote：智能体从不调用 `usage.balance`，此处内容不会进入任何模型请求。

#### KV Cache effect

无；该服务不会为模型组装或发送提供方请求。

## Known Limitations and Deferred Work

- **无缓存** — 每次调用都会重新读取上游余额；高频客户端应自行限流（吉祥物每 60 秒刷新一次）。
- **单一币种无关快照** — 原始 `balance_infos` 行被原样规范化；币种选择由调用方负责。
