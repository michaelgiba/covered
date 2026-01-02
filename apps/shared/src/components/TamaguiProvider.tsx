import React from "react";
import {
  TamaguiProvider as BaseTamaguiProvider,
  TamaguiProviderProps,
  PortalProvider,
} from "tamagui";
import config from "../../tamagui.config";

export function TamaguiProvider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, "config">) {
  return (
    <BaseTamaguiProvider config={config} {...rest}>
      <PortalProvider>{children}</PortalProvider>
    </BaseTamaguiProvider>
  );
}
