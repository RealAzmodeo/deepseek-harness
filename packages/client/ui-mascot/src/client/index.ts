/**
 * Cost mascot plugin, browser half: injects the floating mascot into the
 * frame-wide `shell.overlay` slot and reads the DeepSeek balance through the
 * `usage` Remote. All widget state is client-local (pricing windows from the
 * system clock, token cost from the session projection, images from
 * localStorage), so this package has no Host half beyond the empty loader row.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the generated ctx.remote merge (including the usage namespace).
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: pulls the ctx.locale service merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-layout SlotMap merge (the shell.overlay entry).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the ctx.slots service and the renderer's slot contract merges.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the useSessions global seat merge.
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { en, NS, zh, type MascotKey } from './locales.ts'
import { Mascot } from './Mascot.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Cost-mascot widget copy. */
    'mascot': MascotKey
  }
}

/** Required services: the overlay slot, the sessions feed, the locale registry, and the balance Remote. */
export const inject = ['slots', 'sessions', 'locale', 'remote', 'remote.usage']

/**
 * Client plugin body: register the dictionaries, then one `shell.overlay`
 * registration beside the other frame surfaces. The inject face supplies the
 * balance Remote thunk; the standard kit supplies `useSessions`.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-mascot: dictionaries')
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'cost-mascot',
    order: 100,
    locale: NS,
    inject: () => ({ balance: () => ctx.remote.usage.balance() }),
  }, Mascot))
}
