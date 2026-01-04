import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { AudioPlayer, useAudioSampleListener } from "expo-audio";
import { calculateMagnitudes } from "../utils/audioUtils";

interface MiniVisualizerProps {
    isPlaying: boolean;
    isMuted: boolean;
    player: AudioPlayer | null;
    size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const MiniVisualizer = ({
    isPlaying,
    isMuted,
    player,
    size = 64,
}: MiniVisualizerProps) => {
    // Animated value ranges from 0 to 1
    const animatedValue = useRef(new Animated.Value(0)).current;
    const prevValue = useRef(0);
    const targetValue = useRef(0);
    const timeRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    // Animation Loop
    useEffect(() => {
        const animate = () => {
            timeRef.current += 0.05;

            let target = 0;

            if (isPlaying) {
                target = targetValue.current;
            } else {
                // Idle animation: gentle pulsing
                target = 20 + Math.sin(timeRef.current) * 10;
            }

            // Smoothing - gentler motion
            const isAttack = target > prevValue.current;
            const smoothingFactor = isAttack ? 1.0 : 0.08;

            const smoothedValue =
                prevValue.current + (target - prevValue.current) * smoothingFactor;
            prevValue.current = smoothedValue;

            // Normalize and Boost - reduced for gentler motion
            let normalized = smoothedValue / 512;
            normalized = Math.pow(normalized, 2);
            const boosted = Math.min(1, normalized * 8.5);

            animatedValue.setValue(boosted);

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying]);

    // Audio Data Listener
    useAudioSampleListener(player!, (sample) => {
        if (!isPlaying) return;

        const frames = sample.channels[0].frames;
        const windowSize = 1024;

        let input = frames;
        if (frames.length > windowSize) {
            input = frames.slice(0, windowSize);
        } else if (frames.length < windowSize) {
            input = [...frames, ...new Array(windowSize - frames.length).fill(0)];
        }

        // Just get the average of the first few bins for a simple overall magnitude
        const magnitudes = calculateMagnitudes(input, [0, 0.5, 1, 1.5, 2]);
        const avg = magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;
        targetValue.current = avg;
    });

    // Smaller radius range
    const minRadius = size * 0.22;
    const maxRadius = size * 0.32;
    const center = size / 2;

    // Interpolate radius
    const radius = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [minRadius, maxRadius],
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <LinearGradient id="miniGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#a855f7" stopOpacity="1" />
                        <Stop offset="1" stopColor="#f97316" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill={isMuted ? "#e7e5e4" : "url(#miniGrad)"}
                    // @ts-ignore
                    collapsable={undefined}
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
});
