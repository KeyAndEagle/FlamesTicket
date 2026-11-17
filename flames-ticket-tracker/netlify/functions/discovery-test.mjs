const BASE = 'https://bookings.guildfordspectrum.co.uk';

const INSTANCE_ID = '877601';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

export default async () => {
  try {

    const url =
      `${BASE}/guildfordspectrum/website/ChooseSeats.aspx?EventInstanceId=${INSTANCE_ID}&resize=true`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html'
      },
      signal: AbortSignal.timeout(10000)
    });

    const html = await response.text();

    // Find the full Spektrix instance ID
    const fullInstanceIds = [
      ...new Set(
        [...html.matchAll(/instanceId\s*:\s*["']([A-Z0-9]+)["']/gi)]
          .map(match => match[1])
      )
    ];

    // Find event names
    const eventNames = [
      ...new Set(
        [...html.matchAll(/eventName\s*:\s*["']([^"']+)["']/gi)]
          .map(match => match[1])
      )
    ];

    // Find match dates
    const matchDates = [
      ...new Set(
        [...html.matchAll(/instanceDateTimeIso\s*:\s*["']([^"']+)["']/gi)]
          .map(match => match[1])
      )
    ];

    // Find seat map references
    const seatMapFound = html.includes('initSeatMap');

    // Return results
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        numericInstanceId: INSTANCE_ID,
        htmlLength: html.length,
        fullInstanceIds,
        eventNames,
        matchDates,
        seatMapFound
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
