// src/api/api.ts

import axios, { AxiosError, AxiosResponse } from "axios";
import { Story, FeedType } from "../model/types";
import { API } from "../model/constants";
import ApiError from "./ApiError";

export default class HackerNewsApiClient {
  private baseUrl = "https://hacker-news.firebaseio.com/v0";
  private simulateError = true;
  private errorSimulated = false;
  private errorSimulatedMax = 0;

  setSimulateError(simulate: boolean) {
    this.simulateError = simulate;
    this.errorSimulated = false;
    this.errorSimulatedMax = 0;
  }

  private simulateErrorResponse(response: AxiosResponse): AxiosResponse {
    const errorResponse: AxiosResponse = {
      ...response,
      status: 404,
      statusText: "Not Found",
      data: "Simulated 404 Error",
    };
    return errorResponse;
  }

  private handleApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // throw new ApiError(axiosError.response.status, axiosError.message);
        throw new Error("Hey this is a 404 error");
      }
    }
    throw error;
  }

  private getExpirationTime(headers: Record<string, string>): number {
    const cacheControl = headers["cache-control"];
    if (cacheControl) {
      const maxAge = cacheControl.match(/max-age=(\d+)/);
      if (maxAge && maxAge[1]) {
        return Date.now() + parseInt(maxAge[1]) * 1000;
      }
    }
    return Date.now() + 5 * 60 * 1000; // Default to 5 minutes if no Cache-Control header
  }

  async fetchStoryIds(
    feedType: FeedType //extend base object
    //generics
  ): Promise<{ storyIds: number[]; expirationTime: number }> {
    try {
      const response = await axios.get<number[]>(
        `${this.baseUrl}/${feedType}stories.json`
      );

      if (this.simulateError && this.errorSimulatedMax < 3) {
        this.errorSimulatedMax++;
        this.errorSimulated = true;
        const errorResponse = this.simulateErrorResponse(response);
        console.log("THIS IS TRIGGERING ONCE SHEESH BRO");
        throw new ApiError(errorResponse.status, errorResponse.statusText);
      }

      console.log(response);
      return {
        storyIds: response.data,
        expirationTime: this.getExpirationTime(
          response.headers as Record<string, string>
        ),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      this.handleApiError(error);
    }
  }

  async fetchStory(id: number): Promise<Story> {
    try {
      const response = await axios.get<Story>(
        `${this.baseUrl}/item/${id}.json`
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }
}
