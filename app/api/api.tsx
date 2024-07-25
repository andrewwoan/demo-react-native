// src/api/api.ts

import axios, { AxiosError } from "axios";
import { Story, FeedType } from "../model/types";
import ApiError from "./ApiError";
import {
  ApiResponse,
  ApiRequestConfig,
  ApiResponseMetadata,
} from "../model/types";

export default class HackerNewsApiClient {
  private baseUrl = "https://hacker-news.firebaseio.com/v0";

  private async makeRequest<T>(
    config: ApiRequestConfig<T>
  ): Promise<ApiResponse<T>> {
    try {
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
        console.log(config.params);
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
      throw this.handleApiError(error);
    }
  }

  private handleApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(axiosError.response.status, axiosError.message);
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
}
