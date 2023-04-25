import { library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faVrCardboard } from "@fortawesome/free-solid-svg-icons";
import { Box as ContainerBox } from "@mantine/core";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Controllers, XR } from "@react-three/xr";
import { RealityAccelerator } from 'ratk';
import { useEffect, RefObject, useRef } from "react";
import { BackSide, IcosahedronGeometry, Mesh } from "three";
import { Avatar } from '../components/Avatar';
import LoginForm from '../components/Login';
import CustomVRButton from "../components/VRButton";
import Layout from "../components/layouts/article";

library.add(faVrCardboard);

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const RatkScene = () => {

    // get a reference to the react-three-fiber renderer
    // THESE ARE THE REFERENCES TO THE THREE.JS STUFF

    const { gl, scene, camera, xr } = useThree();
    const ratkObject = new RealityAccelerator(gl.xr);
    scene.add(ratkObject.root); 


  useEffect(() => {
    // WRITE THREE.JS CODE HERE

    console.log("three.js scene is", scene)

    console.log('three.js renderer is', gl)

  }, [])

  // 
  useFrame((state, delta) => {
    ratkObject.update();
  });
  
    return <></>;
  }

  return (
    <Layout title="Social Agent">
      <ContainerBox
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
		<LoginForm
		/>
        <CustomVRButton />
        <Canvas
          camera={{
            fov: 50,
            near: 0.1,
            far: 100,
            position: [0, 1.6, 3],
          }}
          gl={{ antialias: true }}
        >
          <XR>
            <RatkScene />
            <Controllers />
            <color attach="background" args={[0x090c17]} />
            <hemisphereLight color={0x606060} groundColor={0x404040} />
            <directionalLight position={[1, 1, 1]} color={0xffffff} />
          </XR>
        </Canvas>
      </ContainerBox>
    </Layout>
  );
};

export default App;
