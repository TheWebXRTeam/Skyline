import { useFrame, useThree } from "@react-three/fiber";
import { useXR} from "@react-three/xr";
import { RealityAccelerator } from "ratk";
import { useEffect, useRef } from "react";
import { DoubleSide, MeshBasicMaterial } from "three";


export const RatkScene = () => {
  const { gl, scene } = useThree();
  const { session } = useXR();
  const ratkRef = useRef(null);
  
  useEffect(() => {
    if (!session) return;

    const ratkObject = new RealityAccelerator(gl.xr);
    ratkRef.current = ratkObject;

    ratkObject.root.name = 'ratk';

/*
    ratkObject.onPlaneAdded = (plane) => {
      console.log(plane)

      const mesh = plane.planeMesh;
      mesh.material = new MeshBasicMaterial({
        transparent: true,
        opacity: 0.1,
        color: Math.random() * 0xffffff,
        side: DoubleSide,
      });
    };
*/
    scene.add(ratkObject.root);
  }, [session]);

  useFrame((state, delta, xrFrame) => {
    if (ratkRef.current) {
      const ratkObject = ratkRef.current;
      ratkObject.update();
    }
  });

  return <></>;
};
