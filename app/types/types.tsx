export interface Story {
  id: number;
  title: string;
  url: string;
  by: string;
  score: number;
  descendants: number;
}

export type FeedType = "top" | "new" | "best";
