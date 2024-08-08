import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import HackerNewsRepository from "../api/repository";
import HackerNewsApiClient from "../api/api";
import { Story } from "../model/types";
import BookmarkIcon from "../components/svgs/BookmarkIcon";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../model/types";

const apiClient = new HackerNewsApiClient();
const repository = new HackerNewsRepository(apiClient);

type BookmarksScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Feed"
>;

type Props = {
  navigation: BookmarksScreenNavigationProp;
};

const BookmarksScreen: React.FC<Props> = ({ navigation }) => {
  const [bookmarkedStories, setBookmarkedStories] = useState<Story[]>([]);
  const [activeType, setActiveType] = useState<string>("story");

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      loadBookmarkedStories(activeType);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    console.log("yo this issssss starting intitial load");
    loadBookmarkedStories(activeType);
  }, [activeType]);

  const loadBookmarkedStories = async (type: string) => {
    const stories = await repository.getBookmarkedStories(type);
    setBookmarkedStories(stories);
  };

  const handleBookmarkToggle = (id: number, isBookmarked: boolean) => {
    if (!isBookmarked) {
      setBookmarkedStories((prevStories) =>
        prevStories.filter((story) => story.id !== id),
      );
    }
  };

  const renderItem = ({ item }: { item: Story }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.author}>by {item.by}</Text>
      <BookmarkIcon
        itemId={item.id}
        type={activeType}
        onToggle={(isBookmarked) => handleBookmarkToggle(item.id, isBookmarked)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeType === "stories" && styles.activeTab]}
          onPress={() => setActiveType("story")}
        >
          <Text>Stories</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeType === "jobs" && styles.activeTab]}
          onPress={() => setActiveType("jobs")}
        >
          <Text>Jobs</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeType === "ask" && styles.activeTab]}
          onPress={() => setActiveType("ask")}
        >
          <Text>Ask</Text>
        </Pressable>
      </View>
      <FlatList
        data={bookmarkedStories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  itemContainer: {},
  author: {},
  title: {},
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  tab: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  activeTab: {
    backgroundColor: "#e0e0e0",
  },
});

export default BookmarksScreen;
