// src/screens/FeedScreen.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRecoilState } from "recoil";
import { MMKV } from "react-native-mmkv";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { feedState, feedTypeState } from "../state/atoms";
import { Story, FeedType } from "../types/types";
import { RootStackParamList } from "../index";
import { fetchStoryIds, fetchStories } from "../api/api";
import { PAGINATION, STORAGE_KEYS } from "../constants/constants";

const storage = new MMKV();

type FeedScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Feed"
>;

type Props = {
  navigation: FeedScreenNavigationProp;
};

const FeedScreen: React.FC<Props> = ({ navigation }) => {
  const [feed, setFeed] = useRecoilState(feedState);
  const [feedType, setFeedType] = useRecoilState(feedTypeState);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storyIds, setStoryIds] = useState<number[]>([]);

  const loadStoryIds = useCallback(async () => {
    const ids = await fetchStoryIds(feedType);
    setStoryIds(ids);
  }, [feedType]);

  const keyExtractor = useCallback((item: Story | null) => {
    return item && item.id ? item.id.toString() : Math.random().toString();
  }, []);

  const loadStories = useCallback(async () => {
    if (loading || storyIds.length === 0) return;

    setLoading(true);
    try {
      const startIndex = feed.length;
      const endIndex = startIndex + PAGINATION.ITEMS_PER_PAGE;
      const newStoryIds = storyIds.slice(startIndex, endIndex);

      const newStories = await fetchStories(newStoryIds);

      const newFeed = [...feed, ...newStories];

      console.log(
        "yesssir this some feed data yesssurr sheesh -------------------------"
      );
      console.log(JSON.stringify(newFeed));

      setFeed(newFeed);
      storage.set(STORAGE_KEYS.LATEST_FEED, JSON.stringify(newFeed));
    } catch (error) {
      console.log("ayo brooo there's an error here brahahwhwhwahwhw");
    } finally {
      setLoading(false);
    }
  }, [feed, storyIds, loading]);

  useEffect(() => {
    loadStoryIds();
  }, [feedType, loadStoryIds]);

  useEffect(() => {
    if (storyIds.length > 0 && feed.length === 0) {
      loadStories();
    }
  }, [storyIds, feed.length, loadStories]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setFeed([]);
    loadStoryIds().then(() => {
      setRefreshing(false);
    });
  }, [loadStoryIds]);

  const renderItem = useCallback(
    ({ item }: { item: Story }) => (
      <Pressable
        onPress={() => navigation.navigate("Article", { url: item.url })}
      >
        <View style={{ padding: 10 }}>
          <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
          <Text>By: {item.by}</Text>
          <Text>
            Comments: {item.descendants || 0} | Score: {item.score}
          </Text>
        </View>
      </Pressable>
    ),
    [navigation]
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={{ padding: 10 }}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  const changeFeedType = (newType: FeedType) => {
    setFeedType(newType);
    setFeed([]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          padding: 10,
        }}
      >
        <Pressable onPress={() => changeFeedType(FeedType.TOP)}>
          <Text style={{ color: feedType === FeedType.TOP ? "blue" : "black" }}>
            Top
          </Text>
        </Pressable>
        <Pressable onPress={() => changeFeedType(FeedType.NEW)}>
          <Text style={{ color: feedType === FeedType.NEW ? "blue" : "black" }}>
            Latest
          </Text>
        </Pressable>
        <Pressable onPress={() => changeFeedType(FeedType.BEST)}>
          <Text
            style={{ color: feedType === FeedType.BEST ? "blue" : "black" }}
          >
            Best
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={feed.filter(Boolean)} // Filter out null or undefined items
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadStories}
        onEndReachedThreshold={PAGINATION.THRESHOLD}
      />
    </View>
  );
};

export default FeedScreen;
