import React, { createContext, useContext, useState, ReactNode } from "react";

type Screen = "Home" | "Player";

interface NavigationContextType {
    currentScreen: Screen;
    navigateTo: (screen: Screen) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const [currentScreen, setCurrentScreen] = useState<Screen>("Home");

    const navigateTo = (screen: Screen) => {
        setCurrentScreen(screen);
    };

    return (
        <NavigationContext.Provider value={{ currentScreen, navigateTo }}>
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
