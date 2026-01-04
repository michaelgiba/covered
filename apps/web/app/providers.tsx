"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider } from "@speed-code/shared";
import { useState } from "react";
import { AudioProvider } from "@/contexts/AudioContext";
import { PlaybackManagerProvider } from "@/contexts/PlaybackManagerContext";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <TamaguiProvider>
            <QueryClientProvider client={queryClient}>
                <AudioProvider>
                    <PlaybackManagerProvider>
                        {children}
                    </PlaybackManagerProvider>
                </AudioProvider>
            </QueryClientProvider>
        </TamaguiProvider>
    );
}
