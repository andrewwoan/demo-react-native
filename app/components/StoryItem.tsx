// components/MemoizedStoryItem.tsx

import React, { memo } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Story } from "../model/types";

interface StoryItemProps {
  item: Story;
  onPress: (item: Story) => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ item, onPress }) => {
  return (
    <Pressable onPress={() => onPress(item)} style={styles.itemContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text>By: {item.by}</Text>
      <Text>
        Comments: {item.descendants || 0} | Score: {item.score}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    padding: 10,
  },
  title: {
    fontWeight: "bold",
  },
});

export default memo(StoryItem, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});
