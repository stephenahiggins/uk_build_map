import { envValues } from "../envValues";
import { LocalJsonConnector } from "./localJsonConnector";
import { Connector, ConnectorProject } from "./types";

const CONNECTOR_REGISTRY: Record<string, (config: Record<string, string>) => Connector | null> =
  {
    "local-json": (config) => {
      const path = config.LOCAL_PROJECTS_JSON;
      if (!path) return null;
      return new LocalJsonConnector({ path });
    },
  };

function parseConnectorList(input?: string): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function resolveConnectorNames(cliValue?: string): string[] {
  const cliNames = parseConnectorList(cliValue);
  if (cliNames.length) return cliNames;
  return parseConnectorList(envValues.CONNECTORS);
}

export async function fetchFromConnectors(
  connectorNames: string[],
  since?: Date | null
): Promise<ConnectorProject[]> {
  if (!connectorNames.length) return [];

  const config = {
    LOCAL_PROJECTS_JSON: envValues.LOCAL_PROJECTS_JSON || "",
  };

  const instances: Connector[] = [];
  for (const name of connectorNames) {
    const factory = CONNECTOR_REGISTRY[name];
    if (!factory) continue;
    const instance = factory(config);
    if (instance) instances.push(instance);
  }

  const results: ConnectorProject[] = [];
  for (const connector of instances) {
    const output = await connector.fetchProjects(since ?? null);
    results.push(
      ...output.projects.map((project) => ({
        ...project,
        source: project.source || connector.name,
      }))
    );
  }

  return results;
}
