import type { Types } from '@amplitude/analytics-browser';
import { normalizeKeys, toGtmEventName } from './naming';

export interface DataLayerPluginOptions {
  /** Name of the global array. Default: 'dataLayer'. */
  dataLayerName?: string;
  /** Namespace the Amplitude payload sits under. Default: 'amplitude'. */
  namespace?: string;
  /** Original taxonomy names to forward. Empty forwards all. */
  allowlist?: string[];
  /** Expose user_properties on the dataLayer. Default: false. */
  includeUserProperties?: boolean;
  /** Expose user_id on the dataLayer. Default: false. */
  includeUserId?: boolean;
  /** Convert property keys to snake_case. Default: true. */
  normalizePropertyKeys?: boolean;
  /** Event-name conversion. Default: toGtmEventName. */
  eventNameMapper?: (eventType: string) => string;
}

type DataLayerHost = Record<string, unknown[] | undefined>;

/**
 * Browser SDK 2 destination plugin that mirrors every processed event into
 * window.dataLayer (GTM). It sits at the end of the SDK timeline, so it
 * inherits the exact taxonomy — one event definition feeds both Amplitude
 * and every GTM-fed provider (GA4, media pixels). Taxonomy doc §6.4.
 *
 * Why a destination plugin and not the track() promise callback: the promise
 * resolves after the batch upload, which adds latency, loses events on a
 * network failure and only covers the calls that were awaited (doc §5.1,
 * alternative A). A destination runs in the same processing cycle as the
 * event (RNF01) and a push failure stays isolated from the Amplitude send
 * (RNF02).
 *
 * Privacy (RNF03): user_id and user_properties are withheld by default;
 * opting them in exposes them to every tag in the container and requires a
 * legal basis. A user opt-out (ampli.client.setOptOut(true)) halts the whole
 * SDK timeline, so the dataLayer stops receiving events at the same instant
 * Amplitude does.
 */
export class DataLayerDestinationPlugin implements Types.DestinationPlugin {
  readonly name = 'gtm-datalayer-destination';
  // Doc §6.4 writes `PluginType.DESTINATION as any`; current SDK versions
  // type the field as a string union, so the literal needs no cast.
  readonly type = 'destination' as const;

  private readonly dataLayerName: string;
  private readonly namespace: string;
  private readonly allowlist: Set<string>;
  private readonly includeUserProperties: boolean;
  private readonly includeUserId: boolean;
  private readonly normalizePropertyKeys: boolean;
  private readonly eventNameMapper: (eventType: string) => string;

  constructor(options: DataLayerPluginOptions = {}) {
    this.dataLayerName = options.dataLayerName ?? 'dataLayer';
    this.namespace = options.namespace ?? 'amplitude';
    this.allowlist = new Set(options.allowlist ?? []);
    this.includeUserProperties = options.includeUserProperties ?? false;
    this.includeUserId = options.includeUserId ?? false;
    this.normalizePropertyKeys = options.normalizePropertyKeys ?? true;
    this.eventNameMapper = options.eventNameMapper ?? toGtmEventName;
  }

  async setup(): Promise<void> {
    const host = this.host();
    if (host) {
      // The GTM snippet may load before or after this: reusing the array
      // keeps whichever side arrived first, and GTM replays the pushes it
      // finds already queued (doc §7.4).
      host[this.dataLayerName] = host[this.dataLayerName] || [];
    }
  }

  /** Called by the SDK for every processed event. */
  async execute(event: Types.Event): Promise<Types.Result> {
    try {
      const host = this.host();
      if (!host) {
        return { event, code: 0, message: 'skipped: no window (SSR)' };
      }
      if (!this.shouldForward(event)) {
        return { event, code: 200, message: 'skipped: filtered' };
      }
      host[this.dataLayerName]!.push(this.buildPayload(event));
      return { event, code: 200, message: 'pushed to dataLayer' };
    } catch (error) {
      return { event, code: 500, message: `dataLayer push failed: ${String(error)}` };
    }
  }

  /**
   * execute() runs for Identify, GroupIdentify and Revenue too. Reserved
   * event types (prefixed "$") and events outside the allowlist are dropped.
   */
  private shouldForward(event: Types.Event): boolean {
    if (event.event_type.startsWith('$')) return false; // $identify, $groupidentify
    if (this.allowlist.size > 0 && !this.allowlist.has(event.event_type)) return false;
    return true;
  }

  private buildPayload(event: Types.Event): Record<string, unknown> {
    const props = (event.event_properties ?? {}) as Record<string, unknown>;

    return {
      // GA4-normalized name drives GTM Custom Event triggers.
      event: this.eventNameMapper(event.event_type),
      [this.namespace]: {
        // Original taxonomy name kept for auditing/rastreabilidade (RF02).
        event_type: event.event_type,
        event_properties: this.normalizePropertyKeys ? normalizeKeys(props) : props,
        session_id: event.session_id,
        insert_id: event.insert_id,
        time: event.time,
        ...(this.includeUserProperties && { user_properties: event.user_properties ?? {} }),
        ...(this.includeUserId && { user_id: event.user_id }),
      },
      // Clears the previous event's keys so GA4 tags never read stale values
      // through GTM's recursive data-model merge (doc §8.2).
      _clear: true,
    };
  }

  private host(): DataLayerHost | null {
    return typeof window === 'undefined' ? null : (window as unknown as DataLayerHost);
  }
}
