// src/api/api.ts

import axios from "axios";
import { Story, FeedType } from "../model/types";
import { API } from "../model/constants";

export default class HackerNewsApiClient {
  private baseUrl = "https://hacker-news.firebaseio.com/v0";

  async fetchStoryIds(feedType: FeedType): Promise<number[]> {
    const response = await axios.get<number[]>(
      `${this.baseUrl}/${feedType}stories.json`
    );
    return response.data;
  }

  async fetchStory(id: number): Promise<Story> {
    const response = await axios.get<Story>(`${this.baseUrl}/item/${id}.json`);
    return response.data;
  }
}
