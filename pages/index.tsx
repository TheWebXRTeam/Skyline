import { library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faVrCardboard } from "@fortawesome/free-solid-svg-icons";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Controllers, Hands, XR, useController, useXR } from "@react-three/xr";
import * as THREE from "three";

import { Text } from "@react-three/drei";
import { RealityAccelerator } from "ratk";
import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
import dynamic from "next/dynamic";
const LoginForm = dynamic(() => import("../components/Login"), { ssr: false });

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import skeletonutils
import { clone } from "three/examples/jsm/utils/SkeletonUtils";
// import AR button from react three xr
import Layout from "../components/layouts/article";
import { useLocalStorage } from "../components/useLocalStorage";

library.add(faVrCardboard);

const loadTexture = async (url) => {
  try {
    const apiUrl = "/api/image-proxy";
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
    const newTexture = new THREE.TextureLoader().load(newUrl);

    return newTexture;
  } catch (error) {
    console.error("Error loading texture:", error);
  }
};

const useFeedDataTextures = (feedData) => {
  const [textures, setTextures] = useState([]);

  useEffect(() => {
    if (!feedData) return;

    const loadTextures = async () => {
      const texturesPromises = feedData.map((item) =>
        loadTexture(item?.post?.author.avatar)
      );

      const loadedTextures = await Promise.all(texturesPromises);
      setTextures(loadedTextures);
    };

    loadTextures();
  }, [feedData]);

  return textures;
};

const Balls = ({ selectedObjectRight, selectedObjectLeft }) => {
  const [feedData, setFeedData] = useLocalStorage("feedData", null);
  const textures = useFeedDataTextures(feedData);

  const { gl, scene, camera, xr } = useThree();

  const { session } = useXR();

  const leftController = useController("left");
  const rightController = useController("right");

  const groups = [];

  function getGroup(position) {
    // get the group that is closest to the position
    let closestGroup = null;
    let closestDistance = 100000;
    for (let i = 0; i < groups.length; i++) {
      let bf = groups[i];
      let distance = bf.position.distanceTo(position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestGroup = bf;
      }
    }
    return closestGroup;
  }

  useFrame((state, delta) => {
    if (!leftController) return;
    if (!rightController) return;

    console.log("selectedObjectLeft.name", selectedObjectLeft.current?.name);

    if (selectedObjectLeft.current && selectedObjectRight.current) {
      if (selectedObjectLeft.current === selectedObjectRight.current) {
        console.log("HANDLING GRAB", selectedObjectLeft.current);
        // selectedObjectLeft.current is a three.js group
        // iterate through all children and set visible to true
      }
    }
  });

  useEffect(() => {
    if (session) {
      let lastLeftGroup = null;
      let lastRightGroup = null;

      session.addEventListener("selectstart", (event) => {
        console.log("something selected", event);
        const inputSource = event.inputSource;

        if (inputSource.handedness === "left") {
          const nearestGroup = getGroup(leftController.controller.position);
          console.log("nearest group", nearestGroup);
          selectedObjectLeft.current = nearestGroup;
          lastLeftGroup = nearestGroup;
          nearestGroup.children.forEach((child, i) => {
            if (child.name?.includes("feed")) child.visible = true;
          });
        } else if (inputSource.handedness === "right") {
          const nearestGroup = getGroup(rightController.controller.position);
          console.log("nearest group", nearestGroup);
          selectedObjectRight.current = nearestGroup;
          lastRightGroup = nearestGroup;
          nearestGroup.children.forEach((child, i) => {
            if (child.name?.includes("feed")) child.visible = true;
          });
        }

        //
      });

      session.addEventListener("selectend", (event) => {
        const inputSource = event.inputSource;

        if (inputSource.handedness === "left") {
          console.log("left hand deselected");
          selectedObjectLeft.current = null;
          lastLeftGroup?.children.forEach((child, i) => {
            if (child.name?.includes("feed")) child.visible = false;
          });
        } else if (inputSource.handedness === "right") {
          console.log("left hand deselected");
          selectedObjectRight.current = null;

          lastRightGroup?.children.forEach((child, i) => {
            if (child.name?.includes("feed")) child.visible = false;
          });
        }

        //
      });
    }
  }, [session]);

  const ratkObject = new RealityAccelerator(gl.xr);
  scene.add(ratkObject.root);

  useFrame((state, delta) => {
    ratkObject.update();
  });

  const random = (min, max) => Math.random() * (max - min) + min;

  // load a gltf file to be used as geometry
  const gltf = useLoader(GLTFLoader, "butterfly.glb");
  const pfp = useLoader(GLTFLoader, "profilepic.glb");
  const mixers = [];

  const balls = !feedData
    ? []
    : feedData.map((item, i) => {
        const uniqueKey = `${item.post.author.displayName}-${i}`;

        const butterfly = clone(gltf.scene);

        // Clone animations and setup the mixer
        const mixer = new THREE.AnimationMixer(butterfly);
        mixers.push(mixer);

        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach((animation) => {
            mixer.clipAction(animation).play();
          });
        }

        //useframe to update the animation mixer
        useFrame((state, delta) => {
          mixer.update(delta);
        });

        const profilepic = pfp.scene.clone();

        butterfly.animations = gltf.animations;

        const groupRef = useRef(null) as any;

        useEffect(() => {
          if (!groupRef.current) return;
          groups.push(groupRef.current);
        }, []);

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
        const pfpRef = useRef(null) as any;
        const base64Texture = textures[i];

        const { camera } = useThree();

        useFrame(() => {
          if (pfpRef.current) {
            // the pfpRef should face the camera at all times
            pfpRef.current.lookAt(camera.position);
          }
        });

        return (
          <group
            key={uniqueKey}
            ref={groupRef}
            name={i + "-group"}
            position={[random(-2, 2), random(0.1, 1), random(-2, 2)]}
          >
            {/* add cube to the scene */}
            <>
              <primitive
                key={`${uniqueKey}-primitive`}
                scale={[0.08, 0.08, 0.08]}
                position={[0, 0, 0]}
                object={butterfly}
              />
              {!base64Texture ? null : (
                <Text
                  key={`${uniqueKey}-text1`}
                  name={"feed"}
                  position={[0.3, 0, 0]}
                  fontSize={0.03}
                  maxWidth={1}
                  lineHeight={1}
                  letterSpacing={0.02}
                  anchorX={2.3}
                  // @ts-ignore
                  wrap={0.1}
                  visible={false}
                  height={0.1}
                  color={0x000000}
                  textAlign={"left"}
                >
                  {item?.post?.author?.displayName +
                    ": " +
                    item.post.record.text}
                </Text>
              )}
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
                visible={false}
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
                ref={pfpRef}
              >
                <meshBasicMaterial
                  side={THREE.DoubleSide}
                  map={base64Texture}
                />
              </mesh>
            </>
          </group>
        );
      });

  return <>{balls}</>;
};

const App = () => {
  const [sessionData, setSessionData] = useState(null);

  const selectedObjectRight = useRef(null);
  const selectedObjectLeft = useRef(null);

  return (
    <Layout title="Skyline">
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
        <XR
          referenceSpace="local"
          onSessionStart={(event) => {
            setSessionData(true);
          }}
        >
          <Hands />
          <Controllers />
          <directionalLight position={[1, 1, 1]} color={0xffffff} />
          {sessionData && (
            <Balls
              selectedObjectLeft={selectedObjectLeft}
              selectedObjectRight={selectedObjectRight}
            />
          )}
        </XR>
      </Canvas>
    </Layout>
  );
};

export default App;
