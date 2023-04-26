import { library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faVrCardboard } from "@fortawesome/free-solid-svg-icons";
import { Box as ContainerBox } from "@mantine/core";
import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Controllers, Hands, Interactive, XR, useController, useXR } from "@react-three/xr";
import * as THREE from "three";

import { Text } from "@react-three/drei";
import { RealityAccelerator } from "ratk";
import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
// import next/dynamic and dynamically load LoginForm instead
import dynamic from "next/dynamic";
const LoginForm = dynamic(() => import("../components/Login"), { ssr: false });

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import AR button from react three xr
import Layout from "../components/layouts/article";
import { useLocalStorage } from "../components/useLocalStorage";

library.add(faVrCardboard);

const useFetchTextureLoader = (url, loading) => {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loadTexture = async () => {
      try {
        const apiUrl = "/api/image-proxy"; // Change this to match your API route
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: url }),
        });
        const jsonResponse = await response.json();
        const base64Image = jsonResponse.base64Image;
        const binaryImage = atob(base64Image.split(",")[1]);
        const arrayBuffer = new ArrayBuffer(binaryImage.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < binaryImage.length; i++) {
          uint8Array[i] = binaryImage.charCodeAt(i);
        }

        const blob = new Blob([uint8Array], { type: "image/jpeg" });
        const newUrl = URL.createObjectURL(blob);
        const newTexture = new THREE.TextureLoader().load(newUrl, () => {
          loading.current = false;
        });

        setTexture(newTexture);
      } catch (error) {
        console.error("Error loading texture:", error);
      }
    };

    if (url) {
      loadTexture();
    }
  }, [url]);

  return texture;
};

const Balls = () => {
  const isRightSelectPressed = useRef(false);
  const isLeftSelectPressed = useRef(false);

  const currentRightObject = useRef(null);
  const currentLeftObject = useRef(null);

  const [feedData, setFeedData] = useLocalStorage("feedData", null);


  const loading = useRef(true);
  loading.current = false; // Set the loading state to false after the image has loaded

  // load a gltf file to be used as geometry
  const gltf = useLoader(GLTFLoader, "butterfly.glb");
  const pfp = useLoader(GLTFLoader, "profilepic.glb");
  const groups = [];

  const random = (min, max) => Math.random() * (max - min) + min;

  const balls = !feedData
    ? []
    : feedData.map((item, i) => {
        const uniqueKey = `${item.post.author.displayName}-${i}`;

        // instance the gltf file to be used as geometry for each item
        const butterfly = gltf.scene.clone();
        const profilepic = pfp.scene.clone();

        butterfly.animations = gltf.animations;

        const groupRef = useRef(null) as any;

        groups.push(groupRef);

        profilepic.traverse((child) => {
          if (child instanceof Mesh) {
            child.material.color.setHex(Math.random() * 0xffffff);
          }
        });

        // randomize the color of the butterfly
        butterfly.traverse((child) => {
          if (child instanceof Mesh) {
            child.material.color.setHex(Math.random() * 0xffffff);
          }
        });
        const likeCount = item?.post?.likeCount;
        const pfpGeometry = (profilepic.children[0] as Mesh).geometry;

        const base64Texture = useFetchTextureLoader(
          item?.post?.author.avatar,
          loading
        );

        return (
          <group
            ref={groupRef}
            key={uniqueKey}
            position={[random(-2, 2), random(0.1, 1), random(-2, 2)]}
          >
            {/* add cube to the scene */}
            <primitive
              key={`${uniqueKey}-primitive`}
              scale={[0.08, 0.08, 0.08]}
              position={[0, 0, 0]}
              object={butterfly}
            />
            {!base64Texture ? null : (
              <>
                {/* @ts-ignore */}
                <Text
                  key={`${uniqueKey}-text1`}
                  position={[0.3, 0, 0]}
                  fontSize={0.03}
                  maxWidth={1}
                  lineHeight={1}
                  letterSpacing={0.02}
                  anchorX={2.3}
                  // @ts-ignore
                  wrap={0.1}
                  height={0.1}
                  color={0x000000}
                  textAlign={"left"}
                >
                  {item?.post?.author?.displayName +
                    ": " +
                    item.post.record.text}
                </Text>
                <Text
                  key={`${uniqueKey}-text2`}
                  position={[2, 0, 0]}
                  fontSize={0.03}
                  maxWidth={0.5}
                  lineHeight={1}
                  letterSpacing={0.02}
                  anchorX={2.3}
                  // @ts-ignore
                  wrap={0.1}
                  height={0.1}
                  color={0x000000}
                  textAlign={"center"}
                >
                  {likeCount + "\n" + (likeCount === 1 ? "like" : "likes")}
                </Text>
                <mesh
                  geometry={pfpGeometry}
                  scale={[0.07, 0.07, 0.07]}
                  position={[0, 0, 0.04]}
                >
                  <meshStandardMaterial
                    side={THREE.DoubleSide}
                    map={base64Texture}
                  />
                </mesh>
              </>
            )}
          </group>
        );
      });

      const {session} = useXR();

      session?.addEventListener("selectstart", (event) => {
        console.log("select start", event);
        const controller = event.target;
        const handedness = controller.inputSource.handedness;
    
        const controllerPosition = controller.position;
        const maxDistance = 100;
    
        function getGroup(_controllerPosition){
          const groups = balls;
          // iterate through groups and find the closest one to controllerPosition
          let closestGroup = null;
          let closestDistance = Infinity;
          for (let i = 0; i < groups.length; i++) {
            let bf = groups[i].props;
            // bf.position is an array
            const bfPosition = new THREE.Vector3(...bf.position);

            let distance = bfPosition.distanceTo(controllerPosition);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestGroup = bf;
            }
          }
          if(closestGroup && closestDistance < maxDistance)
            return closestGroup;
          else return null;
        }
    
        if (handedness === "left") {
          if(isLeftSelectPressed.current) return console.log('leftg already sent')
          //check
          isLeftSelectPressed.current = true; //check
          currentLeftObject.current = getGroup(controllerPosition);
          console.log('currentLeftObject.current', currentLeftObject.current)

    
        } else if (handedness === "right") {
          if(isRightSelectPressed.current) return console.log('right already sent')
          isRightSelectPressed.current = true; //check
          currentRightObject.current = getGroup(controllerPosition);   
          console.log('currentRightObject.current', currentRightObject.current)
 
        }
      });
    
      const onSelectEnd = (event: any) => {
        const controller = event.target;
        const handedness = controller.inputSource.handedness;
        console.log('event end', handedness)
    
      if (handedness === "left") {
        //check
        isLeftSelectPressed.current = false; //check
        currentLeftObject.current = null;
              console.log('currentLeftObject.current', currentLeftObject.current)
    
      } else if (handedness === "right") {
        //check
        isRightSelectPressed.current = false; //check
        currentRightObject.current = null;
        console.log('currentRightObject.current', currentRightObject.current)
    
      }
    };
      
    useFrame((state, delta) => {
      //GLOBAL tick update
      for (let i = 0; i < groups.length; i++) {
        let bf = groups[i].current;
        // bf.update();
      }
    });

  return (
    <>
      {balls}
    </>
  );
};

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const RatkScene = () => {
    // get a reference to the react-three-fiber renderer
    // THESE ARE THE REFERENCES TO THE THREE.JS STUFF


    const leftController = useController("left");
    const rightController = useController("right");

    const { gl, scene, camera, xr } = useThree();
    const ratkObject = new RealityAccelerator(gl.xr);
    scene.add(ratkObject.root);

    useEffect(() => {
      // WRITE THREE.JS CODE HERE

      console.log("three.js scene is", scene);

      console.log("three.js renderer is", gl);
    }, []);

    //
    useFrame((state, delta) => {
      ratkObject.update();
    });

    return <></>;
  };

  return (
    <Layout title="Skyline">
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
        <LoginForm />
        <Canvas
          style={{
            position: "absolute",
            zIndex: 9999,
          }}
          camera={{
            fov: 50,
            near: 0.1,
            far: 100,
            position: [0, 1.6, 3],
          }}
          gl={{ antialias: true }}
        >
          <XR referenceSpace="local">
            <Hands />
            <RatkScene />
            <Controllers />
            <directionalLight position={[1, 1, 1]} color={0xffffff} />
            <OrbitControls target={[0, 1.6, 0]} />
            <Stats />
            <Balls />
          </XR>
        </Canvas>
      </ContainerBox>
    </Layout>
  );
};

export default App;
