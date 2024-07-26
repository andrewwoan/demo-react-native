// src/Index.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecoilRoot } from "recoil";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import FeedScreen from "./screens/FeedScreen";
import ArticleScreen from "./screens/ArticleScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { RootStackParamList } from "./model/types";
import Toast from "react-native-toast-message";

const Tab = createBottomTabNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const FeedStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Feed" component={FeedScreen} />
    <Stack.Screen name="Article" component={ArticleScreen} />
  </Stack.Navigator>
);

export default function Index() {
  return (
    <RecoilRoot>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Feed") {
              iconName = focused ? "list" : "list-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            } else {
              iconName = "alert-circle"; // Default icon
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Feed"
          component={FeedStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <Toast />
    </RecoilRoot>
  );
}
