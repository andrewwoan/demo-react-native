import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../index";

type Props = NativeStackScreenProps<RootStackParamList, "Article">;

const ArticleScreen: React.FC<Props> = ({ route }) => {
  const { url } = route.params;

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <iframe src={url} style={styles.iframe} title="Article Content" />
      ) : (
        <WebView source={{ uri: url }} style={styles.webview} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iframe: {
    width: "100%",
    height: "100%",
  },
  webview: {
    flex: 1,
  },
});

export default ArticleScreen;
