# @deepseek-ai/dsh-client-ui-mascot

English | [中文](README.zh.md)

Floating cost mascot injected into the frame-wide `shell.overlay` slot. It reads the system clock to classify the current moment as a DeepSeek peak window (01:00–04:00 and 06:00–10:00 UTC, full price) or off-peak (everything else, 50% off), shows a countdown to the next boundary, reads the account balance through the `usage` Remote, and accumulates an estimate of the current session's token cost from the host-computed `tokenUsage` projection (each token delta is priced at the window active when it is observed).

The mascot has three states — off-peak saving (green), peak caution (yellow), and low-balance danger (red) — rendered as an emoji placeholder until the user uploads a custom PNG per state from the gear menu. All user configuration (custom images, the low-balance threshold, currency, and token prices) is stored in `localStorage`, so the package has no Host settings namespace; its node half is an empty Loader seat.

## Model Experience

None. This package contributes browser presentation only; nothing here reaches a model request.

#### KV Cache effect

None; the widget neither assembles nor sends a provider request.

**Runtime invariant:** No companion is published. The package retains no mutable Host state, and its single `shell.overlay` occupant installs and leaves through one effect-owned registration.

## Known Limitations and Deferred Work

- **Estimated cost** — the `tokenUsage` projection is cumulative with no per-request timestamps, so each observed delta is priced at the current window rather than the request's true start time.
- **Balance is a point-in-time read** — refreshed once a minute; there is no push channel for balance changes.
- **Images are local** — custom mascot art is stored as `localStorage` data URLs and does not roam between browsers.
