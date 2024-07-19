import axios from "axios";
import { Story, FeedType } from "../types/types";

const BASE_URL = "https://hacker-news.firebaseio.com/v0";

export const fetchStoryIds = async (feedType: FeedType): Promise<number[]> => {
  try {
    const response = await axios.get<number[]>(
      `${BASE_URL}/${feedType.toLowerCase()}stories.json`
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
      storyIds.map((id) => axios.get<Story>(`${BASE_URL}/item/${id}.json`))
    );
    return stories.map((story) => story.data);
  } catch (error) {
    console.error("Error fetching stories:", error);
    return [];
  }
};
