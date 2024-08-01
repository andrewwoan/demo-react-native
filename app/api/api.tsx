// src/api/api.ts

import axios, { AxiosError } from "axios";
import { Story, FeedType, HNComment } from "../model/types";
import ApiError from "./ApiError";
import {
  ApiResponse,
  ApiRequestConfig,
  ApiResponseMetadata,
} from "../model/types";

export default class HackerNewsApiClient {
  private baseUrl = "https://hacker-news.firebaseio.com/v0";
  private simulateError = false;
  private errorSimulationCount = 0;

  setSimulateError(simulate: boolean) {
    this.simulateError = simulate;
    this.errorSimulationCount = 0;
  }

  private async makeRequest<T>(
    config: ApiRequestConfig<T>
  ): Promise<ApiResponse<T>> {
    try {
      if (
        this.simulateError &&
        this.errorSimulationCount < config.maxAttempts
      ) {
        this.errorSimulationCount++;
        throw new ApiError(404, "Simulated 404 Error", config.maxAttempts);
      }

      const response = await axios({
        url: `${this.baseUrl}${config.endpoint}`,
        method: config.method,
        params: config.params,
        data: config.body,
      });

      const metadata: ApiResponseMetadata = {
        attempts: config.currentAttempt,
        timestamp: config.timestamp,
        maxAttempts: config.maxAttempts,
      };

      if ("id" in response.data) {
        metadata.id = response.data.id;
      }

      if (config.params && "feedType" in config.params) {
        metadata.feedType = config.params.feedType as FeedType;
      }

      return {
        data: response.data,
        metadata,
      };
    } catch (error) {
      if (config.currentAttempt < config.maxAttempts) {
        config.currentAttempt++;
        return this.makeRequest(config);
      }
      throw this.handleApiError(error, config.maxAttempts);
    }
  }

  private handleApiError(error: unknown, maxAttempts: number): never {
    if (error instanceof ApiError) {
      error.maxAttempts = maxAttempts;
      throw error;
    }
    if (axios.isAxiosError(error)) {
      console.log("axios bro");
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          axiosError.response.status,
          axiosError.message,
          maxAttempts
        );
      }
    }
    throw error;
  }

  async fetchStoryIds(feedType: FeedType): Promise<ApiResponse<number[]>> {
    const config: ApiRequestConfig<number[]> = {
      endpoint: `/${feedType}stories.json`,
      method: "GET",
      params: { feedType },
      timestamp: new Date(),
      currentAttempt: 1,
      maxAttempts: 5,
      responseType: Array,
    };

    return this.makeRequest(config);
  }

  async fetchStory(id: number): Promise<ApiResponse<Story>> {
    const config: ApiRequestConfig<Story> = {
      endpoint: `/item/${id}.json`,
      method: "GET",
      params: { id },
      timestamp: new Date(),
      currentAttempt: 1,
      maxAttempts: 3,
      responseType: Object as unknown as new () => Story,
    };

    return this.makeRequest(config);
  }

  async fetchComment(commentId: number): Promise<ApiResponse<HNComment>> {
    const config: ApiRequestConfig<HNComment> = {
      endpoint: `/item/${commentId}.json`,
      method: "GET",
      params: { id: commentId },
      timestamp: new Date(),
      currentAttempt: 1,
      maxAttempts: 3,
      responseType: Object as unknown as new () => HNComment,
    };

    return this.makeRequest(config);
  }
}
