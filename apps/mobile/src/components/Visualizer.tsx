import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Volume2, VolumeX } from "@tamagui/lucide-icons";
import { YStack, XStack, styled, useTheme } from "tamagui";

interface VisualizerProps {
  isPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  analyser: AnalyserNode | null;
}

const VisualizerContainer = styled(YStack, {
  position: "relative",
  pressStyle: { opacity: 0.8 },
  width: 400,
  height: 200,
  maxWidth: "100%",
  alignItems: "center",
  justifyContent: "center",
});

const BarsContainer = styled(XStack, {
  gap: 5,
  alignItems: "center",
  height: "100%",
});

const Bar = styled(YStack, {
  borderRadius: "$full",
  backgroundColor: "$purple",
});

const IconWrapper = styled(YStack, {
  backgroundColor: "white",
  padding: "$3",
  borderRadius: "$full",
  position: "absolute",
});

// Simple bar visualizer for React Native using basic Animated API
export const Visualizer = ({
  isPlaying,
  isMuted,
  onToggleMute,
  analyser,
}: VisualizerProps) => {
  const barCount = 5;
  const barHeights = useRef<Animated.Value[]>([]);
  const theme = useTheme();

  // Initialize animated values
  if (barHeights.current.length === 0) {
    for (let i = 0; i < barCount; i++) {
      barHeights.current.push(new Animated.Value(20));
    }
  }

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    if (isPlaying) {
      // Create looping animations for each bar
      barHeights.current.forEach((height, i) => {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(height, {
              toValue: 50 + Math.random() * 100,
              duration: 500 + i * 100,
              useNativeDriver: false,
            }),
            Animated.timing(height, {
              toValue: 20 + Math.random() * 30,
              duration: 500 + i * 100,
              useNativeDriver: false,
            }),
          ]),
        );
        animations.push(animation);
        animation.start();
      });
    } else {
      // Reset to idle state
      barHeights.current.forEach((height) => {
        Animated.timing(height, {
          toValue: 20,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isPlaying]);

  return (
    <VisualizerContainer onPress={onToggleMute}>
      <BarsContainer>
        {barHeights.current.map((height, i) => (
          <Animated.View
            key={i}
            style={{
              width: 60,
              height: height,
              borderRadius: 30,
              backgroundColor: isMuted ? theme.stone200.get() : theme.purple.get(),
            }}
          />
        ))}
      </BarsContainer>

      <IconWrapper>
        {isMuted ? (
          <VolumeX size={24} color="$stone900" />
        ) : (
          <Volume2 size={24} color="$stone900" />
        )}
      </IconWrapper>
    </VisualizerContainer>
  );
};
