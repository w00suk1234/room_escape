"use client";

import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

export interface InteractiveHotspot<TId extends string = string> {
  id: TId;
  label: string;
  x: number;
  y: number;
  disabled?: boolean;
  hiddenUntil?: boolean;
  zIndex?: number;
  type?: string;
}

interface InteractiveImageSceneProps<TId extends string> {
  src: string;
  alt: string;
  hotspots: InteractiveHotspot<TId>[];
  onHotspotClick: (id: TId) => void;
  completedIds?: string[];
  debugLabels?: boolean;
  debugHotspots?: boolean;
  showLabels?: boolean;
  children?: ReactNode;
}

interface ImageFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

const fallbackFrame: ImageFrame = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
};

export function InteractiveImageScene<TId extends string>({
  src,
  alt,
  hotspots,
  onHotspotClick,
  completedIds = [],
  debugLabels = false,
  debugHotspots = false,
  showLabels = false,
  children,
}: InteractiveImageSceneProps<TId>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [frame, setFrame] = useState<ImageFrame>(fallbackFrame);
  const [isReady, setIsReady] = useState(false);
  const showDebug = debugLabels || debugHotspots;
  const labelsVisible = showLabels || showDebug;

  const updateFrame = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
    if (containerWidth <= 0 || containerHeight <= 0) {
      return;
    }

    const imageRatio = image.naturalWidth / image.naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    if (containerRatio > imageRatio) {
      const height = containerHeight;
      const width = height * imageRatio;
      setFrame({
        left: (containerWidth - width) / 2,
        top: 0,
        width,
        height,
      });
    } else {
      const width = containerWidth;
      const height = width / imageRatio;
      setFrame({
        left: 0,
        top: (containerHeight - height) / 2,
        width,
        height,
      });
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    updateFrame();

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(updateFrame);
    resizeObserver.observe(container);
    window.addEventListener("resize", updateFrame);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFrame);
    };
  }, [updateFrame, src]);

  function handleDebugClick(event: MouseEvent<HTMLDivElement>) {
    if (!showDebug || frame.width <= 0 || frame.height <= 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left - frame.left) / frame.width) * 100;
    const y = ((event.clientY - rect.top - frame.top) / frame.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      return;
    }

    console.log("clicked image percent:", {
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    });
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black" onClick={handleDebugClick}>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain opacity-95"
        onLoad={updateFrame}
      />

      <div
        className="pointer-events-none absolute overflow-hidden"
        style={{
          left: frame.left,
          top: frame.top,
          width: frame.width,
          height: frame.height,
          opacity: isReady ? 1 : 0,
        }}
      >
        {children}
      </div>

      {hotspots
        .filter((hotspot) => hotspot.hiddenUntil !== false)
        .map((hotspot) => {
          const completed = completedIds.includes(hotspot.id);
          const left = frame.left + (frame.width * hotspot.x) / 100;
          const top = frame.top + (frame.height * hotspot.y) / 100;

          return (
            <button
              key={hotspot.id}
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 outline-none disabled:cursor-not-allowed"
              style={{ left, top, zIndex: hotspot.zIndex ?? 10, opacity: isReady ? 1 : 0 }}
              onClick={() => onHotspotClick(hotspot.id)}
              aria-label={hotspot.label}
              disabled={hotspot.disabled}
              data-object-id={hotspot.id}
              data-hotspot-type={hotspot.type}
              data-testid={`hotspot-${hotspot.id}`}
            >
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full ${
                  showDebug ? "ring-1 ring-cyanline/40 ring-offset-2 ring-offset-black/40" : ""
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full border transition duration-200 group-hover:scale-125 ${
                    completed
                      ? "border-slate-400 bg-slate-300/20 opacity-50"
                      : hotspot.type === "echo"
                        ? "border-cyan-100 bg-cyan-200/45 shadow-[0_0_24px_rgba(103,232,249,0.5)]"
                        : "border-cyan-200 bg-cyanline/30 shadow-[0_0_18px_rgba(45,212,191,0.42)]"
                  }`}
                />
                <span className="absolute inset-1 rounded-full border border-cyanline/15 opacity-0 transition group-hover:opacity-100" />
              </span>
              <span
                className={`translate-y-1 whitespace-nowrap border border-cyanline/15 bg-black/70 px-2 py-1 text-[11px] font-bold backdrop-blur transition duration-200 group-hover:translate-y-0 group-hover:border-cyanline/40 group-hover:text-cyan-100 group-hover:opacity-100 ${
                  labelsVisible ? "text-cyan-100 opacity-100" : "text-cyan-100/0 opacity-0"
                }`}
              >
                {hotspot.label}
              </span>
            </button>
          );
        })}
    </div>
  );
}
