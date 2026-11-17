const URL = 'https://www.guildfordspectrum.co.uk/ice-hockey-events/';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

export default async () => {
  try {
    const response = await fetch(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html'
      },
      signal: AbortSignal.timeout(10000)
    });

    const html = await response.text();

    // Find Spektrix Event IDs
    const eventIds = [
      ...new Set(
        [...html.matchAll(/EventId(?:=|%3D|&#61;)(\d+)/gi)]
          .map(match => match[1])
      )
    ];

    // Find booking-related links
    const bookingLinks = [
      ...new Set(
        [...html.matchAll(
          /(?:href|src)=["']([^"']*(?:spektrix|bookings\.guildfordspectrum|EventDetails|ice-hockey)[^"']*)["']/gi
        )].map(match => match[1])
      )
    ].slice(0, 30);

    // Find mentions of Spektrix in the HTML
    const spektrixMentions = [
      ...html.matchAll(/spektrix/gi)
    ].length;

    // Find mentions of booking-related terms
    const bookingMentions = [
      ...html.matchAll(/booking/gi)
    ].length;

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        htmlLength: html.length,
        eventIds,
        bookingLinks,
        spektrixMentions,
        bookingMentions,
        sample: html.slice(0, 300)
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
      }),
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
