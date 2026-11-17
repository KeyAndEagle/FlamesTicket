const BASE = 'https://bookings.guildfordspectrum.co.uk';

const EVENT_ID = '29001';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

export default async () => {
  try {
    const eventUrl =
      `${BASE}/guildfordspectrum/website/EventDetails.aspx?EventId=${EVENT_ID}&resize=true`;

    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html'
      },
      signal: AbortSignal.timeout(10000)
    });

    const html = await response.text();

    // Find performance IDs in the event details page
    const instanceIds = [
      ...new Set(
        [...html.matchAll(/EventInstanceId=(\d+)/gi)]
          .map(match => match[1])
      )
    ];

    // Find references to booking pages and instance IDs
    const bookingReferences = [
      ...new Set(
        [...html.matchAll(
          /(?:ChooseSeats\.aspx|EventInstanceId|instanceId|BookNowButton)[^"'<>]{0,150}/gi
        )].map(match => match[0])
      )
    ].slice(0, 20);

    // Return the results
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        eventId: EVENT_ID,
        htmlLength: html.length,
        instanceIds,
        bookingReferences,
        containsBookNow: html.includes('BookNowButton')
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
