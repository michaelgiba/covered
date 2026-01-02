"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ScrollingTextProps {
    text: string;
    className?: string;
}

export const ScrollingText = ({ text, className = "" }: ScrollingTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);
    const [scrollDistance, setScrollDistance] = useState(0);

    useEffect(() => {
        if (containerRef.current && textRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const textWidth = textRef.current.offsetWidth;

            if (textWidth > containerWidth) {
                setShouldScroll(true);
                setScrollDistance(textWidth - containerWidth + 20); // +20 for some padding/breathing room
            } else {
                setShouldScroll(false);
                setScrollDistance(0);
            }
        }
    }, [text]);

    return (
        <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`} style={{ maskImage: shouldScroll ? 'linear-gradient(to right, transparent, black 10px, black 90%, transparent)' : 'none' }}>
            <motion.div
                ref={textRef}
                className="inline-block"
                animate={shouldScroll ? {
                    x: [0, -scrollDistance, 0],
                } : { x: 0 }}
                transition={shouldScroll ? {
                    duration: scrollDistance * 0.05, // Adjust speed based on distance
                    repeat: Infinity,
                    repeatType: "reverse", // Scroll back and forth
                    repeatDelay: 2,
                    ease: "linear"
                } : {}}
            >
                {text}
            </motion.div>
        </div>
    );
};
