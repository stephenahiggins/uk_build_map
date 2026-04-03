import { Connector, ConnectorFetchResult, ConnectorProject } from "./types";
import {
  fetchJson,
  normalizeConnectorEvidence,
  normalizeConnectorProject,
} from "./connectorUtils";

type JsonFeedConnectorConfig<T> = {
  name: string;
  url: string;
  selectItems: (payload: T) => unknown[];
  mapItem: (item: any) => ConnectorProject | null;
};

export class JsonFeedConnector<T> implements Connector {
  name: string;
  supports: Connector["supports"] = "public";
  private readonly url: string;
  private readonly selectItems: (payload: T) => unknown[];
  private readonly mapItem: (item: any) => ConnectorProject | null;

  constructor(config: JsonFeedConnectorConfig<T>) {
    this.name = config.name;
    this.url = config.url;
    this.selectItems = config.selectItems;
    this.mapItem = config.mapItem;
  }

  async fetchProjects(since?: Date | null): Promise<ConnectorFetchResult> {
    const payload = await fetchJson<T>(this.url);
    const items = this.selectItems(payload);
    const projects: ConnectorProject[] = [];

    for (const item of items) {
      const project = this.mapItem(item);
      if (!project) continue;
      if (since && project.updatedAt) {
        const timestamp = Date.parse(project.updatedAt);
        if (!Number.isNaN(timestamp) && timestamp < since.getTime()) {
          continue;
        }
      }
      if ((!project.evidence || project.evidence.length === 0) && project.url) {
        project.evidence = [
          normalizeConnectorEvidence(
            this.name,
            project.url,
            project.title,
            project.description,
            project.updatedAt
          ),
        ];
      }
      projects.push(normalizeConnectorProject(project));
    }

    return { projects };
  }
}
