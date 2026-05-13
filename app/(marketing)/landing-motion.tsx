"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

const cinematicEase = [0.16, 1, 0.3, 1] as const;
const smoothScrollSpring = {
  damping: 58,
  mass: 0.14,
  stiffness: 190,
};
const cinematicStops = [0, 0.22, 0.5, 0.78, 1];

type RevealSectionProps = {
  labelledBy?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 42,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function HeaderScrollState() {
  useEffect(() => {
    const root = document.documentElement;
    let animationFrame = 0;

    function syncHeaderState() {
      root.dataset.landingScrolled = window.scrollY > 140 ? "true" : "false";
    }

    function scheduleHeaderState() {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        syncHeaderState();
      });
    }

    syncHeaderState();
    window.addEventListener("scroll", scheduleHeaderState, { passive: true });

    return () => {
      window.removeEventListener("scroll", scheduleHeaderState);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      delete root.dataset.landingScrolled;
    };
  }, []);

  return null;
}

export function RevealSection({
  labelledBy,
  children,
  className = "",
  id,
}: RevealSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 104%", "end 18%"],
  });
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const sectionY = useTransform(smoothProgress, cinematicStops, [88, 22, 0, -14, -44]);
  const sectionScale = useTransform(smoothProgress, cinematicStops, [0.955, 0.988, 1, 0.996, 0.984]);
  const sectionOpacity = useTransform(smoothProgress, [0, 0.14, 0.84, 1], [0.02, 1, 1, 0.78]);

  return (
    <motion.section
      ref={sectionRef}
      id={id}
      aria-labelledby={labelledBy}
      className={`studio-reveal ${className}`.trim()}
      data-motion-state="visible"
      initial={false}
      animate={prefersReducedMotion ? "visible" : undefined}
      variants={prefersReducedMotion ? sectionVariants : undefined}
      style={
        prefersReducedMotion
          ? undefined
          : {
              opacity: sectionOpacity,
              scale: sectionScale,
              y: sectionY,
            }
      }
    >
      {children}
    </motion.section>
  );
}

export function ScrollProgress() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    damping: 28,
    mass: 0.18,
    stiffness: 120,
  });

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="studio-scroll-progress" aria-hidden="true">
      <motion.span style={{ scaleX }} />
    </div>
  );
}

export function ScrollAtmosphere() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const y = useTransform(smoothProgress, [0, 0.5, 1], ["0%", "-10%", "-22%"]);
  const rotate = useTransform(smoothProgress, [0, 0.5, 1], [-8, 8, 24]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [1.22, 0.82, 1.26]);
  const opacity = useTransform(smoothProgress, [0, 0.2, 0.52, 1], [0.18, 0.1, 0.14, 0.08]);
  const logoY = useTransform(smoothProgress, [0, 0.5, 1], ["8%", "-6%", "-20%"]);
  const logoRotate = useTransform(smoothProgress, [0, 1], [-10, 16]);
  const logoScale = useTransform(smoothProgress, [0, 0.5, 1], [1.08, 0.92, 1.14]);
  const logoOpacity = useTransform(smoothProgress, [0, 0.22, 0.62, 1], [0.035, 0.02, 0.032, 0.018]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="studio-scroll-atmosphere" aria-hidden="true">
      <motion.div className="studio-scroll-orbit studio-scroll-orbit-a" style={{ opacity, rotate, scale, y }} />
      <motion.div className="studio-scroll-orbit studio-scroll-orbit-b" style={{ opacity, rotate, scale, y }} />
      <motion.div
        className="studio-scroll-logo-mark studio-scroll-logo-mark-a"
        style={{ opacity: logoOpacity, rotate: logoRotate, scale: logoScale, y: logoY }}
      />
      <motion.div
        className="studio-scroll-logo-mark studio-scroll-logo-mark-b"
        style={{ opacity: logoOpacity, rotate: logoRotate, scale: logoScale, y: logoY }}
      />
    </div>
  );
}

export function CinematicIntro() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="studio-intro-overlay" aria-hidden="true">
      <div className="studio-intro-panel" />
      <div className="studio-intro-grid" />
      <div className="studio-intro-aperture" />
      <div className="studio-intro-light" />
      <div className="studio-intro-frame studio-intro-frame-top" />
      <div className="studio-intro-frame studio-intro-frame-bottom" />
      <div className="studio-intro-brand">
        <Image src="/img/1.svg" alt="" width={44} height={44} priority />
        <p className="studio-intro-mark">Dampener / Financial clarity system</p>
      </div>
    </div>
  );
}

export function LogoOpeningScene() {
  const sceneRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end 34%"],
  });
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const logoScale = useTransform(smoothProgress, [0, 0.38, 1], [1, 1.22, 0.68]);
  const logoY = useTransform(smoothProgress, [0, 1], [0, -128]);
  const logoOpacity = useTransform(smoothProgress, [0, 0.66, 1], [1, 1, 0]);
  const cueOpacity = useTransform(smoothProgress, [0, 0.26, 0.5], [1, 1, 0]);

  if (prefersReducedMotion) {
    return (
      <section className="studio-logo-opening" aria-label="Dampener opening scene">
        <div className="studio-logo-opening-inner">
          <Image className="studio-opening-logo" src="/img/1.svg" alt="Dampener" width={124} height={124} priority />
          <div className="studio-scroll-cue" aria-hidden="true">
            <span />
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section ref={sceneRef} className="studio-logo-opening" aria-label="Dampener opening scene">
      <div className="studio-logo-opening-inner">
        <motion.div
          className="studio-opening-logo-wrap"
          style={{ opacity: logoOpacity, scale: logoScale, y: logoY }}
        >
          <Image className="studio-opening-logo" src="/img/1.svg" alt="Dampener" width={148} height={148} priority />
        </motion.div>
        <motion.div className="studio-scroll-cue" style={{ opacity: cueOpacity }} aria-hidden="true">
          <span />
        </motion.div>
      </div>
    </motion.section>
  );
}

export function HeroCinematicScene({
  labelledBy,
  children,
  className = "",
}: {
  labelledBy: string;
  children: ReactNode;
  className?: string;
}) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start 82%", "end 10%"],
  });
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const planeY = useTransform(smoothProgress, cinematicStops, [48, 10, 0, -56, -124]);
  const planeScale = useTransform(smoothProgress, cinematicStops, [1.06, 1.02, 1, 0.94, 0.84]);
  const shadeOpacity = useTransform(smoothProgress, cinematicStops, [0, 0.05, 0.18, 0.46, 0.72]);

  if (prefersReducedMotion) {
    return (
      <section ref={sceneRef} className={className} aria-labelledby={labelledBy}>
        {children}
      </section>
    );
  }

  return (
    <motion.section ref={sceneRef} className={className} aria-labelledby={labelledBy}>
      <motion.div className="studio-hero-scroll-plane" style={{ y: planeY, scale: planeScale }}>
        {children}
      </motion.div>
      <motion.div className="studio-hero-scroll-vignette" style={{ opacity: shadeOpacity }} aria-hidden="true" />
    </motion.section>
  );
}

export function HeroTitle({ id, text }: { id: string; text: string }) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");

  return (
    <h1 id={id} className="studio-hero-title" aria-label={text}>
      {words.map((word, index) => (
        <span className="studio-word-mask" aria-hidden="true" key={`${word}-${index}`}>
          <motion.span
            initial={prefersReducedMotion ? false : { y: "38%", opacity: 0.01 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ delay: 0.52 + index * 0.044, duration: 0.56, ease: cinematicEase }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export function HeroProductStage({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="studio-hero-product-stage"
      initial={prefersReducedMotion ? false : { filter: "blur(12px)", opacity: 0.01, rotateX: 5, scale: 0.96, y: 42 }}
      animate={{ filter: "blur(0px)", opacity: 1, rotateX: 0, scale: 1, y: 0 }}
      transition={{ delay: 0.72, duration: 0.74, ease: cinematicEase }}
    >
      {children}
    </motion.div>
  );
}

export function SectionWipe({ label, number }: { label: string; number: string }) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start 104%", "end 18%"],
  });
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const panelY = useTransform(smoothProgress, cinematicStops, ["58%", "16%", "0%", "-16%", "-58%"]);
  const panelScale = useTransform(smoothProgress, cinematicStops, [0.62, 0.94, 1.24, 0.94, 0.62]);
  const panelOpacity = useTransform(smoothProgress, cinematicStops, [0, 0.86, 1, 0.86, 0]);
  const numberY = useTransform(smoothProgress, cinematicStops, ["26%", "10%", "0%", "-10%", "-26%"]);
  const labelY = useTransform(smoothProgress, cinematicStops, ["38%", "14%", "0%", "-14%", "-38%"]);
  const railScale = useTransform(smoothProgress, cinematicStops, [0, 0.62, 1, 0.62, 0]);
  const apertureScale = useTransform(smoothProgress, cinematicStops, [1.82, 1.18, 0.42, 1.18, 1.82]);
  const apertureRotate = useTransform(smoothProgress, cinematicStops, [-24, -10, 0, 10, 24]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <section ref={sceneRef} className="studio-transition-scene" aria-hidden="true">
      <div className="studio-transition-sticky">
        <motion.div
          className="studio-transition-panel"
          style={{ opacity: panelOpacity, scale: panelScale, y: panelY }}
        >
          <motion.i
            className="studio-transition-aperture"
            style={{ rotate: apertureRotate, scale: apertureScale }}
          />
          <Image className="studio-transition-logo" src="/img/1.svg" alt="" width={54} height={54} />
          <motion.span style={{ y: numberY }}>{number}</motion.span>
          <motion.strong style={{ y: labelY }}>{label}</motion.strong>
          <div className="studio-transition-rail">
            <motion.b style={{ scaleX: railScale }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function StickyProductStory() {
  const sceneRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start 88%", "end 12%"],
  });
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const sceneScale = useTransform(smoothProgress, cinematicStops, [0.86, 1.02, 1.14, 1.02, 0.9]);
  const sceneY = useTransform(smoothProgress, cinematicStops, [62, 14, 0, -14, -54]);
  const glowX = useTransform(smoothProgress, [0, 0.5, 1], ["-12%", "0%", "12%"]);
  const chartY = useTransform(smoothProgress, cinematicStops, [58, 14, 0, -14, -58]);
  const importX = useTransform(smoothProgress, cinematicStops, [-94, -18, 0, 34, 82]);
  const insightX = useTransform(smoothProgress, cinematicStops, [94, 26, 0, -34, -82]);
  const invoiceY = useTransform(smoothProgress, cinematicStops, [78, 24, 8, -24, -70]);
  const firstCopyOpacity = useTransform(smoothProgress, [0, 0.1, 0.3, 0.42], [1, 1, 1, 0]);
  const secondCopyOpacity = useTransform(smoothProgress, [0.34, 0.44, 0.6, 0.72], [0, 1, 1, 0]);
  const thirdCopyOpacity = useTransform(smoothProgress, [0.64, 0.74, 1], [0, 1, 1]);

  if (prefersReducedMotion) {
    return (
      <section className="studio-sticky-story studio-sticky-story-reduced" aria-labelledby="guided-story-heading">
        <div className="studio-container studio-sticky-grid">
          <div className="studio-section-heading">
            <p className="studio-kicker">Guided product story</p>
            <h2 id="guided-story-heading">A calm system assembles around the decision.</h2>
            <p>Imports, forecasts, invoices, and insight stay connected without heavy motion.</p>
          </div>
          <div className="studio-story-board">
            <div className="studio-story-card">Import preview</div>
            <div className="studio-story-card">Forecast path</div>
            <div className="studio-story-card">Invoice pressure</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sceneRef} className="studio-sticky-story" aria-labelledby="guided-story-heading">
      <div className="studio-story-sticky">
        <motion.div className="studio-story-glow" style={{ x: glowX }} aria-hidden="true" />
        <div className="studio-container studio-sticky-grid">
          <div className="studio-story-copy">
            <p className="studio-kicker studio-logo-kicker">
              <Image src="/img/1.svg" alt="" width={24} height={24} />
              Guided product story
            </p>
            <h2 id="guided-story-heading">Watch the workspace assemble around the decision.</h2>
            <div className="studio-story-copy-stack">
              <motion.p style={{ opacity: firstCopyOpacity }}>
                First, bank activity becomes a clean review surface before anything is saved.
              </motion.p>
              <motion.p style={{ opacity: secondCopyOpacity }}>
                Then forecasts and invoices move into the same operating picture.
              </motion.p>
              <motion.p style={{ opacity: thirdCopyOpacity }}>
                Finally, Dampener explains the pressure so the next action feels clear.
              </motion.p>
            </div>
          </div>
          <motion.div className="studio-story-board" style={{ scale: sceneScale, y: sceneY }}>
            <motion.div className="studio-story-card studio-story-chart" style={{ y: chartY }}>
              <span>Forecast path</span>
              <div aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </motion.div>
            <motion.div className="studio-story-card studio-story-import" style={{ x: importX }}>
              <span>Import preview</span>
              <strong>42 valid rows</strong>
              <small>3 duplicates held for review</small>
            </motion.div>
            <motion.div className="studio-story-card studio-story-insight" style={{ x: insightX }}>
              <span>Insight</span>
              <strong>Renewals create pressure in 23 days.</strong>
            </motion.div>
            <motion.div className="studio-story-card studio-story-invoice" style={{ y: invoiceY }}>
              <span>Invoice state</span>
              <strong>$8.1K open</strong>
              <small>Timing affects runway</small>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
