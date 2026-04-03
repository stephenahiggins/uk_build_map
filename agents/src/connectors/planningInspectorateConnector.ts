import { JsonFeedConnector } from "./jsonFeedConnector";

export function createPlanningInspectorateConnector(url: string) {
  return new JsonFeedConnector<any>({
    name: "planning-inspectorate",
    url,
    selectItems: (payload) =>
      Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [],
    mapItem: (item) => {
      const title = item?.title || item?.projectName || item?.name;
      const itemUrl = item?.url || item?.projectUrl || item?.link;
      if (!title || !itemUrl) return null;
      return {
        title,
        description: item?.description || item?.summary || title,
        source: "Planning Inspectorate / NSIP",
        url: itemUrl,
        updatedAt: item?.updatedAt || item?.decisionDate || item?.publishedAt,
        localAuthority: item?.localAuthority || item?.authority,
        region: item?.region,
        location: item?.location || item?.siteLocation,
        status: item?.status || "AMBER",
        externalId: item?.id || item?.reference,
        sourceType: "structured-json",
        sourceConfidence: "HIGH",
      };
    },
  });
}
