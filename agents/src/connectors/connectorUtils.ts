import * as cheerio from "cheerio";
import { ConnectorEvidence, ConnectorProject } from "./types";

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: "application/json, text/plain;q=0.9, */*;q=0.8" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON from ${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { accept: "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch text from ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export function parseRssItems(xml: string) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("item, entry")
    .toArray()
    .map((node) => {
      const item = $(node);
      return {
        title: item.find("title").first().text().trim(),
        summary:
          item.find("description").first().text().trim() ||
          item.find("summary").first().text().trim(),
        url:
          item.find("link").attr("href") ||
          item.find("link").first().text().trim() ||
          item.find("guid").first().text().trim(),
        publishedAt:
          item.find("pubDate").first().text().trim() ||
          item.find("updated").first().text().trim() ||
          item.find("published").first().text().trim(),
      };
    })
    .filter((item) => item.title && item.url);
}

export function normalizeConnectorEvidence(
  source: string,
  sourceUrl: string,
  title: string,
  summary: string,
  evidenceDate?: string
): ConnectorEvidence {
  return {
    title: title.trim(),
    summary: summary.trim(),
    source,
    sourceUrl,
    evidenceDate: evidenceDate || new Date().toISOString().slice(0, 10),
    rawText: summary.trim(),
    sourceType: "public-source",
    sourceConfidence: "HIGH",
    urlVerified: false,
  };
}

export function normalizeConnectorProject(project: ConnectorProject): ConnectorProject {
  return {
    ...project,
    title: project.title.trim(),
    description: project.description.trim(),
    source: project.source.trim(),
    url: project.url?.trim(),
    localAuthority: project.localAuthority?.trim(),
    region: project.region?.trim(),
    location: project.location?.trim(),
    sourceType: project.sourceType || "public-source",
    sourceConfidence: project.sourceConfidence || "MEDIUM",
    evidence: project.evidence?.filter((item) => item.title && item.sourceUrl) || [],
  };
}

export function connectorProjectKey(project: ConnectorProject): string {
  return [
    normalizeText(project.title),
    normalizeText(project.localAuthority || ""),
    normalizeText(project.location || project.region || ""),
  ].join("|");
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
