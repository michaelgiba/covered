import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { styled, View, Text as TamaguiText } from "tamagui";

interface ScrollingTextProps {
  text: string;
  className?: string;
}

const Container = styled(View, {
  overflow: "hidden",
  flexDirection: "row",
});

export const ScrollingText = ({ text, className }: ScrollingTextProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const shouldScroll = text.length > 30; // Simple heuristic

  useEffect(() => {
    if (shouldScroll) {
      const estimatedWidth = text.length * 8;
      const animation = Animated.sequence([
        Animated.delay(2000),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: -estimatedWidth,
              duration: estimatedWidth * 50,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: estimatedWidth * 50,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]);
      animation.start();
      return () => animation.stop();
    }
  }, [text, shouldScroll, translateX]);

  return (
    <Container className={className}>
      <Animated.Text style={{ transform: [{ translateX }] }} numberOfLines={1}>
        {text}
      </Animated.Text>
    </Container>
  );
};
