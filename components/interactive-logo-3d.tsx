"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type InteractiveLogo3DProps = {
  compact?: boolean;
};

type PointerState = {
  active: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

export function InteractiveLogo3D({ compact = false }: InteractiveLogo3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<PointerState>({
    active: false,
    x: 0,
    y: 0,
    targetX: compact ? -0.14 : -0.22,
    targetY: compact ? 0.42 : 0.5,
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function setupScene() {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const host = container;

      try {
        const THREE = await import("three");
        const { SVGLoader } = await import("three/examples/jsm/loaders/SVGLoader.js");

        if (disposed) {
          return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(0, 0, compact ? 7.6 : 7.2);

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        host.replaceChildren(renderer.domElement);

        const logoGroup = new THREE.Group();
        logoGroup.rotation.x = pointerRef.current.targetX;
        logoGroup.rotation.y = pointerRef.current.targetY;
        scene.add(logoGroup);

        const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
        keyLight.position.set(3, 4, 5);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x24d6c8, 2);
        rimLight.position.set(-4, -1, 3);
        scene.add(rimLight);

        const fillLight = new THREE.AmbientLight(0xffffff, 1.15);
        scene.add(fillLight);

        const response = await fetch("/img/3D.svg");
        const svgText = await response.text();
        const loader = new SVGLoader();
        const parsed = loader.parse(svgText);
        const material = new THREE.MeshStandardMaterial({
          color: 0x07111f,
          metalness: 0.58,
          roughness: 0.28,
          emissive: 0x020617,
          emissiveIntensity: 0.18,
        });
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: 0x10b7a8,
          metalness: 0.36,
          roughness: 0.36,
        });

        for (const path of parsed.paths) {
          const shapes = SVGLoader.createShapes(path);

          for (const shape of shapes) {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: compact ? 34 : 42,
              bevelEnabled: true,
              bevelThickness: compact ? 4 : 5,
              bevelSize: compact ? 4 : 5,
              bevelSegments: 7,
              curveSegments: 18,
            });
            const mesh = new THREE.Mesh(geometry, [material, sideMaterial]);
            logoGroup.add(mesh);
          }
        }

        const box = new THREE.Box3().setFromObject(logoGroup);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        logoGroup.position.sub(center);
        logoGroup.rotation.z = Math.PI;
        logoGroup.scale.setScalar((compact ? 3.2 : 3.55) / Math.max(size.x, size.y));

        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(1.95, 0.018, 16, 120),
          new THREE.MeshBasicMaterial({
            color: 0x10b7a8,
            transparent: true,
            opacity: 0.22,
          }),
        );
        halo.position.z = -0.22;
        scene.add(halo);

        function resize() {
          const width = host.clientWidth;
          const height = host.clientHeight;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }

        function handlePointerDown(event: PointerEvent) {
          pointerRef.current.active = true;
          pointerRef.current.x = event.clientX;
          pointerRef.current.y = event.clientY;
          host.setPointerCapture(event.pointerId);
        }

        function handlePointerMove(event: PointerEvent) {
          const pointer = pointerRef.current;

          if (!pointer.active) {
            return;
          }

          const deltaX = event.clientX - pointer.x;
          const deltaY = event.clientY - pointer.y;
          pointer.x = event.clientX;
          pointer.y = event.clientY;
          pointer.targetY += deltaX * 0.01;
          pointer.targetX += deltaY * 0.008;
          pointer.targetX = Math.max(-0.78, Math.min(0.78, pointer.targetX));
        }

        function handlePointerUp(event: PointerEvent) {
          pointerRef.current.active = false;

          if (host.hasPointerCapture(event.pointerId)) {
            host.releasePointerCapture(event.pointerId);
          }
        }

        let frame = 0;
        let animationId = 0;

        function animate() {
          frame += 0.01;
          const pointer = pointerRef.current;

          if (!pointer.active) {
            pointer.targetY += 0.0022;
          }

          logoGroup.rotation.x += (pointer.targetX - logoGroup.rotation.x) * 0.08;
          logoGroup.rotation.y += (pointer.targetY - logoGroup.rotation.y) * 0.08;
          logoGroup.position.y = Math.sin(frame) * 0.08;
          halo.rotation.z -= 0.006;
          halo.scale.setScalar(1 + Math.sin(frame * 1.5) * 0.025);

          renderer.render(scene, camera);
          animationId = requestAnimationFrame(animate);
        }

        resize();
        animate();

        const observer = new ResizeObserver(resize);
        observer.observe(host);
        host.addEventListener("pointerdown", handlePointerDown);
        host.addEventListener("pointermove", handlePointerMove);
        host.addEventListener("pointerup", handlePointerUp);
        host.addEventListener("pointercancel", handlePointerUp);

        cleanup = () => {
          cancelAnimationFrame(animationId);
          observer.disconnect();
          host.removeEventListener("pointerdown", handlePointerDown);
          host.removeEventListener("pointermove", handlePointerMove);
          host.removeEventListener("pointerup", handlePointerUp);
          host.removeEventListener("pointercancel", handlePointerUp);
          renderer.dispose();
          material.dispose();
          sideMaterial.dispose();
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
            }
          });
        };
      } catch (error) {
        console.error("Failed to render 3D logo:", error);
        setFailed(true);
      }
    }

    void setupScene();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [compact]);

  return (
    <div className={`interactive-logo-shell ${compact ? "is-compact" : ""}`}>
      <div ref={containerRef} className="interactive-logo-canvas" aria-hidden="true" />
      {failed ? (
        <Image
          src="/img/3D.png"
          alt=""
          width={2000}
          height={2000}
          className="interactive-logo-fallback"
        />
      ) : null}
    </div>
  );
}
