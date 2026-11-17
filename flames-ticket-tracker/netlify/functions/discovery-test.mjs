const BASE = 'https://bookings.guildfordspectrum.co.uk';
const EVENT_ID = '29001';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

export default async () => {
  try {
    const url =
      `${BASE}/guildfordspectrum/website/EventDetails.aspx?EventId=${EVENT_ID}&resize=true`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html'
      },
      signal: AbortSignal.timeout(10000)
    });

    const html = await response.text();

    // Find form opening tags
    const forms = [
      ...html.matchAll(/<form\b[^>]*>/gi)
    ].map(match => match[0]);

    // Find input fields
    const inputs = [
      ...html.matchAll(/<input\b[^>]*>/gi)
    ].map(match => match[0]).slice(0, 30);

    // Find booking button HTML and surrounding code
    const buttonPosition = html.indexOf('BookNowButton');

    const buttonContext = buttonPosition >= 0
      ? html.slice(
          Math.max(0, buttonPosition - 1000),
          Math.min(html.length, buttonPosition + 1500)
        )
      : null;

    // Find JavaScript postback references
    const postbacks = [
      ...new Set(
        [...html.matchAll(/__doPostBack\([^)]*\)/gi)]
          .map(match => match[0])
      )
    ].slice(0, 20);

    // Find event and instance references
    const references = [
      ...new Set(
        [...html.matchAll(
          /(?:EventInstanceId|ChooseSeats|BookNowButton|__EVENTTARGET)[^"'<>]{0,150}/gi
        )].map(match => match[0])
      )
    ].slice(0, 30);

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        eventId: EVENT_ID,
        htmlLength: html.length,
        forms,
        inputs,
        buttonContext,
        postbacks,
        references
      }, null, 2),
      { headers }
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
