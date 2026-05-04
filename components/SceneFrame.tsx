"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

interface SceneFrameProps {
  imageSrc: string;
  alt: string;
  aspectRatio: number;
  children: ReactNode;
}

interface FrameRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function SceneFrame({ imageSrc, alt, aspectRatio, children }: SceneFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<FrameRect | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    function updateFrame() {
      if (!container) {
        return;
      }

      const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
      if (containerWidth <= 0 || containerHeight <= 0) {
        return;
      }

      const containerRatio = containerWidth / containerHeight;
      if (containerRatio > aspectRatio) {
        const height = containerHeight;
        const width = height * aspectRatio;
        setFrame({ left: (containerWidth - width) / 2, top: 0, width, height });
      } else {
        const width = containerWidth;
        const height = width / aspectRatio;
        setFrame({ left: 0, top: (containerHeight - height) / 2, width, height });
      }
    }

    updateFrame();
    const resizeObserver = new ResizeObserver(updateFrame);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [aspectRatio]);

  const frameStyle: CSSProperties = frame
    ? {
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
      }
    : {
        inset: 0,
      };

  return (
    <div ref={containerRef} className="absolute inset-0 bg-black">
      <div className="absolute overflow-hidden" style={frameStyle}>
        <img src={imageSrc} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-95" />
        {children}
      </div>
    </div>
  );
}
