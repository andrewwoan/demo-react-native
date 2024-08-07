import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Animated,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../model/types";
import HackerNewsRepository from "../api/repository";
import HackerNewsApiClient from "../api/api";
import { HNComment } from "../model/types";
import RenderHtml from "react-native-render-html";
import { Ionicons } from "@expo/vector-icons";

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

const INITIAL_COMMENT_DEPTH = 3;
const LOAD_MORE_DEPTH = 3;
const VIEW_THREAD_DEPTH = 6;
const LOADED_COMMENT_LIMIT = 100;

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(width)).current;
  const [threadView, setThreadView] = useState<HNComment | null>(null);
  const [threadDepth, setThreadDepth] = useState(0);
  const [threadHistory, setThreadHistory] = useState<HNComment[]>([]);

  //grab the comments from the backend to a depth of 3 a limit of 100 comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const fetchedComments = await repository.fetchCommentsRecursive(
          storyId,
          null,
          LOADED_COMMENT_LIMIT,
          INITIAL_COMMENT_DEPTH
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

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? width : 0;
    Animated.timing(drawerAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsDrawerOpen(!isDrawerOpen);
  };

  //if the ID exists in the set, remove it from the list, which means it will show
  //if the ID does not exist in the set, add it to hide it, this will switch the isCollapsed = true
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

  //for each comment, loop through it's array of comments and count it
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

  const loadMoreComments = async (commentId: number, currentDepth: number) => {
    setLoadingMoreComments((prev) => ({ ...prev, [commentId]: true }));
    try {
      const moreComments = await repository.fetchCommentsRecursive(
        storyId,
        commentId,
        LOADED_COMMENT_LIMIT,
        LOAD_MORE_DEPTH
      );
      setComments((prevComments) =>
        updateCommentsTree(prevComments, commentId, moreComments)
      );
      setThreadDepth(currentDepth + LOAD_MORE_DEPTH);
    } catch (error) {
      console.error("Error loading more comments:", error);
    } finally {
      setLoadingMoreComments((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const viewFullThread = async (commentId: number) => {
    setLoading(true);
    try {
      const fullThread = await repository.fetchFullThread(commentId);

      if (threadView) {
        setThreadHistory((prev) => [...prev, threadView]);
      }

      setThreadView(fullThread);
      setThreadDepth(0);
    } catch (error) {
      console.error("Error fetching full thread:", error);
    } finally {
      setLoading(false);
    }
  };

  const goBackThread = () => {
    if (threadHistory.length > 0) {
      const prevThread = threadHistory[threadHistory.length - 1];
      setThreadView(prevThread);
      setThreadDepth(0);
      setThreadHistory((prev) => prev.slice(0, -1));
    } else {
      backToMainComments();
    }
  };

  const backToMainComments = () => {
    setThreadView(null);
    setThreadDepth(0);
    setThreadHistory([]);
  };

  //basically a depth first search, we start from a parent component and loop through until we
  //find the target comment we need to add the new replies to
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

  const renderComment = useCallback(
    ({ item, depth = 0 }: { item: HNComment; depth?: number }) => {
      const isCollapsed = collapsedComments.has(item.id);

      const hasReplies = item.replies && item.replies.length > 0;

      //If it has replies, count how many, if it doesn't just set it to 0
      const hiddenRepliesCount = hasReplies ? countReplies(item) : 0;

      const hasQualifyingDescendant = (
        comment: HNComment,
        currentDepth: number
      ): boolean => {
        if (
          currentDepth > VIEW_THREAD_DEPTH &&
          comment.kids &&
          comment.kids.length > 0
        ) {
          return true;
        }
        return (
          comment.replies?.some((reply) =>
            hasQualifyingDescendant(reply, currentDepth + 1)
          ) || false
        );
      };

      //Recursively check if at least one of the child depth that qualify for a
      //view thread option. In other words, if the depth is greater than 6, and that comment
      // as kids then it will return true meaning it qualifies for viewthread
      const showViewThread =
        depth > VIEW_THREAD_DEPTH &&
        item.kids &&
        item.kids.length > 0 &&
        !item.replies?.some((reply) =>
          hasQualifyingDescendant(reply, depth + 1)
        );

      //therefore, if showviewthread is true, we negate it to false and cancel the showLoadMore
      //meaning we do not want to show load more if showviewthread is true/being shown
      const showLoadMore =
        depth % LOAD_MORE_DEPTH === LOAD_MORE_DEPTH - 1 &&
        item.kids &&
        item.kids.length > item.replies!.length &&
        !showViewThread;

      return (
        <View
          style={[styles.commentContainer, { marginLeft: (depth % 3) * 20 }]}
        >
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
              title="Load more replies"
              onPress={() => loadMoreComments(item.id, depth)}
            />
          )}
          {showViewThread && (
            <Button
              title="View Thread"
              onPress={() => viewFullThread(item.id)}
            />
          )}
        </View>
      );
    },
    [collapsedComments, width, toggleCollapse, loadMoreComments, viewFullThread]
  );

  const renderThreadView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.threadNavigation}>
        {threadHistory.length > 0 && (
          <Button title="Back" onPress={goBackThread} />
        )}
        <Button title="Back to Main Comments" onPress={backToMainComments} />
      </View>
      <FlatList
        data={[threadView!]}
        renderItem={({ item }) => renderComment({ item, depth: 0 })}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
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
      <TouchableOpacity style={styles.floatingButton} onPress={toggleDrawer}>
        <Ionicons name="chatbubble-outline" size={24} color="white" />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: drawerAnimation }],
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <TouchableOpacity onPress={toggleDrawer}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.commentsTitle}>
            {threadView ? `Thread: ${threadView.by}` : "Comments"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : threadView ? (
            renderThreadView()
          ) : (
            <FlatList
              data={comments}
              renderItem={({ item }) => renderComment({ item })}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </View>
      </Animated.View>
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
  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#007AFF",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "80%",
    padding: 20,
    backgroundColor: "white",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "JosefinSans_400Regular",
    marginLeft: 20,
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
  threadNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});

export default ArticleScreen;
