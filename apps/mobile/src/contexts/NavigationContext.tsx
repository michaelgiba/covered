import React, { createContext, useContext, useState, ReactNode } from "react";

type Screen = "Home" | "Player" | "TopicDetail";

interface NavigationContextType {
    currentScreen: Screen;
    screenParams: any;
    navigateTo: (screen: Screen, params?: any) => void;
    goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const [history, setHistory] = useState<{ screen: Screen; params: any }[]>([{ screen: "Home", params: undefined }]);

    const currentRoute = history[history.length - 1];
    const currentScreen = currentRoute.screen;
    const screenParams = currentRoute.params;

    const navigateTo = (screen: Screen, params?: any) => {
        setHistory(prev => [...prev, { screen, params }]);
    };

    const goBack = () => {
        setHistory(prev => {
            if (prev.length <= 1) return prev;
            return prev.slice(0, -1);
        });
    };

    return (
        <NavigationContext.Provider value={{ currentScreen, screenParams, navigateTo, goBack }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error("useNavigation must be used within a NavigationProvider");
    }
    return context;
};
