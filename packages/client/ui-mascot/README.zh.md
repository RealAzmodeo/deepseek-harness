# @deepseek-ai/dsh-client-ui-mascot

[English](README.md) | 中文

注入到整帧 `shell.overlay` 槽位的悬浮成本吉祥物。它读取系统时钟，把当前时刻判定为 DeepSeek 高峰窗口（UTC 01:00–04:00 与 06:00–10:00，全价）或低谷（其余时间，五折），显示到下一窗口切换的倒计时，通过 `usage` Remote 读取账户余额，并基于宿主计算的 `tokenUsage` 投影累计当前会话的 token 成本估算（每段 token 增量按被观察到时所处的窗口计价）。

吉祥物有三种状态——低谷省钱（绿色）、高峰谨慎（黄色）、余额不足危险（红色）——默认以 emoji 占位，用户可从齿轮菜单为每种状态上传自定义 PNG。所有用户配置（自定义图片、低余额阈值、币种与 token 单价）都存储在 `localStorage` 中，因此该包没有宿主设置命名空间；其 node 侧只是一个空的 Loader 席位。

## Model Experience

无。该包仅提供浏览器呈现；此处内容不会进入任何模型请求。

#### KV Cache effect

无；该组件既不会组装也不会发送提供方请求。

## Known Limitations and Deferred Work

- **估算成本** — `tokenUsage` 投影是累计值且无逐请求时间戳，因此每段观测到的增量都按当前窗口计价，而非该请求的真实起始时刻。
- **余额为即时读数** — 每 60 秒刷新一次；余额变化没有推送通道。
- **图片仅存本地** — 自定义吉祥物图片以 `localStorage` data URL 存储，不会跨浏览器漫游。
