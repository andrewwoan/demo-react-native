import React, { useEffect } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useRecoilState } from "recoil";
import { MMKV } from "react-native-mmkv";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { feedState, feedTypeState } from "../state/atoms";
import { Story, FeedType } from "../types/types";
import { RootStackParamList } from "../index";

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
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchFeed = async () => {
    try {
      const response = await axios.get<number[]>(
        `https://hacker-news.firebaseio.com/v0/${feedType}stories.json`
      );
      const storyIds = response.data.slice(0, 20);
      const stories = await Promise.all(
        storyIds.map((id) =>
          axios.get<Story>(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`
          )
        )
      );
      const feedData = stories.map((story) => story.data);
      setFeed(feedData);

      console.log(
        "yesssir this some feed data yesssurr sheesh -------------------------"
      );
      console.log(JSON.stringify(feedData));

      storage.set("latestFeed", JSON.stringify(feedData));
    } catch (error) {
      console.log("ayo brooo there's an error here brahahwhwhwahwhw");
    }
  };

  useEffect(() => {
    const cachedFeed = storage.getString("latestFeed");
    if (cachedFeed) {
      setFeed(JSON.parse(cachedFeed));
    }
    fetchFeed();
  }, [feedType]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchFeed().then(() => {
      setRefreshing(false);
    });
  }, []);

  const renderItem = ({ item }: { item: Story }) => (
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
  );

  const changeFeedType = (newType: FeedType) => {
    setFeedType(newType);
  };

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <Pressable onPress={() => changeFeedType("top")}>
          <Text>Top</Text>
        </Pressable>
        <Pressable onPress={() => changeFeedType("new")}>
          <Text>Latest</Text>
        </Pressable>
        <Pressable onPress={() => changeFeedType("best")}>
          <Text>Best</Text>
        </Pressable>
      </View>
      <FlatList
        data={feed}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

export default FeedScreen;
