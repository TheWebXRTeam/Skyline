import { useFrame, useThree } from "@react-three/fiber";
import { RealityAccelerator } from "ratk";
import { useEffect } from "react";
import { DoubleSide, MeshBasicMaterial } from "three";


export const RatkScene = () => {
  const { gl, scene } = useThree();
  
  const ratkObject = new RealityAccelerator(gl.xr);
  useEffect(() => {
    // WRITE THREE.JS CODE HERE
    ratkObject.root.name = 'ratk';
    console.log("add ratk");

    ratkObject.onPlaneAdded = (plane) => {
      console.log(plane)
      const mesh = plane.planeMesh;
      mesh.material = new MeshBasicMaterial({
        transparent: true,
        opacity: 0.9,
        color: Math.random() * 0xffffff,
        side: DoubleSide,
      });
    };
    scene.add(ratkObject.root);
    console.log("three.js scene is", scene);

    console.log("three.js renderer is", gl);
  }, []);

  scene.add(ratkObject.root);
  useFrame((state, delta) => {
    if (ratkObject)
    ratkObject.update();
  });

  return <></>;
};
