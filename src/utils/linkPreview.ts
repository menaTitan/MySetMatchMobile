/**
 * Tiny URL/YouTube helpers used by the post composer + PostCard to render
 * link previews inline. No network — everything is derived from the URL itself.
 */

const URL_REGEX = /https?:\/\/[^\s<>]+/gi;

/** All HTTP(S) URLs in a string, in order, with trailing punctuation stripped. */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const found = text.match(URL_REGEX) ?? [];
  return found.map((u) => u.replace(/[.,;!?)\]]+$/, ''));
}

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
]);

/**
 * Extract the YouTube video id from a URL, or null if it isn't a YouTube link.
 * Handles `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...`,
 * and `youtube.com/embed/...`.
 */
export function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!YT_HOSTS.has(host)) return null;

    // youtu.be/<id>
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return /^[\w-]{6,}$/.test(id) ? id : null;
    }
    // youtube.com/watch?v=<id>
    const v = u.searchParams.get('v');
    if (v && /^[\w-]{6,}$/.test(v)) return v;

    // youtube.com/shorts/<id> or /embed/<id>
    const m = u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{6,})/);
    if (m) return m[1];

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** Hostname stripped of the leading "www." for compact display. */
export function getDisplayHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** First URL in the text — the one we render a preview card for. */
export function firstLinkPreview(text: string): { url: string; youTubeId: string | null } | null {
  const urls = extractUrls(text);
  if (urls.length === 0) return null;
  const url = urls[0];
  return { url, youTubeId: getYouTubeId(url) };
}
