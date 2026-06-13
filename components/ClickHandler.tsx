"use client";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCallback, useEffect } from "react";

interface ClickHandlerProps {
  raycaster: React.MutableRefObject<THREE.Raycaster>;
  mouse: React.MutableRefObject<THREE.Vector2>;
  onComponentClick: (componentId: string, screenPos: { x: number; y: number }) => void;
}

export function ClickHandler({ raycaster, mouse, onComponentClick }: ClickHandlerProps) {
  const { camera, gl, scene } = useThree();

  // Set up event listener on canvas
  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();

      // Normalize mouse coordinates
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.current.set(x, y);
      raycaster.current.setFromCamera(mouse.current, camera);

      // Raycast against all objects in the scene
      const allObjects: THREE.Object3D[] = [];
      scene.traverse((obj: any) => {
        if (obj instanceof THREE.Mesh) allObjects.push(obj);
      });

      const intersects = raycaster.current.intersectObjects(allObjects);

      if (intersects.length > 0) {
        const firstHit = intersects[0];
        const componentId = firstHit.object.userData?.componentId;

        if (componentId) {
          // Convert world position to screen position
          const screenPos = new THREE.Vector3();
          screenPos.copy(firstHit.point);
          screenPos.project(camera);

          const screenX = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
          const screenY = -(screenPos.y * 0.5 - 0.5) * rect.height + rect.top;

          onComponentClick(componentId, { x: screenX, y: screenY });
        }
      }
    },
    [raycaster, mouse, camera, scene, onComponentClick]
  );

  // Attach click listener
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("click", handleCanvasClick);
    return () => canvas.removeEventListener("click", handleCanvasClick);
  }, [gl.domElement, handleCanvasClick]);

  return null;
}
