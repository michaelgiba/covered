import { config } from "@tamagui/config/v2";
import { createTamagui } from "tamagui";

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background: "#F5F5F7",
      backgroundHover: "#FFFFFF",
      backgroundPress: "#E5E5E7",
      backgroundFocus: "#FFFFFF",
      borderColor: "#E7E5E4",
      borderColorHover: "#D6D3D1",
      color: "#1C1917",
      colorHover: "#292524",
      colorPress: "#44403C",
      colorFocus: "#1C1917",
      placeholderColor: "#A8A29E",
      // Custom design tokens
      purple: "#8B5CF6",
      purpleLight: "#DDD6FE",
      purpleDark: "#7C3AED",
      orange: "#F97316",
      orangeLight: "#FED7AA",
      orangeDark: "#EA580C",
      stone50: "#FAFAF9",
      stone100: "#F5F5F4",
      stone200: "#E7E5E4",
      stone300: "#D6D3D1",
      stone400: "#A8A29E",
      stone500: "#78716C",
      stone600: "#57534E",
      stone700: "#44403C",
      stone800: "#292524",
      stone900: "#1C1917",
    },
    dark: {
      ...config.themes.dark,
      // Dark theme can be customized later if needed
    },
  },
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      purple: "#8B5CF6",
      purpleLight: "#DDD6FE",
      purpleDark: "#7C3AED",
      orange: "#F97316",
      orangeLight: "#FED7AA",
      orangeDark: "#EA580C",
      stone50: "#FAFAF9",
      stone100: "#F5F5F4",
      stone200: "#E7E5E4",
      stone300: "#D6D3D1",
      stone400: "#A8A29E",
      stone500: "#78716C",
      stone600: "#57534E",
      stone700: "#44403C",
      stone800: "#292524",
      stone900: "#1C1917",
    },
    radius: {
      ...config.tokens.radius,
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 24,
      6: 32,
      true: 8,
    },
  },
});

export type AppConfig = typeof appConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
