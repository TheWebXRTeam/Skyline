import { useFrame, useThree } from "@react-three/fiber";
import { RealityAccelerator } from "ratk";


export const RatkScene = () => {
  const { gl, scene } = useThree();
  const ratkObject = new RealityAccelerator(gl.xr);
  scene.add(ratkObject.root);
  useFrame((state, delta) => {
    ratkObject.update();
  });

  return <></>;
};
