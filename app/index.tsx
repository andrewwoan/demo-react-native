import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecoilRoot } from "recoil";
import FeedScreen from "./screens/FeedScreen";
import ArticleScreen from "./screens/ArticleScreen";
import { RootStackParamList } from "./model/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Index() {
  return (
    <RecoilRoot>
      <Stack.Navigator>
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen name="Article" component={ArticleScreen} />
      </Stack.Navigator>
    </RecoilRoot>
  );
}
