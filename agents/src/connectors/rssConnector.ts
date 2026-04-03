import { Connector, ConnectorFetchResult, ConnectorProject } from "./types";
import {
  fetchText,
  normalizeConnectorEvidence,
  normalizeConnectorProject,
  parseRssItems,
} from "./connectorUtils";

type RssConnectorConfig = {
  name: string;
  feedUrls: string[];
  localAuthority?: string;
  region?: string;
};

export class RssConnector implements Connector {
  name: string;
  supports: Connector["supports"] = "public";
  private readonly feedUrls: string[];
  private readonly localAuthority?: string;
  private readonly region?: string;

  constructor(config: RssConnectorConfig) {
    this.name = config.name;
    this.feedUrls = config.feedUrls;
    this.localAuthority = config.localAuthority;
    this.region = config.region;
  }

  async fetchProjects(since?: Date | null): Promise<ConnectorFetchResult> {
    const projects: ConnectorProject[] = [];

    for (const feedUrl of this.feedUrls) {
      const xml = await fetchText(feedUrl);
      const items = parseRssItems(xml);
      for (const item of items) {
        const updatedAt = item.publishedAt || new Date().toISOString();
        if (since) {
          const timestamp = Date.parse(updatedAt);
          if (!Number.isNaN(timestamp) && timestamp < since.getTime()) {
            continue;
          }
        }

        projects.push(
          normalizeConnectorProject({
            title: item.title,
            description: item.summary || item.title,
            status: "AMBER",
            source: this.name,
            url: item.url,
            updatedAt,
            localAuthority: this.localAuthority,
            region: this.region,
            location: this.localAuthority || this.region,
            sourceType: "rss",
            sourceConfidence: "MEDIUM",
            evidence: [
              normalizeConnectorEvidence(
                this.name,
                item.url,
                item.title,
                item.summary || item.title,
                updatedAt
              ),
            ],
          })
        );
      }
    }

    return { projects };
  }
}
