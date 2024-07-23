import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
import { useRecoilState } from "recoil";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { feedState, feedTypeState } from "../state/atoms";

import { Story, FeedType } from "../model/types";
import { RootStackParamList } from "../model/types";
import { PAGINATION } from "../model/constants";

import HackerNewsApiClient from "../api/api";
import HackerNewsRepository from "../api/repository";

import StoryItem from "../components/StoryItem";
import FooterComponent from "../components/Footer";

type FeedScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Feed"
>;

type Props = {
  navigation: FeedScreenNavigationProp;
};

const apiClient = new HackerNewsApiClient();
const repository = new HackerNewsRepository(apiClient);

const FeedScreen: React.FC<Props> = ({ navigation }) => {
  const [feed, setFeed] = useRecoilState(feedState);
  const [feedType, setFeedType] = useRecoilState(feedTypeState);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [page, setPage] = useState(0);

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

  const loadStories = useCallback(
    async (refresh: boolean = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const newPage = refresh ? 0 : page;
        const stories = await repository.getStories(feedType, newPage);
        setFeed((prevFeed) => (refresh ? stories : [...prevFeed, ...stories]));
        setPage((prevPage) => (refresh ? 1 : prevPage + 1));
        setIsOffline(false);
      } catch (error) {
        console.error("Error loading stories:", error);
        setIsOffline(true);
      } finally {
        setLoading(false);
      }
    },
    [feedType, loading, page, setFeed]
  );

  useEffect(() => {
    loadStories(true);
  }, [feedType]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStories(true);
    setRefreshing(false);
  }, [loadStories]);

  const changeFeedType = useCallback(
    (newType: FeedType) => {
      if (newType !== feedType) {
        setFeedType(newType);
        setPage(0);
        setFeed([]);
      }
    },
    [feedType, setFeedType, setFeed]
  );

  const handleEndReached = useCallback(() => {
    if (!loading) {
      loadStories();
    }
  }, [loading, loadStories]);

  const memoizedFeed = useMemo(() => feed, [feed]);

  return (
    <View style={styles.container}>
      {isOffline && (
        <Text style={styles.offlineNotice}>
          Offline mode: Showing cached data
        </Text>
      )}
      <View style={styles.feedTypeContainer}>
        {Object.values(FeedType).map((type) => (
          <Pressable
            key={type}
            onPress={() => changeFeedType(type)}
            style={styles.feedTypeButton}
          >
            <Text
              style={[
                styles.feedTypeText,
                feedType === type && styles.activeFeedType,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={memoizedFeed}
        renderItem={({ item }) => (
          <StoryItem item={item} onPress={() => handleStoryPress(item)} />
        )}
        keyExtractor={(item: Story) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={<FooterComponent loading={loading} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={PAGINATION.THRESHOLD}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineNotice: {
    textAlign: "center",
    padding: 10,
    backgroundColor: "yellow",
  },
  feedTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  feedTypeButton: {
    padding: 5,
  },
  feedTypeText: {
    color: "black",
  },
  activeFeedType: {
    color: "blue",
  },
});

export default FeedScreen;
