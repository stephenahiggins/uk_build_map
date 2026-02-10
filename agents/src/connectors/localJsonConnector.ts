import { readFile } from "fs/promises";
import { Connector, ConnectorProject, ConnectorFetchResult } from "./types";

type LocalJsonConnectorConfig = {
  path: string;
};

export class LocalJsonConnector implements Connector {
  name = "local-json";
  supports: Connector["supports"] = "mixed";
  private path: string;

  constructor(config: LocalJsonConnectorConfig) {
    this.path = config.path;
  }

  async fetchProjects(since?: Date | null): Promise<ConnectorFetchResult> {
    const raw = await readFile(this.path, "utf-8");
    const parsed = JSON.parse(raw) as ConnectorProject[];
    const projects = Array.isArray(parsed) ? parsed : [];
    if (!since) return { projects };

    const cutoff = since.getTime();
    const filtered = projects.filter((project) => {
      if (!project.updatedAt) return true;
      const timestamp = Date.parse(project.updatedAt);
      if (Number.isNaN(timestamp)) return true;
      return timestamp >= cutoff;
    });

    return { projects: filtered };
  }
}
