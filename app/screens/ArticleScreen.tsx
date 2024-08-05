import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Linking,
  Pressable,
  Button,
} from "react-native";
import { WebView } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../model/types";
import HackerNewsRepository from "../api/repository";
import HackerNewsApiClient from "../api/api";
import { HNComment } from "../model/types";
import RenderHtml from "react-native-render-html";

import {
  useFonts,
  JosefinSans_100Thin,
  JosefinSans_100Thin_Italic,
  JosefinSans_200ExtraLight,
  JosefinSans_400Regular,
  JosefinSans_500Medium,
  JosefinSans_600SemiBold,
  JosefinSans_700Bold,
} from "@expo-google-fonts/dev";

type Props = NativeStackScreenProps<RootStackParamList, "Article">;

const apiClient = new HackerNewsApiClient();
const repository = new HackerNewsRepository(apiClient);

const ArticleScreen: React.FC<Props> = ({ route }) => {
  let [fontsLoaded] = useFonts({
    JosefinSans_100Thin,
    JosefinSans_100Thin_Italic,
    JosefinSans_200ExtraLight,
    JosefinSans_400Regular,
    JosefinSans_500Medium,
    JosefinSans_600SemiBold,
    JosefinSans_700Bold,
  });

  const { url, storyId } = route.params;
  const [comments, setComments] = useState<HNComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(
    new Set()
  );
  const [loadingMoreComments, setLoadingMoreComments] = useState<{
    [key: number]: boolean;
  }>({});

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const fetchedComments = await repository.fetchCommentsRecursive(
          storyId,
          100,
          3
        );
        setComments(fetchedComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [storyId]);

  const toggleCollapse = (commentId: number) => {
    setCollapsedComments((prevCollapsed) => {
      const newCollapsed = new Set(prevCollapsed);
      if (newCollapsed.has(commentId)) {
        newCollapsed.delete(commentId);
      } else {
        newCollapsed.add(commentId);
      }
      return newCollapsed;
    });
  };

  const countReplies = (comment: HNComment): number => {
    let count = 0;
    if (comment.replies) {
      count += comment.replies.length;
      for (const reply of comment.replies) {
        count += countReplies(reply);
      }
    }
    return count;
  };

  const loadMoreComments = async (commentId: number) => {
    setLoadingMoreComments((prev) => ({ ...prev, [commentId]: true }));
    try {
      const moreComments = await repository.fetchMoreComments(commentId);
      setComments((prevComments) =>
        updateCommentsTree(prevComments, commentId, moreComments)
      );
    } catch (error) {
      console.error("Error loading more comments:", error);
    } finally {
      setLoadingMoreComments((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const updateCommentsTree = (
    comments: HNComment[],
    targetId: number,
    newReplies: HNComment[]
  ): HNComment[] => {
    return comments.map((comment) => {
      if (comment.id === targetId) {
        return { ...comment, replies: newReplies };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentsTree(comment.replies, targetId, newReplies),
        };
      }
      return comment;
    });
  };

  const renderComment = React.useCallback(
    ({ item, depth = 0 }: { item: HNComment; depth?: number }) => {
      const isCollapsed = collapsedComments.has(item.id);
      const hasReplies = item.replies && item.replies.length > 0;
      const hiddenRepliesCount = hasReplies ? countReplies(item) : 0;
      const showLoadMore =
        depth === 2 && item.kids && item.kids.length > item.replies!.length;

      return (
        <View style={[styles.commentContainer, { marginLeft: depth * 20 }]}>
          <Pressable onPress={() => hasReplies && toggleCollapse(item.id)}>
            <Text style={styles.commentAuthor}>
              {item.by} {hasReplies && (isCollapsed ? "▼" : "▲")}
            </Text>
          </Pressable>
          {!isCollapsed && (
            <RenderHtml
              contentWidth={width}
              source={{ html: item.text || "" }}
              tagsStyles={tagsStyles}
            />
          )}
          {isCollapsed && hiddenRepliesCount > 0 && (
            <Text style={styles.hiddenRepliesText}>
              {hiddenRepliesCount} hidden{" "}
              {hiddenRepliesCount === 1 ? "reply" : "replies"}
            </Text>
          )}
          {hasReplies &&
            !isCollapsed &&
            item.replies!.map((reply) => (
              <View key={reply.id.toString()}>
                {renderComment({ item: reply, depth: depth + 1 })}
              </View>
            ))}
          {showLoadMore && (
            <Button
              title={
                loadingMoreComments[item.id]
                  ? "Loading..."
                  : "Load more replies"
              }
              onPress={() => loadMoreComments(item.id)}
              disabled={loadingMoreComments[item.id]}
            />
          )}
        </View>
      );
    },
    [
      collapsedComments,
      width,
      toggleCollapse,
      loadingMoreComments,
      loadMoreComments,
    ]
  );

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webView}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.description.includes("X-Frame-Options")) {
            Linking.openURL(url);
          }
        }}
      />
      <View style={styles.commentsContainer}>
        <Text style={styles.commentsTitle}>Comments</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={comments}
            renderItem={({ item }) => renderComment({ item })}
            keyExtractor={(item) => item.id.toString()}
          />
        )}
      </View>
    </View>
  );
};

const tagsStyles = {
  body: {
    fontFamily: "JosefinSans_400Regular",
  },
  div: {
    fontFamily: "JosefinSans_400Regular",
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    fontFamily: "JosefinSans_400Regular",
  },
  webView: {
    flex: 1,
  },
  commentsContainer: {
    flex: 1,
    padding: 10,
    fontFamily: "JosefinSans_400Regular",
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "JosefinSans_400Regular",
    marginBottom: 10,
  },
  commentContainer: {
    fontFamily: "JosefinSans_400Regular",
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  commentAuthor: {
    fontWeight: "bold",
    fontFamily: "JosefinSans_400Regular",
    marginBottom: 5,
  },
  hiddenRepliesText: {
    fontStyle: "italic",
    fontFamily: "JosefinSans_400Regular",
    color: "#666",
    marginTop: 5,
  },
});

export default ArticleScreen;
