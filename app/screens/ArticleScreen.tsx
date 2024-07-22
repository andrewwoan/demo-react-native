import React from "react";
import { View, Text, Button, Linking, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../model/types";

type Props = NativeStackScreenProps<RootStackParamList, "Article">;

const ArticleScreen: React.FC<Props> = ({ route }) => {
  const { url } = route.params;

  return (
    <WebView
      source={{ uri: url }}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        if (nativeEvent.description.includes("X-Frame-Options")) {
          Linking.openURL(url);
        }
      }}
    />
  );
};

export default ArticleScreen;
