"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider } from "@speed-code/shared";
import { useState } from "react";
import { AudioProvider } from "@/context/AudioContext";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <TamaguiProvider>
            <QueryClientProvider client={queryClient}>
                <AudioProvider>
                    {children}
                </AudioProvider>
            </QueryClientProvider>
        </TamaguiProvider>
    );
}
