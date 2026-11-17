const BASE =
  'https://bookings.guildfordspectrum.co.uk/guildfordspectrum/api/v3';

const EVENT_ID = '29001';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

export default async () => {
  try {

    // Retrieve the event's performances from Spektrix
    const url =
      `${BASE}/events/${EVENT_ID}/instances`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    const raw = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          eventId: EVENT_ID,
          error: raw.slice(0, 300)
        }, null, 2),
        {
          status: 200,
          headers
        }
      );
    }

    const data = JSON.parse(raw);

    // Extract performance information
    const instances = Array.isArray(data)
      ? data.map(instance => ({
          id: instance.id,
          start: instance.start,
          startUtc: instance.startUtc,
          isOnSale: instance.isOnSale,
          cancelled: instance.cancelled,
          planId: instance.planId,
          eventId: instance.event?.id
        }))
      : [];

    // Check whether the full instance ID is available
    const fullInstanceIds = instances
      .map(instance => instance.id)
      .filter(id =>
        typeof id === 'string' &&
        id.length > 15
      );

    return new Response(
      JSON.stringify({
        success: true,
        status: response.status,
        eventId: EVENT_ID,
        totalInstances: instances.length,
        fullInstanceIds,
        instances
      }, null, 2),
      {
        status: 200,
        headers
      }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({
        success: false,
        error: String(error.message || error)
      }, null, 2),
      {
        status: 500,
        headers
      }
    );

  }
};

export const config = {
  path: '/api/discovery-test'
};
