import React from "react";
import { WebView } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../index";

type Props = NativeStackScreenProps<RootStackParamList, "Article">;

const ArticleScreen: React.FC<Props> = ({ route }) => {
  const { url } = route.params;

  return (
    <>
      <WebView source={{ uri: url }} />
    </>
  );
};

export default ArticleScreen;
