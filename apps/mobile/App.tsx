import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogBox } from "react-native";
import { HomeScreen } from "./src/screens/HomeScreen";
import { TamaguiProvider } from "@speed-code/shared";
import { AudioProvider } from "./src/context/AudioContext";

LogBox.ignoreLogs(["Expo AV has been deprecated"]);

const queryClient = new QueryClient();

export default function App() {
  return (
    <TamaguiProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AudioProvider>
          <HomeScreen />
          <StatusBar style="auto" />
        </AudioProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
