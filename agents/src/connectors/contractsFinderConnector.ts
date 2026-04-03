import { JsonFeedConnector } from "./jsonFeedConnector";

export function createContractsFinderConnector(url: string) {
  return new JsonFeedConnector<any>({
    name: "contracts-finder",
    url,
    selectItems: (payload) =>
      Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [],
    mapItem: (item) => {
      const title = item?.title || item?.noticeTitle;
      const itemUrl = item?.url || item?.noticeUrl || item?.link;
      if (!title || !itemUrl) return null;
      return {
        title,
        description: item?.description || item?.summary || title,
        source: "Contracts Finder",
        url: itemUrl,
        updatedAt: item?.publishedAt || item?.updatedAt || item?.publicationDate,
        localAuthority: item?.buyerName || item?.authority,
        location: item?.location || item?.placeOfPerformance,
        status: item?.status || "AMBER",
        externalId: item?.id || item?.noticeId,
        sourceType: "structured-json",
        sourceConfidence: "HIGH",
      };
    },
  });
}
