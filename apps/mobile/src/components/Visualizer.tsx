import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { Volume2, VolumeX } from "@tamagui/lucide-icons";
import { YStack, styled, useTheme } from "tamagui";
import { AudioPlayer, useAudioSampleListener } from "expo-audio";
import { calculateMagnitudes } from "../utils/audioUtils";

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

  const prevValues = useRef<number[]>(new Array(barCount).fill(0));
  const targetValues = useRef<number[]>(new Array(barCount).fill(0));
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Idle Animation Loop
  // Animation Loop (Runs for both Idle and Playing states)
  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.05;

      animatedValues.forEach((anim, i) => {
        let targetValue = 0;

        if (isPlaying) {
          // If playing, use the latest audio data
          targetValue = targetValues.current[i];
        } else {
          // Idle animation: symmetric wave from center
          const mid = Math.floor(barCount / 2);
          const dist = Math.abs(i - mid);
          targetValue = 20 + Math.sin(timeRef.current - dist * 0.5) * 10;
        }

        // Smoothing
        const isAttack = targetValue > prevValues.current[i];
        const smoothingFactor = isAttack ? 0.9 : 0.15;

        const smoothedValue =
          prevValues.current[i] +
          (targetValue - prevValues.current[i]) * smoothingFactor;
        prevValues.current[i] = smoothedValue;

        // Normalize and Boost (matching web)
        let normalized = smoothedValue / 512;
        normalized = Math.pow(normalized, 2);
        const boosted = Math.min(1, normalized * 2.5);

        anim.setValue(boosted);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, barCount]);

  // Audio Data Listener
  useAudioSampleListener(player!, (sample) => {
    if (!isPlaying) return;

    // sample.channels[0].frames is an array of numbers between -1 and 1
    const frames = sample.channels[0].frames;

    // Use a subset of frames for FFT to match the frequency resolution/bins we want
    // Web uses 2048 FFT size (default). We want to match the low frequency bins.
    // We'll use a window of 1024 samples (as requested) but scale indices to match Web's 2048 FFT bins.
    const windowSize = 1024;
    const WEB_FFT_SIZE = 2048;

    // Pad with zeros if we don't have enough frames, or just use what we have?
    // calculateMagnitudes uses input.length as N. If we want specific resolution, we should enforce N.
    // But calculateMagnitudes logic `angle = ... / n` depends on N.
    // If we want 21Hz resolution, N must be 2048 (assuming 44.1kHz).
    // So we should pad if needed.
    let input = frames;
    if (frames.length > windowSize) {
      input = frames.slice(0, windowSize);
    } else if (frames.length < windowSize) {
      // Pad with zeros
      input = [...frames, ...new Array(windowSize - frames.length).fill(0)];
    }

    // Calculate magnitudes for specific bins to match Web's "dist * 2" logic
    // Web indices: 0, 2, 4, 3, 5 (sorted: 0, 2, 3, 4, 5)
    // We scale these indices by (windowSize / WEB_FFT_SIZE) to target the same frequencies.
    const scale = windowSize / WEB_FFT_SIZE;
    const indicesToCalculate = [0, 1, 2, 3, 4, 5].map(i => i * scale);
    const magnitudes = calculateMagnitudes(input, indicesToCalculate); // Returns 0-255

    // Update target values for the animation loop to pick up
    for (let i = 0; i < barCount; i++) {
      const mid = Math.floor(barCount / 2);
      const dist = Math.abs(i - mid);

      // Match Web's index logic
      let dataIndex = dist * 2;
      if (i > mid) {
        dataIndex += 1;
      }
      // Clamp to available magnitudes
      dataIndex = Math.min(dataIndex, magnitudes.length - 1);

      targetValues.current[i] = magnitudes[dataIndex] || 0;
    }
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
              // @ts-ignore
              collapsable={undefined}
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
