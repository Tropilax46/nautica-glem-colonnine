/**
 * Nautica GLEM — App mobile per diportisti.
 * Flusso:
 *   1. Login / Registrazione
 *   2. Tab Home (lista/mappa colonnine) | Wallet | Profilo
 *   3. Dalla Home: tap colonnina → Dettaglio → Scan QR → Sessione live
 */
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ColonninaDetailScreen from "./src/screens/ColonninaDetailScreen";
import ScanScreen from "./src/screens/ScanScreen";
import SessionScreen from "./src/screens/SessionScreen";
import WalletScreen from "./src/screens/WalletScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

import { useAuthStore } from "./src/services/auth";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Home" component={HomeStack} />
      <Tabs.Screen name="Wallet" component={WalletScreen} />
      <Tabs.Screen name="Profilo" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Colonnine" component={HomeScreen} />
      <Stack.Screen name="Dettaglio" component={ColonninaDetailScreen} />
      <Stack.Screen name="Scan QR" component={ScanScreen} />
      <Stack.Screen name="Sessione" component={SessionScreen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { token, restore } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restore().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer>
      {token ? (
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registrazione" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
