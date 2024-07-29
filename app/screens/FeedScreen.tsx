// src/screens/FeedScreen.tsx

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
import Toast from "react-native-toast-message";
import { feedState, feedTypeState } from "../state/atoms";

import { Story, FeedType } from "../model/types";
import { RootStackParamList } from "../model/types";
import { PAGINATION } from "../model/constants";

import HackerNewsApiClient from "../api/api";
import ApiError from "../api/ApiError";
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

const MAX_RETRY_ATTEMPTS = 3;

const FeedScreen: React.FC<Props> = ({ navigation }) => {
  const [feed, setFeed] = useRecoilState(feedState);
  const [feedType, setFeedType] = useRecoilState(feedTypeState);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [page, setPage] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

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

  const retryCountRef = useRef(0);

  const loadStories = useCallback(
    async (refresh: boolean = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const newPage = refresh ? 0 : page;
        const stories = await repository.getStories(feedType, newPage);

        setFeed((prevFeed) => (refresh ? stories : [...prevFeed, ...stories]));
        setPage((prevPage) => newPage + 1);
        if (stories) {
          retryCountRef.current = 0;
        }
        setIsOffline(false);
      } catch (error) {
        retryCountRef.current += 1;

        if (error instanceof ApiError && error.statusCode === 408) {
          setIsOffline(true);
          Toast.show({
            type: "error",
            text1: "Network Error: Please check your internet connection",
            text2: `Retrying... Attempt ${retryCountRef.current} of ${error.maxAttempts}`,
            position: "bottom",
            visibilityTime: 2000,
            autoHide: true,
          });
          setTimeout(() => {
            loadStories(true);
          }, 2000);
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "An unexpected error occurred. Please try again later.",
            position: "bottom",
            visibilityTime: 4000,
            autoHide: true,
          });
        }
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
    repository.clearCache();
    setRetryCount(0);
    await loadStories(true);
    setRefreshing(false);
  }, [loadStories, feedType]);

  const changeFeedType = useCallback(
    (newType: FeedType) => {
      if (newType !== feedType) {
        setFeedType(newType);
        setPage(0);
        setFeed([]);
      }
    },
    [feedType]
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
        <View style={styles.offlineNotice}>
          <Text style={styles.offlineNoticeText}>
            Offline mode: Showing cached data
          </Text>
        </View>
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
      <View style={styles.listContainer}>
        <FlatList
          data={memoizedFeed}
          renderItem={({ item, index }) => (
            <StoryItem item={item} onPress={handleStoryPress} index={index} />
          )}
          keyExtractor={(item: Story) => {
            return item.id.toString();
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListFooterComponent={<FooterComponent loading={loading} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={PAGINATION.THRESHOLD}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  offlineNotice: {
    paddingVertical: 10,
    backgroundColor: "#FFD700",
  },
  offlineNoticeText: {
    textAlign: "center",
    color: "#333",
    fontWeight: "bold",
  },
  feedTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  feedTypeButton: {
    padding: 10,
    borderRadius: 20,
  },
  feedTypeText: {
    color: "#666",
    fontWeight: "600",
  },
  activeFeedType: {
    color: "#FF6600",
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
  },
});

export default FeedScreen;
