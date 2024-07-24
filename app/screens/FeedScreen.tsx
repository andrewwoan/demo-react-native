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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useRecoilState } from "recoil";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { feedState, feedTypeState } from "../state/atoms";

import { Story, FeedType } from "../model/types";
import { RootStackParamList } from "../model/types";
import { PAGINATION } from "../model/constants";

import HackerNewsApiClient from "../api/api";
import HackerNewsRepository from "../api/repository";

import AnimatedStoryItem from "../components/StoryItem";
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

  const fadeAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

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
        fadeAnim.value = withTiming(0, { duration: 300 }, () => {
          setFeedType(newType);
          setPage(0);
          setFeed([]);
          fadeAnim.value = withTiming(1, { duration: 300 });
        });
      }
    },
    [feedType, setFeedType, setFeed, fadeAnim]
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
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.offlineNotice}
        >
          <Text style={styles.offlineNoticeText}>
            Offline mode: Showing cached data
          </Text>
        </Animated.View>
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
      <Animated.View style={[styles.listContainer, animatedStyle]}>
        <FlatList
          data={memoizedFeed}
          renderItem={({ item, index }) => (
            <AnimatedStoryItem
              item={item}
              onPress={handleStoryPress}
              index={index}
            />
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
      </Animated.View>
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
