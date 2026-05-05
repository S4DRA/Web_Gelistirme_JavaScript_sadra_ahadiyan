"use client";

import Image from "next/image";
import { type CSSProperties, useRef, useState } from "react";

type InteractiveLogo3DProps = {
  compact?: boolean;
};

type PointerState = {
  active: boolean;
  x: number;
  y: number;
  rotationX: number;
  rotationY: number;
};

type LogoStyle = CSSProperties & {
  "--rx": string;
  "--ry": string;
};

const depthLayers = Array.from({ length: 16 }, (_, index) => index);

export function InteractiveLogo3D({ compact = false }: InteractiveLogo3DProps) {
  const pointerRef = useRef<PointerState>({
    active: false,
    x: 0,
    y: 0,
    rotationX: -10,
    rotationY: 22,
  });
  const [rotation, setRotation] = useState({ x: -10, y: 22 });
  const [dragging, setDragging] = useState(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointerRef.current.active = true;
    pointerRef.current.x = event.clientX;
    pointerRef.current.y = event.clientY;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current;

    if (!pointer.active) {
      return;
    }

    const deltaX = event.clientX - pointer.x;
    const deltaY = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.rotationY += deltaX * 0.38;
    pointer.rotationX -= deltaY * 0.32;
    pointer.rotationX = Math.max(-42, Math.min(42, pointer.rotationX));

    setRotation({
      x: pointer.rotationX,
      y: pointer.rotationY,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointerRef.current.active = false;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const style: LogoStyle = {
    "--rx": `${rotation.x}deg`,
    "--ry": `${rotation.y}deg`,
  };

  return (
    <div
      className={`interactive-logo-shell ${compact ? "is-compact" : ""} ${
        dragging ? "is-dragging" : ""
      }`}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="img"
      aria-label="Interactive Dampener logo"
    >
      <div className="interactive-logo-stage">
        <div className="interactive-logo-object">
          {depthLayers.map((layer) => (
            <Image
              key={layer}
              src="/img/3D.svg"
              alt=""
              width={2000}
              height={2000}
              draggable={false}
              className="interactive-logo-layer"
              style={{
                transform: `translateZ(${-layer * 0.12}rem) translateX(${
                  layer * 0.012
                }rem)`,
                opacity: layer === 0 ? 1 : 0.9 - layer * 0.032,
              }}
            />
          ))}
          <Image
            src="/img/3D.svg"
            alt=""
            width={2000}
            height={2000}
            priority={!compact}
            draggable={false}
            className="interactive-logo-face"
          />
        </div>
      </div>
    </div>
  );
}
