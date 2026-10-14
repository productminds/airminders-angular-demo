# AirMinders — Angular

Angular port of the AirMinders booking flow (`../app` is the React original).
Same product spec (`../docs/specs.md`), same design system, same Amplitude
tracking plan — and the Amplitude → `dataLayer` mirroring described in
**"Espelhamento da taxonomia Amplitude no dataLayer (GTM)"**.

## Running

```bash
npm install
npm start          # http://localhost:4200
```

Other scripts: `npm run build`, `npm test`, `npm run lint`, `npm run format`.

> `.npmrc` sets `legacy-peer-deps=true` (as the React app does) because
> `lucide-angular` still declares a peer range that stops at Angular 21. That
> flag also stops npm installing peers it would otherwise pull in, which is why
> `vite` — Vitest's peer — is listed explicitly in `devDependencies`.

## Architecture

| Layer                | Responsibility                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| `components/`        | Presentation only (`components/ui/` holds the design-system primitives)    |
| `containers/`        | One routed component per step of the flow                                  |
| `stores/`            | State and effects — the Angular counterpart of the React containers' hooks |
| `services/mock-api/` | Simulated business responses (`specs.md` §3.3)                             |
| `analytics/`         | Ampli wrapper, the facade over it, and the GTM mirroring plugin            |

`specs.md` §4.2 journey IDs live in `stores/journey.store.ts` (root-provided,
spans the whole journey). The step-to-step data lives in
`stores/booking-flow.store.ts`, provided on the flow's **route** so the step
guards in `guards/step-guards.ts` and the screens share one instance.

### Forced failure scenarios (RF-12)

Append to any URL: `?mockScenario=empty|timeout|validationFail|paymentDeclined`.
Pin the pseudo-random seed with `&mockSeed=1234` to reproduce a result set.
Note that navigating between steps drops the query string.

## Analytics

`analytics/` is the only place allowed to import `analytics/ampli` — everything
else injects the `Analytics` facade, which takes camelCase domain data and owns
the snake_case property names and every tracking-plan vocabulary mapping
(`../docs/AMPLI-CLI.md` §3).

### The dataLayer mirror

`DataLayerDestinationPlugin` is a Browser SDK 2 **destination plugin**
(taxonomy doc §6.4, alternative D), registered in `analytics.initializer.ts`.
Every event the SDK processes is pushed to `window.dataLayer` in the same
processing cycle — no waiting on the batch upload (RNF01), and a push failure
is caught and isolated from the Amplitude send (RNF02). Each push carries the
GA4-normalized `event` name, the original taxonomy under the `amplitude`
namespace for traceability (RF02), and `_clear: true` so GTM's recursive merge
cannot leak one event's properties into the next (§8.2).

`user_id` and `user_properties` are withheld by default (RNF03); enabling them
exposes them to every tag in the container. `environment.dataLayerAllowlist`
narrows which events are forwarded, per the rollout phases in §14.1.

Initialization follows §7: `provideAppInitializer`, guarded with
`isPlatformBrowser`, inside `NgZone.runOutsideAngular`. The app ships without
SSR, but the guard and the plugin's own `window` check keep it SSR-safe (RNF04).

### Regenerating the Ampli wrapper

```bash
npm install -g @amplitude/ampli
ampli pull web        # writes src/app/analytics/ampli, per ampli.json
```

Never hand-edit `src/app/analytics/ampli` — it is generated, excluded from
Prettier, and committed as-is.

`ampli.json` still pins the **JavaScript** runtime, so the committed wrapper is
the same file the React app uses; `allowJs` in `tsconfig.json` lets TypeScript
consume it. Its JSDoc still gives full compile-time checking — a misspelled
enum value or an event that isn't in the plan fails the build. Switching
`Runtime` to `browser:typescript-ampli-v2` and re-pulling would emit TypeScript
directly; nothing else would need to change.
