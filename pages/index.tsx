import { Box as ContainerBox } from "@mantine/core";
import { Text } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Controllers, Hands, XR, useController, useXR } from "@react-three/xr";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimationMixer, DoubleSide, MathUtils, Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";
import { useFeedDataTextures } from "../lib/useFeedDataTextures";
import { useLocalStorage } from "../lib/useLocalStorage";
import { RatkScene } from "../components/RatkScene";

const TWO_PI = 6.28318530718;

const LoginForm = dynamic(() => import("../components/Login"), { ssr: false });

const App = () => {
  console.log('App render')
  const containerRef = useRef<HTMLDivElement>(null);
  const [feedData, setFeedData] = useLocalStorage("feedData", null);
  const [sessionData, setSessionData] = useState(null);

  return (
    <div>
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
          zIndex: 100000,
        }}
      >
        <LoginForm />
        <XRScene sessionData={sessionData} setSessionData={setSessionData} feedData={feedData} />
      </ContainerBox>
    </div>
  );
};

const Butterfly = ({ groups, gltf, pfp, mixers, textures, item, i }) => {
  console.log('Butterfly render')
  const uniqueKey = `${item.post.author.displayName}-${i}`;
  const random = (min, max) => Math.random() * (max - min) + min;

  const butterfly = clone(gltf.scene);

  // Clone animations and setup the mixer
  const mixer = new AnimationMixer(butterfly);
  mixers.push(mixer);

  if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((animation) => {
      mixer.clipAction(animation).play();
      // add an offset to the animation
      mixer.clipAction(animation).time = MathUtils.randFloat(0, animation.duration);
    });
  }

  //useframe to update the animation mixer (from @react-three/fiber)
  useFrame((state, delta) => {
    mixer.update(delta);
  });

  const profilepic = pfp.scene.clone();

  butterfly.animations = gltf.animations;

  useEffect(() => {
    if (!groupRef.current) return;
    groups.push(groupRef.current);
  }, []);

  const groupRef = useRef(null) as any;
  const { camera } = useThree();
  useEffect(() => {
    if (!groupRef.current) return;
    let g = groupRef.current;
    // console.log("ggggggg", g);
    groups.push(g);
    // randomize the color of the butterfly
    g.init = () => {
      g.cv = new Vector3();
      g.cam = camera;
      g.IDLE = 0;
      g.STATE = g.IDLE;
      g.position.set(random(-2, 2), random(0.1, 1), random(-2, 2));
      g.period = new Vector3(random(0, 1), random(0, 1), random(0, 1));
      g.initialPosition = g.position.clone();
      g.wanderRadius = 0.1;
      g.phase = random(0, TWO_PI);
      g.theta = 0;
    };

    g.init();
    g.multichord = (p, chords, offset, r) => {
      let val = Math.cos(p + offset) * r;
      for (let i = 0; i < chords; i++) {
        p *= 2;
        r *= 0.5;
        val += Math.cos(p + offset) * r;
      }
      return val;
    };
    g.hover = (d) => {
      g.avoidCamera(d);

      g.theta += d * 0.5;

      let x = g.multichord(g.theta * g.period.x, 4, g.phase, g.wanderRadius);
      let y = g.multichord(g.theta * g.period.y, 4, g.phase, g.wanderRadius);
      let z = g.multichord(g.theta * g.period.z, 4, g.phase, g.wanderRadius);

      x += g.initialPosition.x;
      y += g.initialPosition.y;
      z += g.initialPosition.z;

      g.position.lerp(new Vector3(x, y, z), 0.1);
    };

    g.avoidCamera = (d) => {
      let gcamposition = new Vector3();
      g.cam.getWorldPosition(gcamposition);
      gcamposition.sub(g.position);

      let theta = Math.atan2(gcamposition.x, gcamposition.z);
      let dt = theta - g.rotation.y;
      if (dt > Math.PI) dt -= Math.PI * 2;
      if (dt < Math.PI) dt += Math.PI * 2;
      g.rotation.y += dt * 0.01;

      let camdist = gcamposition.length();
      let avoidDistance = 0.5;
      if (camdist < avoidDistance) {
        let camMix = 1 - MathUtils.smoothstep(camdist, 0, avoidDistance);
        let headavoid = gcamposition.clone();
        headavoid.multiply(new Vector3(1, 0, 1));
        headavoid.normalize();
        headavoid.multiplyScalar(camMix * -0.1 * d);
        g.cv.add(headavoid);
      }
    };

    g.run = (d) => {
      if (g.STATE == g.IDLE) {
        g.hover(d);
      } else if (g.STATE == g.HELD) {
        g.seek(d);
      } else {
      }
      g.initialPosition.add(g.cv); //add centroid velocity
      g.cv.multiplyScalar(0.9);
    };

    g.seek = (d) => {
      g.position.lerp(g.targetPosition, 0.2);
    };
    g.grab = () => {
      if (g.STATE == g.IDLE) g.STATE = g.HELD;
    };

    g.release = () => {
      if (g.STATE == g.HELD) g.STATE = g.IDLE;
    };
    g.setTarget = (t, openness) => {
      g.targetPosition = t;
      //TODO - care about handedness, add an offset to target based on where we should go (or else hands have an offset null and we target that offset null? many ways to skin)
    };
  }, [textures]);

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

  useFrame(() => {
    if (pfpRef.current) {
      // the pfpRef should face the camera at all times
      pfpRef.current.lookAt(camera.position);
    }
  });

  return (
    <group
      ref={groupRef}
      key={uniqueKey}
      name={i + "-group"}
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
            {item?.post?.author?.displayName + ": " + item.post.record.text}
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
            <meshStandardMaterial side={DoubleSide} map={base64Texture} />
          </mesh>
        </>
      )}
    </group>
  );
};

const Butterflies = ({ feedData, selectedObjectRight, selectedObjectLeft }) => {
  console.log('Butterflies render')
  const textures = useFeedDataTextures(feedData);
  const { session } = useXR();
  const { scene } = useThree();

  const leftController = useController("left");
  const rightController = useController("right");

  const groups = [];

  useFrame((state, delta) => {
    //GLOBAL tick update
    for (let i = 0; i < groups.length; i++) {
      let bf = groups[i];
      bf.run(delta);
    }
  });

  // load a gltf file to be used as geometry
  const gltf = useLoader(GLTFLoader, "butterfly.glb");
  const pfp = useLoader(GLTFLoader, "profilepic.glb");
  const mixers = [];

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
    if (!session) return;
    let lastLeftGroup = null;
    let lastRightGroup = null;

    const selectStartListener = (event) => {
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
    };

    const selectEndListener = (event) => {
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
    };
    session.addEventListener("selectstart", selectStartListener);
    session.addEventListener("selectend", selectEndListener);

    const ratk = scene.getObjectByName("ratk");
		if (!ratk) return;

		const planes = ratk.children
    console.log('planes', planes)

    return () => {
      session.removeEventListener("selectstart", selectStartListener)
      session.removeEventListener("selectend", selectEndListener)
    }
  }, [session]);

  const butterflies = !feedData
    ? []
    : feedData.map((item, i) => (
        <Butterfly
          groups={groups}
          gltf={gltf}
          pfp={pfp}
          mixers={mixers}
          textures={textures}
          key={i}
          i={i}
          item={item}
        />
      ));
  return <>{butterflies}</>;
};

const XRScene = ({feedData, sessionData, setSessionData}) => {
  console.log('XRScene render')
  const selectedObjectRight = useRef(null);
  const selectedObjectLeft = useRef(null);

  return (
    <div style={{ position: "fixed", width: "100%", height: "100%" }}>
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
          <RatkScene />
          <Controllers />
          <directionalLight position={[1, 1, 1]} color={0xffffff} />
          {sessionData && (
            <Butterflies
              feedData={feedData}
              selectedObjectLeft={selectedObjectLeft}
              selectedObjectRight={selectedObjectRight}
            />
          )}
        </XR>
      </Canvas>
    </div>
  );
};

export default App;
