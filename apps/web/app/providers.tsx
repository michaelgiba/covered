"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider } from "@speed-code/shared";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <TamaguiProvider>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </TamaguiProvider>
    );
}
