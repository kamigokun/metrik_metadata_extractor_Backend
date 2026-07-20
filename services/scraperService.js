import axios from "axios";
import * as cheerio from "cheerio";
import { computeSeoScore, buildSuggestions } from "../utils/seoScorer.js";

const DEFAULT_TIMEOUT = Number(process.env.SCAN_TIMEOUT_MS) || 10000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; MetadataExtractorBot/1.0; +https://example.com/bot)";

/** Resolves a possibly-relative asset URL against the page's final URL. */
const resolveUrl = (base, maybeRelative) => {
  if (!maybeRelative) return "";
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return "";
  }
};

const text = (val) => (val || "").toString().trim();

/**
 * Fetches a page and extracts SEO / social metadata.
 * @param {string} targetUrl - already-validated, absolute URL
 * @returns {Promise<object>} structured report payload (without _id/timestamps)
 */
export const scrapeMetadata = async (targetUrl) => {
  const response = await axios.get(targetUrl, {
    timeout: DEFAULT_TIMEOUT,
    maxRedirects: 5,
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
    responseType: "text",
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const finalUrl = response.request?.res?.responseUrl || targetUrl;
  const $ = cheerio.load(response.data);

  const metaContent = (name) =>
    text(
      $(`meta[name="${name}"]`).attr("content") ||
        $(`meta[property="${name}"]`).attr("content")
    );

  const core = {
    title: text($("title").first().text()),
    description: metaContent("description"),
    keywords: metaContent("keywords"),
    canonical: resolveUrl(finalUrl, $('link[rel="canonical"]').attr("href")),
    robots: metaContent("robots"),
    author: metaContent("author"),
    charset: text(
      $("meta[charset]").attr("charset") ||
        $('meta[http-equiv="Content-Type"]').attr("content")
    ),
    language: text($("html").attr("lang")),
    viewport: metaContent("viewport"),
  };

  const openGraph = {
    title: metaContent("og:title"),
    description: metaContent("og:description"),
    image: resolveUrl(finalUrl, metaContent("og:image")),
    url: metaContent("og:url"),
    type: metaContent("og:type"),
    siteName: metaContent("og:site_name"),
  };

  const twitter = {
    card: metaContent("twitter:card"),
    title: metaContent("twitter:title"),
    description: metaContent("twitter:description"),
    image: resolveUrl(finalUrl, metaContent("twitter:image")),
  };

  const faviconHref =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    "/favicon.ico";
  const appleTouchHref = $('link[rel="apple-touch-icon"]').attr("href");
  const manifestHref = $('link[rel="manifest"]').attr("href");

  const assets = {
    favicon: resolveUrl(finalUrl, faviconHref),
    appleTouchIcon: resolveUrl(finalUrl, appleTouchHref),
    manifest: resolveUrl(finalUrl, manifestHref),
  };

  const signals = {
    title: Boolean(core.title),
    description: Boolean(core.description),
    canonical: Boolean(core.canonical),
    viewport: Boolean(core.viewport),
    ogTitle: Boolean(openGraph.title),
    ogDescription: Boolean(openGraph.description),
    ogImage: Boolean(openGraph.image),
    twitterCard: Boolean(twitter.card),
    twitterImage: Boolean(twitter.image),
    favicon: Boolean(assets.favicon),
    robots: Boolean(core.robots),
    keywords: Boolean(core.keywords),
    author: Boolean(core.author),
  };

  const seoScore = computeSeoScore(signals);
  const suggestions = buildSuggestions(seoScore.deductions);

  const warnings = [];
  if (!core.title) warnings.push("Page has no <title> tag.");
  if (!core.description) warnings.push("Page has no meta description.");
  if (!openGraph.image && !twitter.image)
    warnings.push("No social preview image found (Open Graph or Twitter).");
  if (!core.canonical) warnings.push("No canonical URL declared.");

  return {
    url: finalUrl,
    title: core.title || finalUrl,
    metadata: { core, openGraph, twitter, assets },
    seoScore,
    warnings,
    suggestions,
    status: "success",
  };
};

/** Maps thrown errors to a consistent, user-safe error message. */
export const describeScrapeError = (err) => {
  if (err.code === "ECONNABORTED") {
    return "The site took too long to respond.";
  }
  if (err.response) {
    return `The site responded with status ${err.response.status}.`;
  }
  if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
    return "That domain could not be resolved.";
  }
  if (err.code === "ECONNREFUSED") {
    return "The connection to that site was refused.";
  }
  return "Could not fetch or parse that page.";
};
