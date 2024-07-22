// src/components/FooterComponent.tsx

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

interface FooterComponentProps {
  loading: boolean;
}

const FooterComponent: React.FC<FooterComponentProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 10,
  },
});

export default FooterComponent;
