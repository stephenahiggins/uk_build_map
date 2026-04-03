import { JsonFeedConnector } from "./jsonFeedConnector";

export function createFindATenderConnector(url: string) {
  return new JsonFeedConnector<any>({
    name: "find-a-tender",
    url,
    selectItems: (payload) =>
      Array.isArray(payload?.notices) ? payload.notices : Array.isArray(payload) ? payload : [],
    mapItem: (item) => {
      const title = item?.title || item?.noticeTitle;
      const itemUrl = item?.url || item?.noticeUrl || item?.link;
      if (!title || !itemUrl) return null;
      return {
        title,
        description: item?.description || item?.summary || title,
        source: "Find a Tender",
        url: itemUrl,
        updatedAt: item?.publishedAt || item?.dispatchDate || item?.updatedAt,
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
