import React from "react";
import { View, Text, Button, Linking, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../index";

type Props = NativeStackScreenProps<RootStackParamList, "Article">;

const ArticleScreen: React.FC<Props> = ({ route }) => {
  const { url } = route.params;

  const openInBrowser = () => {
    Linking.openURL(url);
  };

  if (Platform.OS === "web") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Text>Open this sh1t in a new tab my G</Text>
        <Button title="Open in New Tab" onPress={openInBrowser} />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: url }}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        if (nativeEvent.description.includes("X-Frame-Options")) {
          openInBrowser();
        }
      }}
    />
  );
};

export default ArticleScreen;
