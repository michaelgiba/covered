import React, { useEffect, useRef } from "react";
import { styled, View, Text as TamaguiText } from "tamagui";

interface ScrollingTextProps {
  text: string;
  className?: string;
}

const Container = styled(View, {
  overflow: "hidden",
  flexDirection: "row",
  maxWidth: "100%",
});

const TextElement = styled(TamaguiText, {
  whiteSpace: "nowrap",
  color: "$stone900",
});

export const ScrollingText = ({ text, className }: ScrollingTextProps) => {
  return (
    <Container className={className}>
      <TextElement>{text}</TextElement>
    </Container>
  );
};
