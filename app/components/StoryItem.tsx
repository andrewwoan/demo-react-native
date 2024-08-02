// components/AnimatedStoryItem.tsx

import React, { memo } from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { Story } from "../model/types";

interface AnimatedStoryItemProps {
  item: Story;
  onPress: (item: Story) => void;
  index: number;
}

const AnimatedStoryItem: React.FC<AnimatedStoryItemProps> = ({
  item,
  onPress,
  index,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withDelay(index * 5, withTiming(0, { duration: 200 })),
        },
      ],
    };
  });

  const itemContainerStyle: ViewStyle = {
    ...styles.itemContainer,
    marginTop: index === 0 ? 10 : 5,
  };

  return (
    <Animated.View
      entering={FadeIn.delay(index * 5).springify()}
      exiting={FadeOut.duration(200)}
      style={animatedStyle}
    >
      <Pressable onPress={() => onPress(item)} style={itemContainerStyle}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>By: {item.by}</Text>

        <Text style={styles.stats}>
          See {item.descendants || 0} comments | Score: {item.score}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    padding: 15,
    backgroundColor: "#f2efe7",
    margin: 5,
    marginHorizontal: 10,
    borderColor: "#000000",
    borderWidth: 2,
    fontFamily: "JosefinSans_400Regular",
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  author: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  stats: {
    fontSize: 12,
    color: "#999",
  },
});

export default memo(AnimatedStoryItem, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.index === nextProps.index
  );
});
