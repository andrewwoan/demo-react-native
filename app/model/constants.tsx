import { FeedType } from "./types";

export const API = {
  BASE_URL: "https://hacker-news.firebaseio.com/v0",
  ENDPOINTS: {
    STORIES: (feedType: FeedType) => `${feedType.toLowerCase()}stories.json`,
    ITEM: (id: number) => `item/${id}.json`,
  },
};

export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  THRESHOLD: 0.1,
};

export const STORAGE_KEYS = {
  LATEST_FEED: "latestFeed",
};
