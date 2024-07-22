import { atom } from "recoil";
import { Story, FeedType } from "../model/types";

export const feedState = atom<Story[]>({
  key: "feedState",
  default: [],
});

export const feedTypeState = atom<FeedType>({
  key: "feedTypeState",
  default: FeedType.TOP,
});
