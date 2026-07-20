/**
 * Normalizes and validates a user-supplied URL string.
 *
 * Accepts:
 *   - https://example.com
 *   - http://example.com
 *   - example.com          (bare domain -> defaults to https://)
 *
 * Rejects anything that still fails to parse as a URL, or that resolves
 * to a non-http(s) protocol, or an obviously malformed host.
 */
export const normalizeAndValidateUrl = (rawInput) => {
  if (!rawInput || typeof rawInput !== "string") {
    return { valid: false, error: "A website URL is required." };
  }

  let candidate = rawInput.trim();

  if (!candidate) {
    return { valid: false, error: "A website URL is required." };
  }

  // Prefix bare domains with https:// so `new URL()` can parse them.
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return { valid: false, error: "That doesn't look like a valid URL." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, error: "Only http and https URLs are supported." };
  }

  // Host must contain at least one dot and no spaces, e.g. "example.com"
  const hostPattern = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;
  if (!hostPattern.test(parsed.hostname)) {
    return { valid: false, error: "That domain doesn't look valid." };
  }

  return { valid: true, url: parsed.toString() };
};
