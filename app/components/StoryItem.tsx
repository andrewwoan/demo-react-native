import React, { memo } from "react";
import { Pressable, Text, StyleSheet, ViewStyle, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { Story } from "../model/types";
import Svg, { Path } from "react-native-svg";

import BookmarkIcon from "./svgs/BookmarkIcon";
import ShareIcon from "./svgs/ShareIcon";

interface AnimatedStoryItemProps {
  item: Story;
  onPress: (item: Story) => void;
  index: number;
}

const TriangleArrow = ({ direction = "up" }) => (
  <Svg width="20" height="20" viewBox="0 0 20 20">
    <Path
      d={direction === "up" ? "M10 2L18 18H2L10 2Z" : "M10 18L2 2H18L10 18Z"}
      fill="gray"
      stroke="black"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);

const AnimatedStoryItem: React.FC<AnimatedStoryItemProps> = ({
  item,
  onPress,
  index,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withDelay(index * 5, withTiming(0, { duration: 200 })),
      },
    ],
  }));

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
        <View style={styles.leftContainer}>
          <View style={styles.scoreContainer}>
            <TriangleArrow direction="up" />
            <Text style={styles.score}>{item.score}</Text>
            <TriangleArrow direction="down" />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.author}>By: {item.by}</Text>
            <Text style={styles.stats}>
              See {item.descendants || 0} comments
            </Text>
          </View>
        </View>

        <View style={styles.ctaContainer}>
          <BookmarkIcon />
          <ShareIcon />
        </View>
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
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    borderColor: "#000000",
    borderWidth: 2,
    fontFamily: "JosefinSans_400Regular",
  },
  leftContainer: {
    display: "flex",
    flexDirection: "row",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    maxWidth: 500,
    gap: 5,
  },
  ctaContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
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
  scoreContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    marginVertical: 5,
  },
  score: {
    marginHorizontal: 10,
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
