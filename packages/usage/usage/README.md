# @deepseek-ai/dsh-usage

English | [中文](README.zh.md)

Host Remote (`ctx.usage`) that proxies DeepSeek's `/user/balance` endpoint so the Web client never holds the DeepSeek API key. The `balance` Remote method resolves the key from the credentials seam per call, issues one `GET {baseUrl}/user/balance`, validates the wire payload, and returns a normalized, non-secret balance snapshot. A missing credential and any upstream failure are returned as stable business failures (`missing-credential` / `upstream`) rather than thrown, so a browser caller renders them as an unavailable balance instead of an RPC fault.

The package is stateless: no balance value or API key is retained between calls. Configuration is the base URL and the credential reference (defaults `https://api.deepseek.com` and `DEEPSEEK_API_KEY`), both overridable from cordis.yml. The Remote namespace and generated client declaration are produced by the Typert generator during the Host build.

## Model Experience

None. This is a browser-facing Remote: the agent never calls `usage.balance`, and nothing here reaches a model request.

#### KV Cache effect

None; the service neither assembles nor sends a provider request to the model.

**Runtime invariant:** No companion is published. The service is stateless: each `balance` call resolves a credential and reads upstream without retaining either.

## Known Limitations and Deferred Work

- **No caching** — every call re-reads the balance from upstream; a busy client should throttle refresh itself (the mascot refreshes once a minute).
- **Single currency-agnostic snapshot** — the raw `balance_infos` rows are normalized verbatim; currency selection is the caller's concern.
