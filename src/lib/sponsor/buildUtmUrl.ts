export function buildUtmUrl(
  destination: string,
  placementId: string,
  surface: string,
  campaign = 'mdeai-sponsor',
): string {
  try {
    const url = new URL(destination);
    url.searchParams.set('utm_source', 'mdeai');
    url.searchParams.set('utm_medium', surface);
    url.searchParams.set('utm_campaign', campaign);
    url.searchParams.set('utm_content', placementId);
    return url.toString();
  } catch {
    return destination;
  }
}
