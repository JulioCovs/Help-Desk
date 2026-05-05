import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AUTH_TOKEN_KEY } from "@/constants/authStorage";
import Colors from "@/constants/colors";

/**
 * Punto de entrada: exige JWT guardado; si no, va a login (donde se obtiene contra el api-server).
 */
export default function EntryRedirect() {
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(AUTH_TOKEN_KEY).then((t) => {
      setHasToken(Boolean(t?.trim()));
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator color={Colors.light.tint} size="large" />
      </View>
    );
  }

  if (hasToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
