// src/api/repository.ts

import { MMKV } from "react-native-mmkv";
import HackerNewsApiClient from "./api";
import { Story, FeedType, ApiResponse } from "../model/types";

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

  constructor(apiClient: HackerNewsApiClient) {
    this.apiClient = apiClient;
  }

  getStories = async (
    feedType: FeedType,
    page: number = 0
  ): Promise<Story[]> => {
    try {
      const response: ApiResponse<number[]> =
        await this.apiClient.fetchStoryIds(feedType);
      const storyIds = response.data;

      let stories: Story[] = [];
      let uniqueStoriesCount = 0;
      let index = page * this.itemsPerPage;

      while (
        uniqueStoriesCount < this.itemsPerPage &&
        index < storyIds.length
      ) {
        const id = storyIds[index];
        const cachedStory = this.getCachedStory(id);

        if (cachedStory) {
          console.log("we're just getting a cached story sheeeeeeeeeeesh");
          stories.push(cachedStory);
          this.loadedStoryIds[feedType].add(cachedStory.id);
          uniqueStoriesCount++;
        } else {
          const storyResponse = await this.apiClient.fetchStory(id);
          const story = storyResponse.data;
          if (story && !this.loadedStoryIds[feedType].has(story.id)) {
            stories.push(story);
            this.loadedStoryIds[feedType].add(story.id);
            uniqueStoriesCount++;
            this.cacheStory(
              story,
              this.calculateExpirationTime(storyResponse.metadata.timestamp)
            );
          }
        }

        index++;
      }

      return stories;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  };

  private calculateExpirationTime(timestamp: Date): number {
    return timestamp.getTime() + 5 * 60 * 1000;
  }

  //If story in cache, return it if it is not expired, otherwise, return null
  private getCachedStory(id: number): Story | null {
    const cacheKey = `story_${id}`;
    const cachedData = storage.getString(cacheKey);
    if (cachedData) {
      const { story, expirationTime } = JSON.parse(cachedData);
      if (Date.now() < expirationTime) {
        return story;
      } else {
        storage.delete(cacheKey);
      }
    }
    return null;
  }

  private cacheStory(story: Story, expirationTime: number): void {
    const cacheKey = `story_${story.id}`;
    console.log("THIS IS THE CACHEKEY");
    console.log(cacheKey);
    const cacheData = JSON.stringify({ story, expirationTime });

    console.log("HERE WE ARE GETTING ALL KEEEYS ---------------------------");
    console.log(storage.getAllKeys());
    storage.set(cacheKey, cacheData);
  }

  clearCache = (feedType: FeedType): void => {
    const keys = storage.getAllKeys();
    const storyKeys = keys.filter((key) => key.startsWith("story_"));
    storyKeys.forEach((key) => storage.delete(key));
    this.loadedStoryIds[feedType].clear();
  };
}
