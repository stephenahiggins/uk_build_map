import { JsonFeedConnector } from "./jsonFeedConnector";

export function createGmppConnector(url: string) {
  return new JsonFeedConnector<any>({
    name: "gmpp-ipa",
    url,
    selectItems: (payload) =>
      Array.isArray(payload?.projects) ? payload.projects : Array.isArray(payload) ? payload : [],
    mapItem: (item) => {
      const title = item?.title || item?.projectName;
      const itemUrl = item?.url || item?.link || item?.projectUrl;
      if (!title || !itemUrl) return null;
      return {
        title,
        description: item?.description || item?.summary || title,
        source: "GMPP / IPA",
        url: itemUrl,
        updatedAt: item?.updatedAt || item?.reportDate,
        region: item?.region,
        location: item?.location,
        status: item?.status || "AMBER",
        externalId: item?.id || item?.reference,
        sourceType: "structured-json",
        sourceConfidence: "HIGH",
      };
    },
  });
}
