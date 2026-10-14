import { isPlatformBrowser } from '@angular/common';
import { inject, NgZone, PLATFORM_ID } from '@angular/core';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { environment } from '../../environments/environment';
import { ampli, ApiKey, DefaultConfiguration } from './ampli';
import { DataLayerDestinationPlugin } from './datalayer-destination.plugin';

/**
 * Initialize the Ampli SDK. Registered once via provideAppInitializer, so it
 * runs before anything renders or tracks (taxonomy doc §7.3) — never from a
 * component, where it would re-run and register the plugin twice.
 *
 * The Amplitude instance is built here instead of letting ampli.load create
 * it, because Session Replay is a plugin that must be added before init so it
 * captures from the very first event of the session.
 */
export function initAnalytics(): void {
  // Doc §7.4: window and dataLayer do not exist on the server.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return;
  }

  // Doc §7.4: Amplitude's official Angular guidance. Angular's zone patches
  // the DOM functions that autocapture and Session Replay rely on, and third
  // party tags reached through the dataLayer would otherwise trigger change
  // detection cycles of their own.
  inject(NgZone).runOutsideAngular(() => {
    const instance = amplitude.createInstance();
    // sampleRate 1 records every session — demo setting; sample down in a
    // real production rollout. Inputs are masked by default (RS-01/RS-02).
    instance.add(sessionReplayPlugin({ sampleRate: 1 }));
    instance.init(ApiKey[environment.amplitudeEnvironment], {
      ...DefaultConfiguration,
      // Sessions feed the replay list; the other autocapture events stay
      // off so the stream only carries events defined in the tracking plan.
      autocapture: {
        sessions: true,
        pageViews: false,
        formInteractions: false,
        fileDownloads: false,

        attribution: false,
        elementInteractions: false,
      },
    });
    ampli.load({ client: { instance } });

    // Every tracking-plan event reaches GTM-fed providers (GA4, media pixels)
    // through window.dataLayer, from a single instrumentation (taxonomy doc
    // RF01). Added before the Amplitude destination is removed so it is
    // already on the timeline when init flushes the queued session-start
    // event.
    instance.add(new DataLayerDestinationPlugin({ allowlist: environment.dataLayerAllowlist }));
  });
}
