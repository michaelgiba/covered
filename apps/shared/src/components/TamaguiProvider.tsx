import React from "react";
import {
  TamaguiProvider as BaseTamaguiProvider,
  TamaguiProviderProps,
} from "tamagui";
import config from "../../tamagui.config";

export function TamaguiProvider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, "config">) {
  return (
    <BaseTamaguiProvider config={config} {...rest}>
      {children}
    </BaseTamaguiProvider>
  );
}
