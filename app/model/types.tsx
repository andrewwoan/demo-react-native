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
  Home: undefined;
  Feed: undefined;
  Article: { url: string };
  Profile: undefined;
};

export interface ApiResponseMetadata {
  attempts: number;
  id?: number;
  feedType?: FeedType;
  timestamp: Date;
  maxAttempts: number;
}

export interface ApiResponse<T> {
  data: T;
  metadata: ApiResponseMetadata;
}

export interface ApiRequestConfig<T> {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, any>;
  body?: any;
  timestamp: Date;
  currentAttempt: number;
  maxAttempts: number;
  responseType: new () => T;
}
