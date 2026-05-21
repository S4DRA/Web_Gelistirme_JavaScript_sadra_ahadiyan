"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { animate, createDrawable, createDraggable, createScope, createTimeline, stagger } from "animejs";
import { motion, type MotionStyle, type MotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

const cinematicEase = [0.16, 1, 0.3, 1] as const;
const smoothScrollSpring = {
  damping: 72,
  mass: 0.2,
  stiffness: 125,
};
const cinematicStops = [0, 0.22, 0.5, 0.78, 1];
const compactLandingQuery = "(max-width: 640px)";

const logoJourneyTimelineStops = [0, 0.025, 0.07, 0.3, 0.365, 0.42, 0.65, 0.715, 0.775, 0.93, 0.965, 1];
const logoJourneyZoomIntensity = [0.72, 0.8, 5.55, 5.85, 0.95, 5.4, 5.7, 0.96, 5.45, 5.75, 0.82, 0.72];
const logoJourneyTimelineRanges = {
  intro: [0, 0.025],
  topTriangleApproach: [0.025, 0.07],
  topTriangleHold: [0.07, 0.3],
  zoomOutFromTop: [0.3, 0.365],
  middleTriangleApproach: [0.365, 0.42],
  middleTriangleHold: [0.42, 0.65],
  zoomOutFromMiddle: [0.65, 0.715],
  bottomTriangleApproach: [0.715, 0.775],
  bottomTriangleHold: [0.775, 0.93],
  finalReturn: [0.925, 0.955],
  finalHold: [0.955, 1],
};
const logoJourneyChapterRanges = {
  topTriangle: [
    [0.07, 0.116],
    [0.116, 0.162],
    [0.162, 0.208],
    [0.208, 0.254],
    [0.254, 0.3],
  ],
  middleTriangle: [
    [0.42, 0.466],
    [0.466, 0.512],
    [0.512, 0.558],
    [0.558, 0.604],
    [0.604, 0.65],
  ],
  bottomTriangle: [
    [0.775, 0.806],
    [0.806, 0.837],
    [0.837, 0.868],
    [0.868, 0.899],
    [0.899, 0.93],
  ],
} satisfies Record<string, readonly LogoJourneyChapterRange[]>;
const cameraSpring = {
  damping: 76,
  mass: 0.36,
  restDelta: 0.0012,
  stiffness: 92,
};

const logoJourneyScenes = [
  {
    id: "topTriangle",
    label: "AI Intelligence",
    kicker: "Top triangle / AI Intelligence",
    title: "AI intelligence for every financial signal.",
    subtitle: "Raw financial data becomes categorized behavior, confidence scores, and clear decisions.",
    role: "First cinematic destination",
    theme: "AI insights, transaction intelligence, smart categorization, financial brain",
    labelClassName: "logo-journey-zone-top",
    clipClassName: "logo-journey-clip-top",
    sceneClassName: "logo-journey-world-top",
    transformOrigin: "48% 35%",
    depthOffset: 0.46,
    accent: "34 211 238",
    chapters: [
      {
        eyebrow: "01 / Classification",
        title: "Every transaction gets a reason.",
        metric: "94%",
        metricLabel: "category confidence",
        description: "Income, transfers, subscriptions, and irregular charges are separated before they hit the dashboard.",
        bullets: ["merchant memory", "recurring pattern detection", "duplicate review queue"],
        visual: "nodes",
      },
      {
        eyebrow: "02 / Behavior",
        title: "The system learns your money rhythm.",
        metric: "18",
        metricLabel: "behavior signals",
        description: "Dampener watches timing, amount changes, and spending pressure so unusual movement appears early.",
        bullets: ["monthly cadence", "spend velocity", "outlier separation"],
        visual: "signals",
      },
      {
        eyebrow: "03 / Explainability",
        title: "Insights arrive with plain language.",
        metric: "3.2s",
        metricLabel: "decision summary",
        description: "Instead of a raw chart, the scene resolves into what changed, why it matters, and what to check next.",
        bullets: ["natural-language summary", "impact estimate", "next action prompt"],
        visual: "summary",
      },
      {
        eyebrow: "04 / Review",
        title: "Risky data waits for approval.",
        metric: "7",
        metricLabel: "items held",
        description: "Suspicious imports, duplicate transactions, and unexpected category changes are staged for review.",
        bullets: ["human-in-the-loop checks", "audit trail", "confidence thresholds"],
        visual: "review",
      },
      {
        eyebrow: "05 / Decision",
        title: "The financial brain hands off clarity.",
        metric: "Live",
        metricLabel: "insight stream",
        description: "The AI layer leaves the triangle with a clean state the control dashboard can act on.",
        bullets: ["approved signals", "clean categories", "ready for planning"],
        visual: "handoff",
      },
    ],
  },
  {
    id: "middleTriangle",
    label: "Financial Control",
    kicker: "Middle triangle / Financial Control",
    title: "Financial control inside one intelligent dashboard.",
    subtitle: "Track income, expenses, cash flow, and behavior without losing the operating picture.",
    role: "Second cinematic destination",
    theme: "dashboard overview, cash flow, spending control, financial clarity",
    labelClassName: "logo-journey-zone-middle",
    clipClassName: "logo-journey-clip-middle",
    sceneClassName: "logo-journey-world-middle",
    transformOrigin: "63% 55%",
    depthOffset: 0.58,
    accent: "20 184 166",
    chapters: [
      {
        eyebrow: "01 / Cash",
        title: "Cash position stays readable.",
        metric: "$18.4K",
        metricLabel: "+12% available",
        description: "Balances, expected income, and committed outflows sit in one calm operating panel.",
        bullets: ["live balance", "cash movement", "available runway"],
        visual: "cash",
      },
      {
        eyebrow: "02 / Invoices",
        title: "Exposure is visible before it bites.",
        metric: "$6.2K",
        metricLabel: "4 invoices open",
        description: "Open invoices and expected collection timing are tied directly to the control surface.",
        bullets: ["due-date pressure", "collection timing", "late risk"],
        visual: "invoice",
      },
      {
        eyebrow: "03 / Budget",
        title: "Budget health updates as money moves.",
        metric: "82%",
        metricLabel: "on track",
        description: "Income, fixed costs, and variable spend are measured against the plan without extra spreadsheet work.",
        bullets: ["category pacing", "spend guardrails", "variance alerts"],
        visual: "budget",
      },
      {
        eyebrow: "04 / Imports",
        title: "Messy records become clean rows.",
        metric: "42",
        metricLabel: "rows normalized",
        description: "Bank imports, manual entries, and corrections land in a review queue before they affect the model.",
        bullets: ["source matching", "duplicate checks", "field cleanup"],
        visual: "import",
      },
      {
        eyebrow: "05 / Command",
        title: "Control becomes a single command surface.",
        metric: "5.8 mo",
        metricLabel: "runway balanced",
        description: "The middle triangle exits with a complete operating view: cash, invoices, budget, and runway together.",
        bullets: ["one dashboard", "clear ownership", "decision-ready state"],
        visual: "control",
      },
    ],
  },
  {
    id: "bottomTriangle",
    label: "Future Prediction",
    kicker: "Bottom triangle / Future Prediction",
    title: "Future risk becomes visible before it arrives.",
    subtitle: "Forecast cash flow, renewal pressure, and financial outcomes before decisions get expensive.",
    role: "Third cinematic destination",
    theme: "predictions, risk warnings, future simulation, anomaly detection",
    labelClassName: "logo-journey-zone-bottom",
    clipClassName: "logo-journey-clip-bottom",
    sceneClassName: "logo-journey-world-bottom",
    transformOrigin: "47% 75%",
    depthOffset: 0.5,
    accent: "34 197 94",
    chapters: [
      {
        eyebrow: "01 / Forecast",
        title: "The next 90 days become visible.",
        metric: "90d",
        metricLabel: "forecast window",
        description: "Cash direction, recurring cost pressure, and expected income are projected as one path.",
        bullets: ["balance curve", "income timing", "expense pressure"],
        visual: "forecast",
      },
      {
        eyebrow: "02 / Pressure",
        title: "Renewals stop arriving as surprises.",
        metric: "23d",
        metricLabel: "renewal pressure",
        description: "Dampener identifies future cost spikes while there is still time to react.",
        bullets: ["renewal scan", "contract timing", "pressure estimate"],
        visual: "renewal",
      },
      {
        eyebrow: "03 / Scenarios",
        title: "Decisions can be simulated first.",
        metric: "+$3.4K",
        metricLabel: "best-case lift",
        description: "The product compares conservative, expected, and upside outcomes before money moves.",
        bullets: ["scenario stack", "cash effect", "decision preview"],
        visual: "scenario",
      },
      {
        eyebrow: "04 / Risk",
        title: "Risk gets scored before it grows.",
        metric: "Low",
        metricLabel: "improving",
        description: "Signals from the first two triangles become a forward-looking risk surface.",
        bullets: ["risk score", "threshold alerts", "trend direction"],
        visual: "risk",
      },
      {
        eyebrow: "05 / Outcome",
        title: "The future resolves into a clear move.",
        metric: "12d",
        metricLabel: "action window",
        description: "The final triangle closes with the next best action, the deadline, and the expected impact.",
        bullets: ["recommended action", "deadline clarity", "impact confidence"],
        visual: "outcome",
      },
    ],
  },
];

const logoVectorViewBox = "830 585 420 745";
const logoVectorTransform = "translate(0 2000) scale(0.1 -0.1)";
const logoVectorPieceOffsets = {
  topTriangle: "translate(-140 180)",
  middleTriangle: "translate(110 0)",
  bottomTriangle: "translate(-140 -180)",
};
const logoVectorPieces = {
  topTriangle:
    "M9005 13926 c-80 -25 -173 -103 -208 -173 -38 -75 -38 -87 -35 -1303 l3 -1185 26 -55 c38 -79 88 -131 162 -169 62 -31 70 -33 154 -29 109 4 89 -5 448 208 77 45 156 91 175 102 19 11 55 32 80 48 25 15 101 60 170 100 69 41 176 104 238 142 62 37 115 68 117 68 2 0 32 17 67 39 35 21 115 69 178 106 707 414 710 416 766 525 25 48 29 66 29 140 0 76 -4 93 -32 150 -17 36 -47 79 -65 96 -37 36 -1997 1158 -2071 1186 -54 21 -143 23 -202 4z",
  middleTriangle:
    "M11604 12337 c-1502 -863 -3026 -1748 -3055 -1774 -52 -47 -83 -123 -76 -189 6 -58 33 -118 69 -151 12 -12 761 -448 1662 -969 1752 -1012 1671 -969 1769 -950 56 11 121 60 153 118 l29 53 3 1895 c2 2081 6 1955 -58 2032 -44 53 -102 78 -182 78 l-65 0 -249 -143z",
  bottomTriangle:
    "M8965 9749 c-97 -33 -157 -87 -208 -184 l-31 -60 -7 -230 c-4 -126 -8 -646 -10 -1155 l-4 -925 28 -59 c43 -93 88 -140 172 -182 95 -47 180 -55 270 -26 57 18 1901 1055 1973 1109 90 68 149 205 139 320 -8 82 -52 175 -109 230 -50 48 -1893 1136 -1973 1165 -68 24 -165 23 -240 -3z",
};

let compactMedia: MediaQueryList | null = null;
const compactSubscribers = new Set<() => void>();

function getCompactMedia() {
  if (typeof window === "undefined") {
    return null;
  }

  compactMedia ??= window.matchMedia(compactLandingQuery);
  return compactMedia;
}

function getCompactLandingSnapshot() {
  return getCompactMedia()?.matches ?? false;
}

function subscribeCompactLanding(callback: () => void) {
  const media = getCompactMedia();

  if (!media) {
    return () => {};
  }

  compactSubscribers.add(callback);

  if (compactSubscribers.size === 1) {
    media.addEventListener("change", notifyCompactLandingSubscribers);
  }

  return () => {
    compactSubscribers.delete(callback);

    if (compactSubscribers.size === 0) {
      media.removeEventListener("change", notifyCompactLandingSubscribers);
    }
  };
}

function notifyCompactLandingSubscribers() {
  compactSubscribers.forEach((callback) => callback());
}

function useCompactLandingMotion() {
  return useSyncExternalStore(subscribeCompactLanding, getCompactLandingSnapshot, () => false);
}

type RevealSectionProps = {
  labelledBy?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
};

type LogoJourneyZone = (typeof logoJourneyScenes)[number];
type LogoJourneyChapter = LogoJourneyZone["chapters"][number];
type LogoJourneyChapterRange = readonly [number, number];
type LogoJourneySceneId = keyof typeof logoJourneyChapterRanges;

type LogoJourneyWorldControls = {
  contentOpacity: MotionValue<number>;
  contentScale: MotionValue<number>;
  contentY: MotionValue<string>;
  headlineOpacity: MotionValue<number>;
  opacity: MotionValue<number>;
  portalOpacity: MotionValue<number>;
  portalScale: MotionValue<number>;
  scale: MotionValue<number>;
  subheadlineOpacity: MotionValue<number>;
  visualOpacity: MotionValue<number>;
  visualScale: MotionValue<number>;
  visualY: MotionValue<string>;
  y: MotionValue<string>;
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

export function LogoJourneyHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, cameraSpring);
  const shouldReduce = prefersReducedMotion;

  const activeLogoJourneyZoomIntensity = isCompact
    ? [0.72, 0.8, 3.7, 3.9, 0.95, 3.6, 3.85, 0.96, 3.65, 3.9, 0.82, 0.72]
    : logoJourneyZoomIntensity;
  const cameraScale = useTransform(progress, logoJourneyTimelineStops, activeLogoJourneyZoomIntensity);
  const cameraOrigin = useTransform(progress, logoJourneyTimelineStops, [
    "50% 50%",
    "50% 50%",
    isCompact ? "50% 36%" : "44% 34%",
    isCompact ? "50% 36%" : "44% 34%",
    "50% 50%",
    isCompact ? "50% 54%" : "60% 52%",
    isCompact ? "50% 54%" : "60% 52%",
    "50% 50%",
    isCompact ? "50% 68%" : "45% 70%",
    isCompact ? "50% 68%" : "45% 70%",
    "50% 50%",
    "50% 50%",
  ]);
  const cameraX = useTransform(progress, logoJourneyTimelineStops, [
    "0vw",
    "0vw",
    isCompact ? "0vw" : "2vw",
    isCompact ? "0vw" : "2vw",
    "0vw",
    isCompact ? "0vw" : "-3.2vw",
    isCompact ? "0vw" : "-3.2vw",
    "0vw",
    isCompact ? "0vw" : "3vw",
    isCompact ? "0vw" : "3vw",
    "0vw",
    "0vw",
  ]);
  const cameraY = useTransform(progress, logoJourneyTimelineStops, [
    "0vh",
    "0vh",
    isCompact ? "18vh" : "25vh",
    isCompact ? "18vh" : "25vh",
    "0vh",
    "1vh",
    "1vh",
    "0vh",
    isCompact ? "-18vh" : "-25vh",
    isCompact ? "-18vh" : "-25vh",
    "0vh",
    "0vh",
  ]);
  const rotateZ = useTransform(
    progress,
    logoJourneyTimelineStops,
    isCompact ? [0, -0.01, -0.018, -0.018, 0, 0.014, 0.014, 0, -0.014, -0.014, 0, 0] : [0, -0.02, -0.045, -0.045, 0, 0.035, 0.035, 0, -0.035, -0.035, 0, 0]
  );
  const sceneFade = useTransform(progress, [0, 0.035, 0.98, 1], [1, 1, 1, 0.96]);
  const guideOpacity = useTransform(progress, [0, 0.06, 0.15, 1], [0.72, 0.72, 0, 0]);
  const baseLogoOpacity = useTransform(progress, logoJourneyTimelineStops, [1, 1, 1, 0.96, 1, 1, 0.96, 1, 1, 0.97, 1, 1]);

  const topWorld = useLogoJourneyWorldControls(
    progress,
    logoJourneyTimelineRanges.topTriangleApproach[0],
    logoJourneyTimelineRanges.topTriangleHold[0],
    logoJourneyTimelineRanges.topTriangleHold[1],
    logoJourneyTimelineRanges.zoomOutFromTop[1]
  );
  const middleWorld = useLogoJourneyWorldControls(
    progress,
    logoJourneyTimelineRanges.middleTriangleApproach[0],
    logoJourneyTimelineRanges.middleTriangleHold[0],
    logoJourneyTimelineRanges.middleTriangleHold[1],
    logoJourneyTimelineRanges.zoomOutFromMiddle[1]
  );
  const bottomWorld = useLogoJourneyWorldControls(
    progress,
    logoJourneyTimelineRanges.bottomTriangleApproach[0],
    logoJourneyTimelineRanges.bottomTriangleHold[0],
    logoJourneyTimelineRanges.bottomTriangleHold[1],
    logoJourneyTimelineRanges.finalReturn[1]
  );
  const worldControls = [topWorld, middleWorld, bottomWorld];
  const finalLogoOpacity = useTransform(
    progress,
    [logoJourneyTimelineRanges.bottomTriangleHold[1], logoJourneyTimelineRanges.finalReturn[1], 1],
    [0, 1, 1]
  );
  const finalLogoY = useTransform(
    progress,
    [logoJourneyTimelineRanges.bottomTriangleHold[1], logoJourneyTimelineRanges.finalReturn[1], 1],
    ["2.4rem", "0rem", "0rem"]
  );
  const finalLogoScale = useTransform(
    progress,
    [logoJourneyTimelineRanges.bottomTriangleHold[1], logoJourneyTimelineRanges.finalReturn[1], 1],
    [0.96, 1, 1]
  );

  if (shouldReduce) {
    return (
          <section ref={sectionRef} className="logo-journey-hero is-reduced" aria-label="Dampener logo journey map">
        <div className="logo-journey-sticky">
          <LogoStack />
          <div className="logo-journey-reduced-worlds">
            {logoJourneyScenes.map((scene) => (
              <LogoJourneyWorld key={scene.id} scene={scene} reducedMotion />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="logo-journey-hero" aria-label="Dampener logo journey map">
      <div className="logo-journey-sticky">
        <SolarSystemBackdrop progress={progress} />
        <motion.div className="logo-journey-scene" style={{ opacity: sceneFade }}>
          <motion.div className="logo-journey-camera-position" style={{ x: cameraX, y: cameraY }}>
            <motion.div
              className="logo-journey-camera"
              style={{ rotateZ, scale: cameraScale, transformOrigin: cameraOrigin }}
            >
              <LogoStack baseOpacity={baseLogoOpacity} />
            </motion.div>
          </motion.div>
        </motion.div>
        {logoJourneyScenes.map((scene, index) => (
          <LogoJourneyWorld controls={worldControls[index]} key={scene.id} progress={progress} scene={scene} />
        ))}
        <LogoJourneyFinale opacity={finalLogoOpacity} scale={finalLogoScale} y={finalLogoY} />
        <motion.div className="logo-journey-scroll-cue" style={{ opacity: guideOpacity }} aria-hidden="true">
          <span />
        </motion.div>
      </div>
    </section>
  );
}

function useLogoJourneyWorldControls(
  progress: MotionValue<number>,
  approachStart: number,
  holdStart: number,
  holdEnd: number,
  exitEnd: number
): LogoJourneyWorldControls {
  const hasExit = exitEnd > holdEnd + 0.001;
  const exit = hasExit ? exitEnd : 1;
  const softHoldEnd = hasExit ? holdEnd : Math.min(holdEnd, 0.995);

  return {
    opacity: useTransform(progress, [approachStart + 0.01, holdStart, softHoldEnd, exit], [0, 0.98, 1, hasExit ? 0 : 1]),
    scale: useTransform(progress, [approachStart, holdStart, softHoldEnd, exit], [0.985, 1.002, 1.012, hasExit ? 0.995 : 1.018]),
    y: useTransform(progress, [approachStart, holdStart, softHoldEnd, exit], ["1.5vh", "0vh", "-0.3vh", hasExit ? "-1.4vh" : "-0.3vh"]),
    portalScale: useTransform(progress, [approachStart, approachStart + 0.06, holdStart, softHoldEnd], [0.58, 0.92, 1.2, 1.42]),
    portalOpacity: useTransform(progress, [approachStart, approachStart + 0.06, holdStart, softHoldEnd, exit], [0, 0.24, 0.5, 0.38, hasExit ? 0 : 0.38]),
    contentOpacity: useTransform(progress, [approachStart + 0.025, holdStart + 0.012, softHoldEnd, exit], [0, 1, 1, hasExit ? 0 : 1]),
    contentScale: useTransform(progress, [approachStart + 0.02, holdStart + 0.03, softHoldEnd, exit], [0.992, 1, 1, hasExit ? 0.996 : 1]),
    contentY: useTransform(progress, [approachStart + 0.02, holdStart + 0.03, softHoldEnd, exit], ["0.8rem", "0rem", "0rem", hasExit ? "-0.55rem" : "0rem"]),
    headlineOpacity: useTransform(progress, [approachStart + 0.03, holdStart + 0.012, softHoldEnd, exit], [0, 1, 1, hasExit ? 0 : 1]),
    subheadlineOpacity: useTransform(progress, [approachStart + 0.042, holdStart + 0.032, softHoldEnd, exit], [0, 1, 1, hasExit ? 0 : 1]),
    visualOpacity: useTransform(progress, [approachStart + 0.015, holdStart + 0.018, softHoldEnd, exit], [0, 0.92, 1, hasExit ? 0 : 1]),
    visualScale: useTransform(progress, [approachStart, holdStart, softHoldEnd, exit], [0.965, 1, 1.012, hasExit ? 0.99 : 1.018]),
    visualY: useTransform(progress, [approachStart, holdStart, softHoldEnd, exit], ["1rem", "0rem", "-0.2rem", hasExit ? "-0.65rem" : "-0.2rem"]),
  };
}

function SolarSystemBackdrop({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, logoJourneyTimelineStops, [0, 0.58, 0.5, 0.46, 0.54, 0.5, 0.46, 0.54, 0.5, 0.46, 0.34, 0.3]);
  const x = useTransform(progress, logoJourneyTimelineStops, [
    "0vw",
    "0vw",
    "0vw",
    "0vw",
    "0vw",
    "0vw",
    "0vw",
    "0vw",
    "0vw",
    "0vw",
    "0vw",
    "0vw",
  ]);
  const y = useTransform(progress, logoJourneyTimelineStops, [
    "0vh",
    "0vh",
    "0vh",
    "0vh",
    "0vh",
    "0vh",
    "0vh",
    "0vh",
    "0vh",
    "0vh",
    "0vh",
    "0vh",
  ]);
  const scale = useTransform(progress, logoJourneyTimelineStops, [0.82, 0.9, 1.18, 1.28, 0.9, 1.16, 1.26, 0.9, 1.14, 1.24, 0.78, 0.74]);
  const aiSignal = useTransform(progress, [0, 1], [0, 360]);
  const cashFlow = useTransform(progress, [0, 1], [70, 430]);
  const forecast = useTransform(progress, [0, 1], [145, 505]);
  const risk = useTransform(progress, [0, 1], [210, 570]);
  const runway = useTransform(progress, [0, 1], [285, 645]);
  const invoices = useTransform(progress, [0, 1], [330, 690]);

  return (
    <motion.div className="logo-journey-solar-system" style={{ opacity, scale, x, y }} aria-hidden="true">
      <svg viewBox="0 0 1000 680" role="img">
        <g className="logo-journey-solar-orbits">
          <ellipse cx="500" cy="340" rx="160" ry="72" />
          <ellipse cx="500" cy="340" rx="270" ry="126" />
          <ellipse cx="500" cy="340" rx="390" ry="184" />
        </g>
        <g className="logo-journey-solar-core">
          <circle cx="500" cy="340" r="34" />
          <svg className="logo-journey-solar-core-logo" x="472" y="312" width="56" height="56" viewBox={logoVectorViewBox}>
            <g transform={logoVectorTransform}>
              <path d={logoVectorPieces.topTriangle} transform={logoVectorPieceOffsets.topTriangle} />
              <path d={logoVectorPieces.middleTriangle} transform={logoVectorPieceOffsets.middleTriangle} />
              <path d={logoVectorPieces.bottomTriangle} transform={logoVectorPieceOffsets.bottomTriangle} />
            </g>
          </svg>
        </g>
        <SolarPlanet angle={aiSignal} label="AI Signal" orbitX={160} orbitY={72} />
        <SolarPlanet angle={cashFlow} label="Cash Flow" orbitX={270} orbitY={126} />
        <SolarPlanet angle={forecast} label="Forecast" orbitX={390} orbitY={184} />
        <SolarPlanet angle={risk} label="Risk" orbitX={390} orbitY={184} />
        <SolarPlanet angle={runway} label="Runway" orbitX={270} orbitY={126} />
        <SolarPlanet angle={invoices} label="Invoices" orbitX={160} orbitY={72} />
        <g className="logo-journey-solar-links">
          <path d="M500 340 C552 292 592 286 628 286" />
          <path d="M500 340 C430 376 364 394 302 394" />
          <path d="M500 340 C586 390 668 418 742 420" />
          <path d="M500 340 C404 296 318 274 238 276" />
          <path d="M500 340 C500 266 500 208 500 156" />
          <path d="M500 340 C500 414 504 468 506 524" />
        </g>
      </svg>
    </motion.div>
  );
}

function SolarPlanet({
  angle,
  label,
  orbitX,
  orbitY,
}: {
  angle: MotionValue<number>;
  label: string;
  orbitX: number;
  orbitY: number;
}) {
  const x = useTransform(angle, (value) => 500 + Math.cos((value * Math.PI) / 180) * orbitX);
  const y = useTransform(angle, (value) => 340 + Math.sin((value * Math.PI) / 180) * orbitY);
  const labelX = useTransform(x, (value) => value + 16);
  const labelY = useTransform(y, (value) => value + 4);

  return (
    <g className="logo-journey-solar-planet">
      <motion.circle cx={x} cy={y} r="7" />
      <motion.text x={labelX} y={labelY}>
        {label}
      </motion.text>
    </g>
  );
}

function LogoStack({
  baseBlur,
  baseOpacity,
}: {
  baseBlur?: MotionValue<string>;
  baseOpacity?: MotionValue<number>;
}) {
  return (
    <div className="logo-journey-logo" aria-label="Dampener logo">
      <motion.svg
        className="logo-journey-base-logo"
        style={{ filter: baseBlur, opacity: baseOpacity } as MotionStyle}
        viewBox={logoVectorViewBox}
        role="img"
      >
        <title>Dampener</title>
        <defs>
          <linearGradient id="logoVectorFill" x1="900" x2="1210" y1="620" y2="1300" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#f8fbff" />
            <stop offset="1" stopColor="#e5f0f6" />
          </linearGradient>
          <linearGradient id="logoVectorStroke" x1="900" x2="1210" y1="620" y2="1300" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#9be7f1" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <g className="logo-journey-vector-lines" transform={logoVectorTransform}>
          <path d={logoVectorPieces.topTriangle} transform={logoVectorPieceOffsets.topTriangle} />
          <path d={logoVectorPieces.middleTriangle} transform={logoVectorPieceOffsets.middleTriangle} />
          <path d={logoVectorPieces.bottomTriangle} transform={logoVectorPieceOffsets.bottomTriangle} />
        </g>
      </motion.svg>
    </div>
  );
}

function LogoJourneyWorld({
  controls,
  progress,
  reducedMotion = false,
  scene,
}: {
  controls?: LogoJourneyWorldControls;
  progress?: MotionValue<number>;
  reducedMotion?: boolean;
  scene: LogoJourneyZone;
}) {
  const sceneStyle = { "--scene-accent": scene.accent } as CSSProperties;

  if (reducedMotion) {
    return (
      <section className={`logo-journey-world ${scene.sceneClassName} is-reduced`} style={sceneStyle}>
        <div className="logo-journey-world-content">
          <p className="logo-journey-world-kicker">{scene.kicker}</p>
          <h2>{scene.title}</h2>
          <p>{scene.subtitle}</p>
          <div className="logo-journey-reduced-chapters">
            {scene.chapters.slice(0, 3).map((chapter) => (
              <article key={chapter.title}>
                <span>{chapter.eyebrow}</span>
                <strong>{chapter.title}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      className={`logo-journey-world ${scene.sceneClassName}`}
      style={{ ...sceneStyle, opacity: controls?.opacity, scale: controls?.scale, y: controls?.y } as MotionStyle & CSSProperties}
    >
      <motion.div
        aria-hidden="true"
        className="logo-journey-portal"
        style={{ opacity: controls?.portalOpacity, scale: controls?.portalScale }}
      />
      <div className="logo-journey-world-particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <motion.div
        aria-hidden="true"
        className={`logo-journey-system-visual logo-journey-system-visual-${scene.id}`}
        style={{ opacity: controls?.visualOpacity, scale: controls?.visualScale, y: controls?.visualY }}
      >
        <LogoJourneySystemVisual scene={scene} />
      </motion.div>
      <motion.div
        className="logo-journey-world-content"
        style={{
          opacity: controls?.contentOpacity,
          scale: controls?.contentScale,
          y: controls?.contentY,
        }}
      >
        <div className="logo-journey-world-copy">
          <p className="logo-journey-world-kicker">{scene.kicker}</p>
          <motion.h2 style={{ opacity: controls?.headlineOpacity }}>{scene.title}</motion.h2>
          <motion.p style={{ opacity: controls?.subheadlineOpacity }}>{scene.subtitle}</motion.p>
        </div>
        {progress ? (
          <LogoJourneyChapterStack
            chapters={scene.chapters}
            progress={progress}
            ranges={logoJourneyChapterRanges[scene.id as LogoJourneySceneId]}
            sceneId={scene.id}
          />
        ) : null}
      </motion.div>
    </motion.section>
  );
}

function LogoJourneyChapterStack({
  chapters,
  progress,
  ranges,
  sceneId,
}: {
  chapters: readonly LogoJourneyChapter[];
  progress: MotionValue<number>;
  ranges: readonly LogoJourneyChapterRange[];
  sceneId: string;
}) {
  return (
    <div className={`logo-journey-chapter-stack logo-journey-chapter-stack-${sceneId}`}>
      {chapters.map((chapter, index) => (
        <LogoJourneyChapterCard
          chapter={chapter}
          index={index}
          key={chapter.title}
          progress={progress}
          range={ranges[index]}
        />
      ))}
    </div>
  );
}

function LogoJourneyChapterCard({
  chapter,
  index,
  progress,
  range,
}: {
  chapter: LogoJourneyChapter;
  index: number;
  progress: MotionValue<number>;
  range: LogoJourneyChapterRange;
}) {
  const [start, end] = range;
  const revealStart = Math.max(0, start - 0.012);
  const settleStart = Math.min(end, start + 0.012);
  const leaveStart = Math.max(start, end - 0.014);
  const opacity = useTransform(progress, [revealStart, settleStart, leaveStart, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [revealStart, settleStart, leaveStart, end], ["1.45rem", "0rem", "0rem", "-1.15rem"]);
  const scale = useTransform(progress, [revealStart, settleStart, leaveStart, end], [0.982, 1, 1.006, 0.992]);
  const rotateX = useTransform(progress, [revealStart, settleStart, leaveStart, end], [1.4, 0, 0, -0.7]);

  return (
    <motion.article
      className={`logo-journey-chapter logo-journey-chapter-${chapter.visual}`}
      style={{ opacity, rotateX, scale, y }}
    >
      <div className="logo-journey-chapter-main">
        <span>{chapter.eyebrow}</span>
        <h3>{chapter.title}</h3>
        <p>{chapter.description}</p>
        <ul>
          {chapter.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
      <div className="logo-journey-chapter-side">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <strong>{chapter.metric}</strong>
        <p>{chapter.metricLabel}</p>
        <LogoJourneyChapterVisual visual={chapter.visual} />
      </div>
    </motion.article>
  );
}

function LogoJourneyChapterVisual({ visual }: { visual: LogoJourneyChapter["visual"] }) {
  if (visual === "nodes" || visual === "signals" || visual === "summary" || visual === "review" || visual === "handoff") {
    return (
      <div className={`logo-journey-chapter-visual logo-journey-chapter-visual-${visual}`} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
    );
  }

  if (visual === "cash" || visual === "invoice" || visual === "budget" || visual === "import" || visual === "control") {
    return (
      <div className={`logo-journey-chapter-bars logo-journey-chapter-visual-${visual}`} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    );
  }

  return (
    <div className={`logo-journey-chapter-curve logo-journey-chapter-visual-${visual}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

function LogoJourneySystemVisual({ scene }: { scene: LogoJourneyZone }) {
  if (scene.id === "topTriangle") {
    return (
      <>
        
        <div className="logo-journey-node-map">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className="logo-journey-scan-panel">
          <span />
          <span />
          <span />
        </div>
      </>
    );
  }

  if (scene.id === "middleTriangle") {
    return (
      <>
        <div className="logo-journey-visual-card logo-journey-dashboard-card">
          <span>Budget health</span>
          <strong>Stable</strong>
          <div>
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="logo-journey-transaction-strip">
          <span>Income</span>
          <strong>+$8.2K</strong>
        </div>
        <div className="logo-journey-transaction-strip is-secondary">
          <span>Expenses</span>
          <strong>-$4.7K</strong>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="logo-journey-forecast-line">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="logo-journey-visual-card logo-journey-risk-card">
        <span>Risk window</span>
        <strong>23 days</strong>
        <p>Renewal pressure</p>
      </div>
      <div className="logo-journey-scenario-chip">Scenario simulation</div>
    </>
  );
}

function LogoJourneyFinale({
  opacity,
  scale,
  y,
}: {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  y: MotionValue<string>;
}) {
  return (
    <motion.section
      className="logo-journey-finale"
      style={{ opacity, scale, y }}
      aria-labelledby="logo-journey-finale-heading"
    >
      <div className="logo-journey-finale-mark" aria-hidden="true">
        <LogoStack />
      </div>
      <div className="logo-journey-finale-copy">
        <p className="logo-journey-world-kicker">Dampener system</p>
        <h2 id="logo-journey-finale-heading">One financial intelligence layer for every decision.</h2>
        <p>
          The three signals converge into a calmer operating system: understand the past, control the present,
          and forecast what comes next.
        </p>
      </div>
      <div className="logo-journey-finale-panel" aria-label="Dampener operating summary">
        <article>
          <span>Signal quality</span>
          <strong>94%</strong>
        </article>
        <article>
          <span>Cash clarity</span>
          <strong>Live</strong>
        </article>
        <article>
          <span>Forecast window</span>
          <strong>90d</strong>
        </article>
      </div>
    </motion.section>
  );
}

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

export function LandingMotionEngine() {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  useEffect(() => {
    if (prefersReducedMotion || isCompact) {
      return;
    }

    const root = document.querySelector(".studio-landing-page");

    if (!(root instanceof HTMLElement)) {
      return;
    }

    const scope = createScope({ root }).add(() => {
      const signalGrid = {
        grid: [9, 7],
        from: "center" as const,
      };

      animate(".studio-signal-dot", {
        opacity: stagger([0.28, 1], signalGrid),
        scale: stagger([0.62, 1.34], signalGrid),
        delay: stagger(22, signalGrid),
        duration: 1280,
        ease: "inOutSine",
        loop: true,
        alternate: true,
      });

      animate(createDrawable(".studio-engine-path"), {
        draw: ["0 0", "0 1", "1 1"],
        delay: stagger(180),
        duration: 2600,
        ease: "inOutQuad",
        loop: true,
      });

      createTimeline({
        defaults: {
          duration: 1200,
          ease: "inOutQuad",
        },
        loop: true,
        alternate: true,
      })
        .add(".studio-engine-console", {
          "--engine-glow": [0.16, 0.44],
        })
        .add(
          ".studio-pressure-rail",
          {
            "--rail-scan": ["0%", "100%"],
          },
          "<"
        )
        .add(
          ".studio-motion-value",
          {
            y: [0, -8],
            delay: stagger(70, { from: "center" }),
          },
          "<"
        );

      animate(".studio-motion-value strong", {
        textContent: (target: unknown) => {
          const value = Number((target as HTMLElement).dataset.targetValue ?? 0);

          return [0, value];
        },
        round: 0,
        duration: 1600,
        delay: stagger(120),
        ease: "outExpo",
      });

      createDraggable(".studio-pressure-orb", {
        container: ".studio-pressure-rail",
        x: true,
        y: false,
        snap: 12,
        releaseMass: 0.8,
        releaseStiffness: 140,
        releaseDamping: 12,
        cursor: {
          onGrab: "grabbing",
          onHover: "grab",
        },
        onGrab: () => {
          root.dataset.engineGrabbed = "true";
        },
        onSettle: () => {
          delete root.dataset.engineGrabbed;
        },
      });
    });

    return () => {
      scope.revert();
      delete root.dataset.engineGrabbed;
    };
  }, [isCompact, prefersReducedMotion]);

  return null;
}

export function Landing3DDepthController() {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  useEffect(() => {
    if (prefersReducedMotion || isCompact) {
      return;
    }

    const root = document.documentElement;
    let animationFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    function syncDepthVars() {
      animationFrame = 0;
      root.style.setProperty("--studio-depth-x", pointerX.toFixed(3));
      root.style.setProperty("--studio-depth-y", pointerY.toFixed(3));
      root.style.setProperty("--studio-depth-tilt-x", `${(-pointerY * 3.2).toFixed(3)}deg`);
      root.style.setProperty("--studio-depth-tilt-y", `${(pointerX * 4.2).toFixed(3)}deg`);
    }

    function scheduleDepthVars(event: PointerEvent) {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(syncDepthVars);
      }
    }

    function resetDepthVars() {
      pointerX = 0;
      pointerY = 0;

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(syncDepthVars);
      }
    }

    root.dataset.landingDepth = "true";
    window.addEventListener("pointermove", scheduleDepthVars, { passive: true });
    window.addEventListener("pointerleave", resetDepthVars, { passive: true });

    return () => {
      window.removeEventListener("pointermove", scheduleDepthVars);
      window.removeEventListener("pointerleave", resetDepthVars);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      delete root.dataset.landingDepth;
      root.style.removeProperty("--studio-depth-x");
      root.style.removeProperty("--studio-depth-y");
      root.style.removeProperty("--studio-depth-tilt-x");
      root.style.removeProperty("--studio-depth-tilt-y");
    };
  }, [isCompact, prefersReducedMotion]);

  return null;
}

export function RevealSection({
  labelledBy,
  children,
  className = "",
  id,
}: RevealSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  if (prefersReducedMotion || isCompact) {
    return (
      <section
        id={id}
        aria-labelledby={labelledBy}
        className={`studio-reveal ${className}`.trim()}
        data-motion-state="visible"
      >
        {children}
      </section>
    );
  }

  return (
    <RevealSectionMotion labelledBy={labelledBy} className={className} id={id}>
      {children}
    </RevealSectionMotion>
  );
}

function RevealSectionMotion({
  labelledBy,
  children,
  className = "",
  id,
}: RevealSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 104%", "end 18%"],
  });
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const sectionY = useTransform(smoothProgress, cinematicStops, [88, 22, 0, -14, -44]);
  const sectionScale = useTransform(smoothProgress, cinematicStops, [0.955, 0.988, 1, 0.996, 0.984]);
  const sectionRotateX = useTransform(smoothProgress, cinematicStops, [1.4, 0.5, 0, -0.4, -1]);
  const sectionOpacity = useTransform(smoothProgress, [0, 0.14, 0.84, 1], [0.02, 1, 1, 0.78]);

  return (
    <motion.section
      ref={sectionRef}
      id={id}
      aria-labelledby={labelledBy}
      className={`studio-reveal ${className}`.trim()}
      data-motion-state="visible"
      initial={false}
      variants={sectionVariants}
      style={{
        opacity: sectionOpacity,
        rotateX: sectionRotateX,
        scale: sectionScale,
        y: sectionY,
      }}
    >
      {children}
    </motion.section>
  );
}

export function ScrollProgress() {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  if (prefersReducedMotion || isCompact) {
    return null;
  }

  return <ScrollProgressMotion />;
}

function ScrollProgressMotion() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    damping: 28,
    mass: 0.18,
    stiffness: 120,
  });

  return (
    <div className="studio-scroll-progress" aria-hidden="true">
      <motion.span style={{ scaleX }} />
    </div>
  );
}

export function ScrollAtmosphere() {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  if (prefersReducedMotion || isCompact) {
    return null;
  }

  return <ScrollAtmosphereMotion />;
}

function ScrollAtmosphereMotion() {
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

export function ConnectedJourney() {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  if (prefersReducedMotion || isCompact) {
    return null;
  }

  return <ConnectedJourneyMotion />;
}

function ConnectedJourneyMotion() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 64,
    mass: 0.16,
    stiffness: 155,
  });
  const pathLength = useTransform(smoothProgress, [0.04, 0.94], [0, 1]);
  const pathOpacity = useTransform(smoothProgress, [0, 0.08, 0.9, 1], [0.28, 0.96, 0.86, 0.42]);
  const fieldY = useTransform(smoothProgress, [0, 1], ["4%", "-18%"]);
  const fieldScale = useTransform(smoothProgress, [0, 0.5, 1], [1.08, 0.94, 1.12]);

  return (
    <div className="studio-journey-canvas" aria-hidden="true">
      <motion.div className="studio-journey-field" style={{ scale: fieldScale, y: fieldY }} />
      <svg className="studio-journey-map" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="studioJourneyGradient" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.08" />
            <stop offset="32%" stopColor="#14b8a6" stopOpacity="0.58" />
            <stop offset="68%" stopColor="#38bdf8" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <motion.path
          className="studio-journey-path studio-journey-path-soft"
          d="M50 0 C54 12 42 18 48 29 C57 45 68 45 56 61 C44 77 57 82 50 100"
          style={{ opacity: pathOpacity, pathLength }}
        />
        <motion.path
          className="studio-journey-path"
          d="M50 0 C54 12 42 18 48 29 C57 45 68 45 56 61 C44 77 57 82 50 100"
          style={{ opacity: pathOpacity, pathLength }}
        />
      </svg>
    </div>
  );
}

export function CinematicIntro() {
  return null;
}

export function LogoOpeningScene() {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  if (prefersReducedMotion || isCompact) {
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

  return <LogoOpeningSceneMotion />;
}

function LogoOpeningSceneMotion() {
  const sceneRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end 34%"],
  });
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const logoScale = useTransform(smoothProgress, [0, 0.38, 1], [1, 1.22, 0.68]);
  const logoY = useTransform(smoothProgress, [0, 1], [0, -128]);
  const logoOpacity = useTransform(smoothProgress, [0, 0.66, 1], [1, 1, 0]);
  const cueOpacity = useTransform(smoothProgress, [0, 0.26, 0.5], [1, 1, 0]);

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
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  if (prefersReducedMotion || isCompact) {
    return (
      <section className={className} aria-labelledby={labelledBy}>
        {children}
      </section>
    );
  }

  return (
    <HeroCinematicSceneMotion labelledBy={labelledBy} className={className}>
      {children}
    </HeroCinematicSceneMotion>
  );
}

function HeroCinematicSceneMotion({
  labelledBy,
  children,
  className = "",
}: {
  labelledBy: string;
  children: ReactNode;
  className?: string;
}) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start 82%", "end 10%"],
  });
  const smoothProgress = useSpring(scrollYProgress, smoothScrollSpring);
  const planeY = useTransform(smoothProgress, cinematicStops, [48, 10, 0, -56, -124]);
  const planeScale = useTransform(smoothProgress, cinematicStops, [1, 1, 1, 0.95, 0.86]);
  const planeRotateX = useTransform(smoothProgress, cinematicStops, [1.6, 0.7, 0, -1.1, -2.6]);
  const shadeOpacity = useTransform(smoothProgress, cinematicStops, [0, 0.05, 0.18, 0.46, 0.72]);

  return (
    <motion.section ref={sceneRef} className={className} aria-labelledby={labelledBy}>
      <motion.div className="studio-hero-scroll-plane" style={{ rotateX: planeRotateX, y: planeY, scale: planeScale }}>
        {children}
      </motion.div>
      <motion.div className="studio-hero-scroll-vignette" style={{ opacity: shadeOpacity }} aria-hidden="true" />
    </motion.section>
  );
}

export function HeroTitle({ id, text }: { id: string; text: string }) {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();
  const words = text.split(" ");
  const shouldReduce = prefersReducedMotion || isCompact;

  return (
    <h1 id={id} className="studio-hero-title" aria-label={text}>
      {words.map((word, index) => (
        <span className="studio-word-mask" aria-hidden="true" key={`${word}-${index}`}>
          <motion.span
            initial={shouldReduce ? false : { y: "38%", opacity: 0.01 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={shouldReduce ? { duration: 0 } : { delay: 0.52 + index * 0.044, duration: 0.56, ease: cinematicEase }}
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
  const isCompact = useCompactLandingMotion();
  const shouldReduce = prefersReducedMotion || isCompact;

  return (
    <motion.div
      className="studio-hero-product-stage"
      initial={shouldReduce ? false : { opacity: 0.01, rotateX: 11, rotateY: -14, scale: 0.94, y: 42, z: -24 }}
      animate={shouldReduce ? { opacity: 1, rotateX: 0, rotateY: 0, scale: 1, y: 0, z: 0 } : { opacity: 1, rotateX: 7, rotateY: -10, scale: 1, y: 0, z: 0 }}
      transition={shouldReduce ? { duration: 0 } : { delay: 0.72, duration: 0.74, ease: cinematicEase }}
    >
      {children}
    </motion.div>
  );
}

export function SectionWipe({ label, number }: { label: string; number: string }) {
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  if (prefersReducedMotion || isCompact) {
    return null;
  }

  return <SectionWipeMotion label={label} number={number} />;
}

function SectionWipeMotion({ label, number }: { label: string; number: string }) {
  const sceneRef = useRef<HTMLElement | null>(null);
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
  const prefersReducedMotion = useReducedMotion();
  const isCompact = useCompactLandingMotion();

  if (prefersReducedMotion || isCompact) {
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

  return <StickyProductStoryMotion />;
}

function StickyProductStoryMotion() {
  const sceneRef = useRef<HTMLElement | null>(null);
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
