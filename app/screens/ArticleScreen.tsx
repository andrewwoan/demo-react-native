// src/screens/ArticleScreen.tsx

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
} from "react-native";
import { WebView } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../model/types";
import HackerNewsRepository from "../api/repository";
import HackerNewsApiClient from "../api/api";
import { HNComment } from "../model/types";
import RenderHtml from "react-native-render-html";

type Props = NativeStackScreenProps<RootStackParamList, "Article">;

const apiClient = new HackerNewsApiClient();
const repository = new HackerNewsRepository(apiClient);

const ArticleScreen: React.FC<Props> = ({ route }) => {
  const { url, storyId } = route.params;
  const [comments, setComments] = useState<HNComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const fetchedComments = await repository.fetchCommentsRecursive(
          storyId,
          100,
          5
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

  const renderComment = React.useCallback(
    ({ item, depth = 0 }: { item: HNComment; depth?: number }) => {
      const isCollapsed = collapsedComments.has(item.id);
      const hasReplies = item.replies && item.replies.length > 0;
      const hiddenRepliesCount = hasReplies ? countReplies(item) : 0;

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
        </View>
      );
    },
    [collapsedComments, width, toggleCollapse]
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  commentsContainer: {
    flex: 1,
    padding: 10,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  commentContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  commentAuthor: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  hiddenRepliesText: {
    fontStyle: "italic",
    color: "#666",
    marginTop: 5,
  },
});

export default ArticleScreen;
