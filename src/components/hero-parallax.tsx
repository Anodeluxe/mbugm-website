"use client";

import type { PointerEvent, ReactNode } from "react";

function setOffset(element: HTMLElement, x: number, y: number) {
  element.style.setProperty("--hero-far-x", `${x * 18}px`);
  element.style.setProperty("--hero-far-y", `${y * 12}px`);
  element.style.setProperty("--hero-near-x", `${x * 32}px`);
  element.style.setProperty("--hero-near-y", `${y * 20}px`);
}

export function HeroParallax({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    setOffset(
      event.currentTarget,
      ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    );
  };

  const resetOffset = (event: PointerEvent<HTMLElement>) => {
    setOffset(event.currentTarget, 0, 0);
  };

  return (
    <section
      className={className}
      aria-labelledby="hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetOffset}
    >
      {children}
    </section>
  );
}
