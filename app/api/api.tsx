// src/api/api.ts

import axios from "axios";
import { Story, FeedType } from "../types/types";
import { API } from "../constants/constants";

export const fetchStoryIds = async (feedType: FeedType): Promise<number[]> => {
  try {
    const response = await axios.get<number[]>(
      `${API.BASE_URL}/${API.ENDPOINTS.STORIES(feedType)}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching story IDs:", error);
    return [];
  }
};

export const fetchStories = async (storyIds: number[]): Promise<Story[]> => {
  try {
    const stories = await Promise.all(
      storyIds.map((id) =>
        axios.get<Story>(`${API.BASE_URL}/${API.ENDPOINTS.ITEM(id)}`)
      )
    );
    return stories.map((story) => story.data);
  } catch (error) {
    console.error("Error fetching stories:", error);
    return [];
  }
};
