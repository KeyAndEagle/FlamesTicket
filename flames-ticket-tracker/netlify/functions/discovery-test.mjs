const BASE =
  'https://bookings.guildfordspectrum.co.uk/guildfordspectrum/api/v3';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

export default async () => {
  try {

    // Retrieve events from the Spektrix API
    const url = `${BASE}/events`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(15000)
    });

    const raw = await response.text();

    // Report API errors
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          error: raw.slice(0, 500)
        }, null, 2),
        {
          status: 200,
          headers
        }
      );
    }

    const data = JSON.parse(raw);

    // Check the response structure
    const allEvents = Array.isArray(data)
      ? data
      : Array.isArray(data.events)
        ? data.events
        : [];

    // Find Guildford Flames events
    const flamesEvents = allEvents
      .filter(event => {
        const name = String(
          event.name ||
          event.title ||
          event.eventName ||
          ''
        );

        return name.toLowerCase().includes('guildford flames');
      })
      .map(event => ({
        id: event.id,
        name: event.name || event.title || event.eventName,
        description: event.description || null,
        firstInstance: event.firstInstance || null,
        lastInstance: event.lastInstance || null
      }));

    // Show a sample of other events
    const sampleEvents = allEvents
      .slice(0, 5)
      .map(event => ({
        id: event.id,
        name: event.name || event.title || event.eventName
      }));

    return new Response(
      JSON.stringify({
        success: true,
        status: response.status,
        totalEvents: allEvents.length,
        flamesEventsFound: flamesEvents.length,
        flamesEvents,
        sampleEvents,
        responseType: Array.isArray(data)
          ? 'array'
          : typeof data,
        responseKeys: Array.isArray(data)
          ? []
          : Object.keys(data)
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
