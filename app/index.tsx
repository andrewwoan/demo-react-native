import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecoilRoot } from "recoil";
import FeedScreen from "./screens/FeedScreen";
import ArticleScreen from "./screens/ArticleScreen";

export type RootStackParamList = {
  Feed: undefined;
  Article: { url: string };
};

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
