import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export const Logo = () => (
  <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="16" fill="#1C1917" />
    <Path
      d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24"
      stroke="#E7E5E4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21"
      stroke="#A8A29E"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Circle cx="16" cy="16" r="2" fill="#F5F5F4" />
  </Svg>
);
