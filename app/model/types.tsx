export interface Story {
  id: number;
  title: string;
  url: string;
  by: string;
  score: number;
  descendants: number;
}

export enum FeedType {
  TOP = "top",
  NEW = "new",
  BEST = "best",
}

export type RootStackParamList = {
  Feed: undefined;
  Article: { url: string };
};
