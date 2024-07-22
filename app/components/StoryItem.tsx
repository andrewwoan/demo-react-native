// src/components/StoryItem.tsx

import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Story } from "../model/types";

interface StoryItemProps {
  item: Story;
  onPress: () => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ item, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.itemContainer}>
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

export default StoryItem;
