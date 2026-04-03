import { RssConnector } from "./rssConnector";

export function createLocalAuthorityNewsConnector(feedUrls: string[]) {
  return new RssConnector({
    name: "local-authority-news",
    feedUrls,
  });
}
