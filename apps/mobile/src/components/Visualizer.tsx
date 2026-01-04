import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { Volume2, VolumeX } from "@tamagui/lucide-icons";
import { YStack, styled, useTheme } from "tamagui";
import { AudioPlayer, useAudioSampleListener } from "expo-audio";
import { calculateFFT } from "../utils/audioUtils";

interface VisualizerProps {
  isPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  player: AudioPlayer | null;
}

const VisualizerContainer = styled(YStack, {
  position: "relative",
  pressStyle: { opacity: 0.8 },
  width: "100%",
  maxWidth: 400,
  aspectRatio: 2, // 400/200 = 2
  alignItems: "center",
  justifyContent: "center",
});

const IconWrapper = styled(YStack, {
  backgroundColor: "white",
  padding: "$3",
  borderRadius: "$full",
  position: "absolute",
});

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const Visualizer = ({
  isPlaying,
  isMuted,
  onToggleMute,
  player,
}: VisualizerProps) => {
  const theme = useTheme();
  const barCount = 5;
  // Animated values range from 0 to 1
  const animatedValues = useRef(
    Array(barCount)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  // Use real audio data if available
  useAudioSampleListener(player!, (sample) => {
    if (!isPlaying || isMuted) return;

    // sample.channels[0].frames is an array of numbers between -1 and 1
    const frames = sample.channels[0].frames;
    const chunkSize = Math.floor(frames.length / barCount);

    animatedValues.forEach((anim, i) => {
      // Calculate RMS for this chunk
      let sum = 0;
      for (let j = 0; j < chunkSize; j++) {
        const val = frames[i * chunkSize + j] || 0;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / chunkSize);

      // Boost the signal a bit and clamp
      const targetValue = Math.min(Math.max(rms * 5, 0.1), 1);

      Animated.timing(anim, {
        toValue: targetValue,
        duration: 20, // Fast update for responsiveness
        useNativeDriver: false,
      }).start();
    });
  });


  // Dimensions matching web logic
  // viewBox 0 0 400 200
  const totalWidth = 400;
  const totalHeight = 200;
  const spacing = 5;
  const barWidth = (totalWidth - spacing * (barCount - 1)) / barCount; // ~76

  return (
    <VisualizerContainer onPress={onToggleMute}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${totalWidth} ${totalHeight}`}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.purple10?.get() || "#a855f7"} stopOpacity="1" />
            <Stop offset="1" stopColor={theme.orange10?.get() || "#f97316"} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {animatedValues.map((anim, i) => {
          const x = i * (barWidth + spacing);

          // Interpolate height and y to keep centered
          const height = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [barWidth, totalHeight], // Min height is width (circle), max is full height
          });

          const y = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [(totalHeight - barWidth) / 2, 0],
          });

          return (
            <AnimatedRect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              rx={barWidth / 2}
              fill={isMuted ? (theme.stone4?.get() || "#e7e5e4") : "url(#grad)"}
            />
          );
        })}
      </Svg>

      {isMuted && (
        <IconWrapper>
          <VolumeX size={24} color="$stone900" />
        </IconWrapper>
      )}
    </VisualizerContainer>
  );
};
