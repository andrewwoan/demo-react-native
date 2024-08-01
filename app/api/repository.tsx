import { MMKV } from "react-native-mmkv";
import HackerNewsApiClient from "./api";
import { Story, FeedType, HNComment, ApiResponse } from "../model/types";
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
          // console.log("this is a cached story");
          // console.log(cachedStory);
          if (!this.loadedStoryIds.has(cachedStory.id)) {
            this.loadedStoryIds.add(cachedStory.id);
            uniqueStoriesCount++;
          }
        } else {
          const storyResponse = await this.apiClient.fetchStory(id);
          const story = storyResponse.data;
          // console.log("this is a story");
          // console.log(story);
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

      // console.log("these are the stories");
      // console.log(stories);
      return stories;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(404, "Simulated 404 Error", 5);
      }
      throw error;
    }
  };

  fetchCommentsRecursive = async (
    storyId: number,
    limit: number = 100,
    maxDepth: number = Infinity
  ): Promise<HNComment[]> => {
    try {
      const cacheKey = `comments_${storyId}_${limit}_${maxDepth}`;
      const cachedComments = this.getCachedComments(cacheKey);

      if (cachedComments) {
        return cachedComments;
      }

      const storyResponse: ApiResponse<Story> = await this.apiClient.fetchStory(
        storyId
      );
      const commentIds = storyResponse.data.kids?.slice(0, limit) || [];

      const comments = await this.fetchNestedComments(commentIds, maxDepth);

      this.cacheComments(cacheKey, comments);

      return comments;
    } catch (error) {
      console.error("Error fetching comments:", error);
      if (error instanceof ApiError) {
        throw new ApiError(error.statusCode, error.message, error.maxAttempts);
      }
      throw error;
    }
  };

  private fetchNestedComments = async (
    commentIds: number[],
    depth: number
  ): Promise<HNComment[]> => {
    if (depth === 0 || commentIds.length === 0) {
      return [];
    }

    const comments = await Promise.all(
      commentIds.map(async (id) => {
        try {
          const commentResponse = await this.apiClient.fetchComment(id);
          const comment = commentResponse.data;

          if (comment.kids && comment.kids.length > 0 && depth > 1) {
            comment.replies = await this.fetchNestedComments(
              comment.kids,
              depth - 1
            );
          } else {
            comment.replies = [];
          }

          // console.log("RETURNING COMMENT");
          // console.log(comment);
          return comment;
        } catch (error) {
          console.error(`Error fetching comment ${id}:`, error);
          return null;
        }
      })
    );

    return comments.filter((comment): comment is HNComment => comment !== null);
  };

  private calculateExpirationTime(timestamp: Date): number {
    return timestamp.getTime() + 5 * 60 * 1000;
  }

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

  private getCachedComments(cacheKey: string): HNComment[] | null {
    const cachedData = storage.getString(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  }

  private cacheComments(cacheKey: string, comments: HNComment[]): void {
    console.log("THIS IS ME CACHING COMMENTS SHEEESH DA BABIE");
    console.log(comments);
    storage.set(cacheKey, JSON.stringify(comments));
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
