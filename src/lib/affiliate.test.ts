import { describe, it, expect } from 'vitest';
import { applyAffiliateTag } from './affiliate';

const ENV_FULL = {
  VITE_BOOKING_AID: '304142',
  VITE_AIRBNB_AFFILIATE_TAG: 'mdeai',
  VITE_VRBO_AFFILIATE_TAG: 'mdeai-vrbo',
};

const ENV_EMPTY = {
  VITE_BOOKING_AID: '',
  VITE_AIRBNB_AFFILIATE_TAG: undefined,
};

describe('applyAffiliateTag', () => {
  it('appends booking aid when env is set', () => {
    const r = applyAffiliateTag(
      'https://www.booking.com/hotel/co/medellin.html',
      ENV_FULL,
    );
    expect(r.tag).toBe('booking');
    expect(r.didRewrite).toBe(true);
    expect(r.url).toContain('aid=304142');
  });

  it('matches booking.com without www', () => {
    const r = applyAffiliateTag('https://booking.com/searchresults', ENV_FULL);
    expect(r.tag).toBe('booking');
    expect(r.url).toContain('aid=304142');
  });

  it('appends airbnb af when env is set', () => {
    const r = applyAffiliateTag('https://www.airbnb.com/rooms/12345', ENV_FULL);
    expect(r.tag).toBe('airbnb');
    expect(r.url).toContain('af=mdeai');
  });

  it('matches airbnb international TLD (airbnb.com.co)', () => {
    const r = applyAffiliateTag('https://airbnb.com.co/rooms/9', ENV_FULL);
    expect(r.tag).toBe('airbnb');
    expect(r.url).toContain('af=mdeai');
  });

  it('matches airbnb subdomain (m.airbnb.com)', () => {
    const r = applyAffiliateTag('https://m.airbnb.com/rooms/1', ENV_FULL);
    expect(r.tag).toBe('airbnb');
    expect(r.didRewrite).toBe(true);
  });

  it('returns tag but does NOT rewrite when env tag is empty', () => {
    const r = applyAffiliateTag('https://airbnb.com/rooms/1', ENV_EMPTY);
    expect(r.tag).toBe('airbnb');
    expect(r.didRewrite).toBe(false);
    expect(r.url).toBe('https://airbnb.com/rooms/1');
  });

  it('preserves an upstream aid param without override', () => {
    const r = applyAffiliateTag(
      'https://www.booking.com/hotel/x.html?aid=999999',
      ENV_FULL,
    );
    expect(r.tag).toBe('booking');
    expect(r.didRewrite).toBe(false);
    expect(r.url).toContain('aid=999999');
    expect(r.url).not.toContain('aid=304142');
  });

  it('returns null tag for unknown domain', () => {
    const r = applyAffiliateTag('https://fazwaz.com/listing/abc', ENV_FULL);
    expect(r.tag).toBe(null);
    expect(r.didRewrite).toBe(false);
    expect(r.url).toBe('https://fazwaz.com/listing/abc');
  });

  it('handles malformed URLs gracefully', () => {
    const r = applyAffiliateTag('not-a-url', ENV_FULL);
    expect(r.tag).toBe(null);
    expect(r.url).toBe('not-a-url');
  });

  it('rejects non-http(s) protocols', () => {
    const r = applyAffiliateTag('javascript:alert(1)', ENV_FULL);
    expect(r.tag).toBe(null);
    expect(r.didRewrite).toBe(false);
  });

  it('preserves existing query string when appending', () => {
    const r = applyAffiliateTag(
      'https://www.airbnb.com/rooms/1?adults=2',
      ENV_FULL,
    );
    expect(r.url).toContain('adults=2');
    expect(r.url).toContain('af=mdeai');
  });

  it('appends vrbo utm_source', () => {
    const r = applyAffiliateTag('https://www.vrbo.com/12345', ENV_FULL);
    expect(r.tag).toBe('vrbo');
    expect(r.url).toContain('utm_source=mdeai-vrbo');
  });
});
