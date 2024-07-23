// repository/HackerNewsRepository.ts

import { MMKV } from "react-native-mmkv";
import HackerNewsApiClient from "./api";
import { Story, FeedType } from "../model/types";

const storage = new MMKV();

export default class HackerNewsRepository {
  private apiClient: HackerNewsApiClient;
  private cacheExpirationTime = 5 * 60 * 1000; // 5 mins
  private itemsPerPage = 20;

  constructor(apiClient: HackerNewsApiClient) {
    this.apiClient = apiClient;
  }

  async getStories(feedType: FeedType, page: number = 0): Promise<Story[]> {
    const cachedStories = this.getCachedStories(feedType);
    if (cachedStories && page === 0) {
      return cachedStories;
    }

    const storyIds = await this.apiClient.fetchStoryIds(feedType);
    const startIndex = page * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageStoryIds = storyIds.slice(startIndex, endIndex);

    const stories = await Promise.all(
      pageStoryIds.map((id) => this.apiClient.fetchStory(id))
    );

    if (page === 0) {
      this.cacheStories(feedType, stories);
    }

    return stories;
  }

  private getCachedStories(feedType: FeedType): Story[] | null {
    const cacheKey = `stories_${feedType}`;
    const cachedData = storage.getString(cacheKey);
    if (cachedData) {
      const { stories, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < this.cacheExpirationTime) {
        return stories;
      }
    }
    return null;
  }

  private cacheStories(feedType: FeedType, stories: Story[]): void {
    const cacheKey = `stories_${feedType}`;
    const cacheData = JSON.stringify({
      stories,
      timestamp: Date.now(),
    });
    storage.set(cacheKey, cacheData);
  }
}
