import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogBox } from "react-native";
import { HomeScreen } from "./src/screens/HomeScreen";
import { TamaguiProvider } from "@speed-code/shared";
import { AudioProvider } from "./src/context/AudioContext";

LogBox.ignoreLogs(["Expo AV has been deprecated"]);

const queryClient = new QueryClient();

import { NavigationProvider, useNavigation } from "./src/context/NavigationContext";
import { TopicPlaybackScreen } from "./src/screens/TopicPlaybackScreen";

const AppContent = () => {
  const { currentScreen } = useNavigation();

  return (
    <>
      {currentScreen === "Home" ? <HomeScreen /> : <TopicPlaybackScreen />}
      <StatusBar style="auto" />
    </>
  );
};

export default function App() {
  return (
    <TamaguiProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <NavigationProvider>
          <AudioProvider>
            <AppContent />
          </AudioProvider>
        </NavigationProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
