import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { useRecoilState } from "recoil";
import { MMKV } from "react-native-mmkv";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { feedState, feedTypeState } from "../state/atoms";
import { Story, FeedType } from "../model/types";
import { RootStackParamList } from "../model/types";
import { fetchStoryIds, fetchStories } from "../api/api";
import { PAGINATION, STORAGE_KEYS } from "../model/constants";
import StoryItem from "../components/StoryItem";
import FooterComponent from "../components/Footer";

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
  const [isOffline, setIsOffline] = useState(false);

  const handleStoryPress = useCallback(
    (item: Story) => {
      if (Platform.OS === "web") {
        Linking.openURL(item.url);
      } else {
        navigation.navigate("Article", { url: item.url });
      }
    },
    [navigation]
  );

  const loadFromCache = useCallback(() => {
    const cachedFeed = storage.getString(STORAGE_KEYS.LATEST_FEED);
    if (cachedFeed) {
      setFeed(JSON.parse(cachedFeed));
      setIsOffline(true);
    }
  }, []);

  const loadStoryIds = useCallback(async () => {
    try {
      const ids = await fetchStoryIds(feedType);
      console.log(ids);

      if (ids.length > 0) {
        setStoryIds(ids);
        setIsOffline(false);
      } else {
        loadFromCache();
      }
    } catch (error) {}
  }, [feedType, loadFromCache]);

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

      setFeed(newFeed);
      storage.set(STORAGE_KEYS.LATEST_FEED, JSON.stringify(newFeed));
      setIsOffline(false);
    } catch (error) {
      console.error("Error loading data.");
    } finally {
      setLoading(false);
    }
  }, [feed, storyIds]);

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
      <StoryItem item={item} onPress={() => handleStoryPress(item)} />
    ),
    [handleStoryPress]
  );

  const changeFeedType = (newType: FeedType) => {
    setFeedType(newType);
    setFeed([]);
    setIsOffline(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {isOffline && (
        <Text
          style={{
            textAlign: "center",
            padding: 10,
            backgroundColor: "yellow",
          }}
        >
          Offline mode: Showing cached data
        </Text>
      )}
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
        data={feed.filter(Boolean)}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={<FooterComponent loading={loading} />}
        onEndReached={loadStories}
        onEndReachedThreshold={PAGINATION.THRESHOLD}
      />
    </View>
  );
};

export default FeedScreen;
