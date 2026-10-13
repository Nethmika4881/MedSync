"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LottieLoaderProps {
  /** Width/height of the animation in pixels. Defaults to 80. */
  size?: number;
  /** Optional extra className on the wrapper div. */
  className?: string;
}

/**
 * Reusable Lottie loading animation using the shared loading.lottie file.
 */
export function LottieLoader({ size = 80, className }: LottieLoaderProps) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    >
      <DotLottieReact
        src="/loading.lottie"
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
