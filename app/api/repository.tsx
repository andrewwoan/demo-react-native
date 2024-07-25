// src/api/repository.ts

import { MMKV } from "react-native-mmkv";
import HackerNewsApiClient from "./api";
import { Story, FeedType } from "../model/types";

import ApiError from "./ApiError";

console.log("THIS IS AN APIERROR");
console.log(ApiError);

const storage = new MMKV();

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export default class HackerNewsRepository {
  private apiClient: HackerNewsApiClient;
  private itemsPerPage = 20;
  private loadedStoryIds: { [key in FeedType]: Set<number> } = {
    [FeedType.TOP]: new Set(),
    [FeedType.NEW]: new Set(),
    [FeedType.BEST]: new Set(),
  };
  private lastFeedType: FeedType | null = null;

  constructor(apiClient: HackerNewsApiClient) {
    this.apiClient = apiClient;
  }

  getStories = async (
    feedType: FeedType,
    page: number = 0
  ): Promise<Story[]> => {
    try {
      // If feed type has changed, clear the cache for the new feed type
      if (this.lastFeedType !== feedType) {
        this.clearCache(feedType);
        this.lastFeedType = feedType;
      }

      const cachedStories = this.getCachedStories(feedType, page);
      if (cachedStories) {
        return this.filterDuplicates(cachedStories, feedType);
      }

      const { storyIds, expirationTime } = await this.apiClient.fetchStoryIds(
        feedType
      );

      let stories: Story[] = [];
      let uniqueStoriesCount = 0;
      let index = page * this.itemsPerPage;

      while (
        uniqueStoriesCount < this.itemsPerPage &&
        index < storyIds.length
      ) {
        const batch = storyIds.slice(index, index + this.itemsPerPage);
        const batchStories = await Promise.all(
          batch.map((id) => this.apiClient.fetchStory(id).catch(() => null))
        );

        for (const story of batchStories) {
          if (story && !this.loadedStoryIds[feedType].has(story.id)) {
            stories.push(story);
            this.loadedStoryIds[feedType].add(story.id);
            uniqueStoriesCount++;
            if (uniqueStoriesCount >= this.itemsPerPage) break;
          }
        }

        index += this.itemsPerPage;
      }

      this.cacheStories(feedType, page, stories, expirationTime);

      return stories;
    } catch (error) {
      if (error instanceof ApiError) {
        console.log("sheeesh da babie");
        throw new NetworkError(
          `Network error: ${error.statusCode} - ${error.message}`
        );
      }
      throw error;
    }
  };

  private filterDuplicates = (
    stories: Story[],
    feedType: FeedType
  ): Story[] => {
    return stories.filter((story) => {
      if (this.loadedStoryIds[feedType].has(story.id)) {
        return false;
      }
      this.loadedStoryIds[feedType].add(story.id);
      return true;
    });
  };

  private getCachedStories = (
    feedType: FeedType,
    page: number
  ): Story[] | null => {
    const cacheKey = this.getCacheKey(feedType, page);
    const cachedData = storage.getString(cacheKey);
    if (cachedData) {
      const { stories, expirationTime } = JSON.parse(cachedData);
      if (Date.now() < expirationTime) {
        return stories;
      } else {
        // Remove expired cache entry
        storage.delete(cacheKey);
      }
    }
    return null;
  };

  private cacheStories = (
    feedType: FeedType,
    page: number,
    stories: Story[],
    expirationTime: number
  ): void => {
    const cacheKey = this.getCacheKey(feedType, page);
    const cacheData = JSON.stringify({
      stories,
      expirationTime,
    });
    storage.set(cacheKey, cacheData);
  };

  private getCacheKey = (feedType: FeedType, page: number): string => {
    return `stories_${feedType}_${page}_${Date.now()}`;
  };

  clearCache = (feedType: FeedType): void => {
    const keys = storage.getAllKeys();
    const feedKeys = keys.filter((key) =>
      key.startsWith(`stories_${feedType}`)
    );
    feedKeys.forEach((key) => storage.delete(key));
    this.loadedStoryIds[feedType].clear();
  };
}
