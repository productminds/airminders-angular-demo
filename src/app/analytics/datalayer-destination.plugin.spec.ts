import type { Types } from '@amplitude/analytics-browser';
import { DataLayerDestinationPlugin } from './datalayer-destination.plugin';

/** The plugin only ever reads event_type and the fields it forwards. */
function event(partial: Partial<Types.Event> & { event_type: string }): Types.Event {
  return partial as Types.Event;
}

describe('DataLayerDestinationPlugin', () => {
  let plugin: DataLayerDestinationPlugin;
  const dl = () => (window as unknown as { dataLayer: unknown[] }).dataLayer;

  beforeEach(async () => {
    (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
    plugin = new DataLayerDestinationPlugin();
    await plugin.setup();
  });

  it('faz push com nome normalizado e namespace', async () => {
    const result = await plugin.execute(
      event({
        event_type: 'Flight Searched',
        event_properties: { 'Flight Origin': 'GRU' },
        insert_id: 'abc',
      }),
    );

    expect(result.code).toBe(200);
    expect(dl()[0]).toEqual(
      expect.objectContaining({
        event: 'flight_searched',
        amplitude: expect.objectContaining({
          event_type: 'Flight Searched',
          event_properties: { flight_origin: 'GRU' },
          insert_id: 'abc',
        }),
        _clear: true,
      }),
    );
  });

  it('ignora eventos reservados do SDK', async () => {
    await plugin.execute(event({ event_type: '$identify' }));
    expect(dl().length).toBe(0);
  });

  it('respeita a allowlist', async () => {
    plugin = new DataLayerDestinationPlugin({ allowlist: ['Seat Selected'] });
    await plugin.setup();

    await plugin.execute(event({ event_type: 'Flight Searched' }));
    expect(dl().length).toBe(0);

    await plugin.execute(event({ event_type: 'Seat Selected' }));
    expect(dl().length).toBe(1);
  });

  it('não expõe user_id nem user_properties por padrão', async () => {
    await plugin.execute(
      event({
        event_type: 'Flight Searched',
        user_id: 'u1',
        user_properties: { loyalty_tier: 'gold' },
      }),
    );

    const payload = dl()[0] as { amplitude: Record<string, unknown> };
    expect(payload.amplitude['user_id']).toBeUndefined();
    expect(payload.amplitude['user_properties']).toBeUndefined();
  });

  it('expõe user_id e user_properties quando habilitado', async () => {
    plugin = new DataLayerDestinationPlugin({
      includeUserId: true,
      includeUserProperties: true,
    });
    await plugin.setup();

    await plugin.execute(
      event({ event_type: 'Flight Searched', user_id: 'u1', user_properties: { tier: 'gold' } }),
    );

    const payload = dl()[0] as { amplitude: Record<string, unknown> };
    expect(payload.amplitude['user_id']).toBe('u1');
    expect(payload.amplitude['user_properties']).toEqual({ tier: 'gold' });
  });

  it('isola a falha do push e nunca lança (RNF02)', async () => {
    (window as unknown as { dataLayer: unknown }).dataLayer = {
      push() {
        throw new Error('GTM indisponível');
      },
    };

    const result = await plugin.execute(event({ event_type: 'Flight Searched' }));

    expect(result.code).toBe(500);
    expect(result.message).toContain('dataLayer push failed');
  });

  it('reaproveita um dataLayer já criado pelo snippet do GTM', async () => {
    const existing = [{ event: 'gtm.js' }];
    (window as unknown as { dataLayer: unknown[] }).dataLayer = existing;

    await plugin.setup();
    await plugin.execute(event({ event_type: 'Flight Searched' }));

    expect(dl()).toBe(existing);
    expect(dl().length).toBe(2);
  });
});
