import { envValues } from "../envValues";
import { LocalJsonConnector } from "./localJsonConnector";
import { createContractsFinderConnector } from "./contractsFinderConnector";
import { connectorProjectKey } from "./connectorUtils";
import { createFindATenderConnector } from "./findATenderConnector";
import { createGmppConnector } from "./gmppConnector";
import { createLocalAuthorityNewsConnector } from "./localAuthorityNewsConnector";
import { createPlanningInspectorateConnector } from "./planningInspectorateConnector";
import { createRegionalTransportNewsConnector } from "./regionalTransportNewsConnector";
import { Connector, ConnectorProject } from "./types";

type ConnectorFactory = (config: Record<string, string>) => Connector | null;

const CONNECTOR_REGISTRY: Record<string, ConnectorFactory> = {
  "local-json": (config) => {
    const path = config.LOCAL_PROJECTS_JSON;
    if (!path) return null;
    return new LocalJsonConnector({ path });
  },
  "planning-inspectorate": (config) =>
    config.PLANNING_INSPECTORATE_URL
      ? createPlanningInspectorateConnector(config.PLANNING_INSPECTORATE_URL)
      : null,
  "gmpp-ipa": (config) =>
    config.GMPP_URL ? createGmppConnector(config.GMPP_URL) : null,
  "contracts-finder": (config) =>
    config.CONTRACTS_FINDER_URL
      ? createContractsFinderConnector(config.CONTRACTS_FINDER_URL)
      : null,
  "find-a-tender": (config) =>
    config.FIND_A_TENDER_URL
      ? createFindATenderConnector(config.FIND_A_TENDER_URL)
      : null,
  "local-authority-news": (config) =>
    config.LOCAL_AUTHORITY_NEWS_FEEDS
      ? createLocalAuthorityNewsConnector(
          config.LOCAL_AUTHORITY_NEWS_FEEDS.split(",").map((entry) => entry.trim()).filter(Boolean)
        )
      : null,
  "regional-transport-news": (config) =>
    config.REGIONAL_TRANSPORT_NEWS_FEEDS
      ? createRegionalTransportNewsConnector(
          config.REGIONAL_TRANSPORT_NEWS_FEEDS.split(",").map((entry) => entry.trim()).filter(Boolean)
        )
      : null,
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

function resolveConnectorConfig() {
  return {
    LOCAL_PROJECTS_JSON: envValues.LOCAL_PROJECTS_JSON || "",
    PLANNING_INSPECTORATE_URL: process.env.PLANNING_INSPECTORATE_URL || "",
    GMPP_URL: process.env.GMPP_URL || "",
    CONTRACTS_FINDER_URL: process.env.CONTRACTS_FINDER_URL || "",
    FIND_A_TENDER_URL: process.env.FIND_A_TENDER_URL || "",
    LOCAL_AUTHORITY_NEWS_FEEDS: process.env.LOCAL_AUTHORITY_NEWS_FEEDS || "",
    REGIONAL_TRANSPORT_NEWS_FEEDS: process.env.REGIONAL_TRANSPORT_NEWS_FEEDS || "",
  };
}

export async function fetchFromConnectors(
  connectorNames: string[],
  since?: Date | null
): Promise<ConnectorProject[]> {
  if (!connectorNames.length) return [];

  const config = resolveConnectorConfig();
  const instances: Connector[] = [];
  for (const name of connectorNames) {
    const factory = CONNECTOR_REGISTRY[name];
    if (!factory) continue;
    const instance = factory(config);
    if (instance) instances.push(instance);
  }

  const results: ConnectorProject[] = [];
  const seen = new Set<string>();

  for (const connector of instances) {
    const output = await connector.fetchProjects(since ?? null);
    for (const project of output.projects) {
      const normalizedProject = {
        ...project,
        source: project.source || connector.name,
      };
      const key = connectorProjectKey(normalizedProject);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(normalizedProject);
    }
  }

  return results;
}
