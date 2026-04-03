import { RssConnector } from "./rssConnector";

export function createRegionalTransportNewsConnector(feedUrls: string[]) {
  return new RssConnector({
    name: "regional-transport-news",
    feedUrls,
  });
}
