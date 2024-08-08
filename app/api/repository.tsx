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

  // getStories = async (
  //   feedType: FeedType,
  //   page: number = 0,
  // ): Promise<Story[]> => {
  //   try {
  //     let storyIds = this.getCachedStoryIds(feedType);
  //     let uniqueNewStoryIds: number[] = [];

  //     if (!storyIds) {
  //       const response: ApiResponse<number[]> =
  //         await this.apiClient.fetchStoryIds(feedType);
  //       // storyIds = response.data;

  //       console.log("storyIds before");
  //       console.log(storyIds);
  //       storyIds = Array.from(new Set(response.data)).filter(
  //         (id) => !this.loadedStoryIds.has(id),
  //       );

  //       console.log("storyIds after");
  //       console.log(storyIds);
  //       this.cacheStoryIds(feedType, storyIds);
  //     }

  //     console.log(
  //       "this is the story ides and if they have duplicate vlaues or not",
  //     );
  //     console.log(new Set(storyIds).size !== storyIds.length);

  //     let stories: Story[] = [];
  //     let uniqueStoriesCount = 0;
  //     let index = page * this.itemsPerPage;

  //     while (
  //       uniqueStoriesCount < this.itemsPerPage &&
  //       index < storyIds.length
  //     ) {
  //       console.log(storyIds);
  //       const id = storyIds[index];
  //       const cachedStory = this.getCachedStory(id);

  //       console.log("-----------------");

  //       if (cachedStory) {
  //         stories.push(cachedStory);
  //         if (!this.loadedStoryIds.has(cachedStory.id)) {
  //           this.loadedStoryIds.add(cachedStory.id);
  //           uniqueStoriesCount++;
  //         }
  //       } else {
  //         const storyResponse = await this.apiClient.fetchStory(id);
  //         const story = storyResponse.data;
  //         if (story && !this.loadedStoryIds.has(story.id)) {
  //           this.loadedStoryIds.add(story.id);
  //           stories.push(story);
  //           uniqueStoriesCount++;
  //           this.cacheStory(
  //             story,
  //             this.calculateExpirationTime(storyResponse.metadata.timestamp),
  //           );
  //         }
  //       }

  //       index++;
  //     }

  //     return stories;
  //   } catch (error) {
  //     if (error instanceof ApiError) {
  //       throw new ApiError(404, "Simulated 404 Error", 5);
  //     }
  //     throw error;
  //   }
  // };

  removeDuplicates(arr: number[]) {}

  getStories = async (
    feedType: FeedType,
    page: number = 0,
  ): Promise<Story[]> => {
    try {
      let storyIds = this.getCachedStoryIds(feedType);
      let uniqueNewStoryIds: number[];

      let removedUniqueIds: number[] = [];

      if (!storyIds) {
        const response: ApiResponse<number[]> =
          await this.apiClient.fetchStoryIds(feedType);
        storyIds = response.data;

        this.cacheStoryIds(feedType, storyIds);
      }

      uniqueNewStoryIds = Array.from(new Set(storyIds)).filter((id) => {
        !this.loadedStoryIds.has(id);
      });

      removeDuplicates;

      let stories: Story[] = [];
      let uniqueStoriesCount = 0;
      let index = page * this.itemsPerPage;

      while (
        uniqueStoriesCount < this.itemsPerPage &&
        index < uniqueNewStoryIds.length
      ) {
        console.log("this is the unique story ids");
        console.log(uniqueNewStoryIds);
        const id = uniqueNewStoryIds[index];
        const cachedStory = this.getCachedStory(id);

        console.log("-----------------");

        if (cachedStory) {
          console.log("WE ARE GETTING A CACHED STORY");
          stories.push(cachedStory);
          if (!this.loadedStoryIds.has(cachedStory.id)) {
            this.loadedStoryIds.add(cachedStory.id);
            uniqueStoriesCount++;
          }
        } else {
          console.log("WE ARE NOT GETTING A CACHED STORY");
          const storyResponse = await this.apiClient.fetchStory(id);
          const story = storyResponse.data;
          if (story && !this.loadedStoryIds.has(story.id)) {
            this.loadedStoryIds.add(story.id);
            stories.push(story);
            uniqueStoriesCount++;
            this.cacheStory(
              story,
              this.calculateExpirationTime(storyResponse.metadata.timestamp),
            );
          }
        }

        index++;
      }

      return stories;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(404, "Simulated 404 Error", 5);
      }
      throw error;
    }
  };

  fetchFullThread = async (commentId: number): Promise<HNComment> => {
    try {
      const commentResponse = await this.apiClient.fetchComment(commentId);
      const comment = commentResponse.data;
      comment.replies = await this.fetchNestedComments(comment.kids || [], 3);
      return comment;
    } catch (error) {
      console.error("Error fetching full thread:", error);
      throw error;
    }
  };

  fetchCommentsRecursive = async (
    storyId: number,
    parentCommentId: number | null = null,
    limit: number = 100,
    maxDepth: number = 3,
  ): Promise<HNComment[]> => {
    try {
      const cacheKey = `comments_${storyId}_${parentCommentId}_${limit}_${maxDepth}`;
      const cachedComments = this.getCachedComments(cacheKey);

      if (cachedComments) {
        return cachedComments;
      }

      let commentIds: number[];
      // If we are fetching comments, we can either fetch them from the parent level
      // Or if the parent comment already exists, fetch the comment from that parent to get its replies
      // this is in the case for loading more comments
      if (parentCommentId === null) {
        const storyResponse: ApiResponse<Story> =
          await this.apiClient.fetchStory(storyId);
        commentIds = storyResponse.data.kids?.slice(0, limit) || [];
      } else {
        const parentCommentResponse: ApiResponse<HNComment> =
          await this.apiClient.fetchComment(parentCommentId);
        commentIds = parentCommentResponse.data.kids || [];
      }

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

  //Basically get the comments of the comment we want to show
  private fetchNestedComments = async (
    commentIds: number[],
    depth: number,
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
              depth - 1,
            );
          } else {
            comment.replies = [];
          }

          return comment;
        } catch (error) {
          console.error(`Error fetching comment ${id}:`, error);
          return null;
        }
      }),
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

  // Bookmarks

  private getBookmarksByType = (type: string): number[] => {
    const bookmarksString = storage.getString(`bookmarks_${type}`);
    return bookmarksString ? JSON.parse(bookmarksString) : [];
  };

  private setBookmarksByType = (type: string, bookmarks: number[]): void => {
    storage.set(`bookmarks_${type}`, JSON.stringify(bookmarks));
  };

  getBookmarks = (type: string): number[] => {
    return this.getBookmarksByType(type);
  };

  addBookmark = (type: string, storyId: number): void => {
    const bookmarks = this.getBookmarksByType(type);
    if (!bookmarks.includes(storyId)) {
      const updatedBookmarks = [...bookmarks, storyId];
      this.setBookmarksByType(type, updatedBookmarks);
    }
  };

  removeBookmark = (type: string, storyId: number): void => {
    const bookmarks = this.getBookmarksByType(type);
    const updatedBookmarks = bookmarks.filter((id) => id !== storyId);
    if (updatedBookmarks.length !== bookmarks.length) {
      this.setBookmarksByType(type, updatedBookmarks);
    }
  };

  isBookmarked = (type: string, storyId: number): boolean => {
    const bookmarks = this.getBookmarksByType(type);
    return bookmarks.includes(storyId);
  };

  getBookmarkedStories = async (type: string): Promise<Story[]> => {
    const bookmarkIds = this.getBookmarksByType(type);
    const stories = await Promise.all(
      bookmarkIds.map(async (id) => {
        const cachedStory = this.getCachedStory(id);
        console.log("we are returning this");
        return cachedStory;
      }),
    );
    return stories.filter((story): story is Story => story !== null);
  };
}
