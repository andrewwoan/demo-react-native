import { MMKV } from "react-native-mmkv";
import HackerNewsApiClient from "./api";
import { Story, FeedType, ApiResponse } from "../model/types";
import ApiError from "./ApiError";

const storage = new MMKV();

export default class HackerNewsRepository {
  private apiClient: HackerNewsApiClient;
  private itemsPerPage = 20;
  private loadedStoryIds: Set<number> = new Set();

  constructor(apiClient: HackerNewsApiClient) {
    this.apiClient = apiClient;
  }

  getStories = async (
    feedType: FeedType,
    page: number = 0
  ): Promise<Story[]> => {
    try {
      let storyIds = this.getCachedStoryIds(feedType);

      if (!storyIds) {
        const response: ApiResponse<number[]> =
          await this.apiClient.fetchStoryIds(feedType);
        storyIds = response.data;
        this.cacheStoryIds(feedType, storyIds);
      }

      const uniqueNewStoryIds = Array.from(new Set(storyIds)).filter(
        (id) => !this.loadedStoryIds.has(id)
      );

      let stories: Story[] = [];
      let uniqueStoriesCount = 0;
      let index = page * this.itemsPerPage;

      while (
        uniqueStoriesCount < this.itemsPerPage &&
        index < uniqueNewStoryIds.length
      ) {
        const id = uniqueNewStoryIds[index];
        const cachedStory = this.getCachedStory(id);

        if (cachedStory) {
          stories.push(cachedStory);
          console.log("CACHED STORY IS TRIGGERING SO HARD RN BROOOOO");
          if (!this.loadedStoryIds.has(cachedStory.id)) {
            this.loadedStoryIds.add(cachedStory.id);
            uniqueStoriesCount++;
          }
        } else {
          console.log("NOT CACHED STORY IS TRIGGERING SO HARD RN BROOOOO");
          const storyResponse = await this.apiClient.fetchStory(id);
          const story = storyResponse.data;
          if (story && !this.loadedStoryIds.has(story.id)) {
            this.loadedStoryIds.add(story.id);
            stories.push(story);
            uniqueStoriesCount++;
            this.cacheStory(
              story,
              this.calculateExpirationTime(storyResponse.metadata.timestamp)
            );
          }
        }

        index++;
      }

      console.log(stories);
      return stories;
    } catch (error) {
      if (error instanceof ApiError) {
        console.log("simulation is here");
        throw new ApiError(404, "Simulated 404 Error", 5);
      }
      throw error;
    }
  };

  private calculateExpirationTime(timestamp: Date): number {
    return timestamp.getTime() + 5 * 60 * 1000;
  }

  private getCachedStory(id: number): Story | null {
    const cacheKey = `story_${id}`;
    const cachedData = storage.getString(cacheKey);
    // console.log("GETTING CACHED STORY");
    // console.log(cacheKey);
    // console.log(storage.getAllKeys());
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
    const cacheData = JSON.stringify({ story, expirationTime });
    storage.set(cacheKey, cacheData);
  }

  private getCachedStoryIds(feedType: FeedType): number[] | null {
    const cacheKey = `storyIds_${feedType}`;
    const cachedData = storage.getString(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  }

  private cacheStoryIds(feedType: FeedType, storyIds: number[]): void {
    const cacheKey = `storyIds_${feedType}`;
    storage.set(cacheKey, JSON.stringify(storyIds));
  }

  clearCache = (): void => {
    const keys = storage.getAllKeys();
    keys.forEach((key) => storage.delete(key));
    this.loadedStoryIds.clear();
  };
}
