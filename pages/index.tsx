import { Box as ContainerBox } from "@mantine/core";
import { Text } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Controllers, Hands, XR, useController, useXR } from "@react-three/xr";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimationMixer, Color, MathUtils, Mesh, Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";
import { RatkScene } from "../components/RatkScene";
import { useFeedDataTextures } from "../lib/useFeedDataTextures";
import { useLocalStorage } from "../lib/useLocalStorage";

const TWO_PI = 6.28318530718;

const LoginForm = dynamic(() => import("../components/Login"), { ssr: false });

const App = () => {
  console.log("App render");
  const containerRef = useRef<HTMLDivElement>(null);
  const [feedData, setFeedData] = useLocalStorage("feedData", null);
  const [sessionData, setSessionData] = useState(null);

  return (
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
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 100000 }}>
      <LoginForm />
      </div>
      <XRScene
        sessionData={sessionData}
        setSessionData={setSessionData}
        feedData={feedData}
      />
    </ContainerBox>
  );
};

const Butterfly = ({ groups, gltf, pfp, mixers, textures, item, i }) => {
  console.log("Butterfly render");
  const { scene } = useThree();
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
      mixer.clipAction(animation).time = MathUtils.randFloat(
        0,
        animation.duration
      );
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

    g.checkWalls = ()=>{
      const ratk = scene.getObjectByName("ratk");
      if (!ratk) return			
      const planes = ratk.children as Object3D[];
      if(planes.length <1)return

      const planeIndex = Math.floor(Math.random() * planes.length);

      // ugly hack. sometimes the plane position is created, but matrixWorld is not updated yet. so skip
      const zeroPos = new Vector3(0, 0, 0);
      zeroPos.applyMatrix4(planes[planeIndex].matrixWorld);
      if (zeroPos.x == 0 && zeroPos.y == 0 && zeroPos.z == 0) return; 

      // TODO: Forcing these so any so we can build but need to figure out why they are not there
      const planeHeight = (planes[planeIndex] as any).boundingRectangleHeight;
      const planeWidth = (planes[planeIndex] as any).boundingRectangleWidth;

      console.log('planeHeight', planeHeight)

      const posX = Math.random() * planeWidth - planeWidth/2;
      const posZ = Math.random() * planeHeight - planeHeight/2;

      const pos = new Vector3(posX, 0, posZ);

      pos.applyMatrix4(planes[planeIndex].matrixWorld);

      g.wallTarget = new Vector3(pos.x, pos.y, pos.z);
    }

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

    g.goToWall = (d)=>{
      if(g.wallTarget)g.position.lerp(g.wallTarget,0.02)
    }

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
            name={"feed"}
            position={[-0.15, -0.2, 0]}
            fontSize={0.03}
            maxWidth={0.4}
            lineHeight={1}
            letterSpacing={0.02}
            anchorX={0}
            visible={false}
            // @ts-ignore
            wrap={0.1}
            height={0.1}
            color={0x000000}
            textAlign={"center"}
			outlineWidth={0.001}
			outlineColor={0xffffff}
          >
            {item?.post?.author?.displayName + ":\n" + item.post.record.text}
          </Text>
          <Text
            key={`${uniqueKey}-text2`}
            name={"likes"}
            position={[-0.15, -0.2, 0]}
            fontSize={0.03}
            maxWidth={0.4}
            lineHeight={1}
            letterSpacing={0.02}
            anchorX={0}
            visible={false}
            // @ts-ignore
            wrap={0.1}
            height={0.1}
            color={0x000000}
            textAlign={"center"}
			outlineWidth={0.001}
			outlineColor={0xffffff}
          >
            {likeCount + "\n" + (likeCount === 1 ? "like" : "likes")}
          </Text>
          <mesh
            geometry={pfpGeometry}
            scale={[0.07, 0.07, 0.07]}
            position={[0, 0, 0.04]}
          >
            <meshStandardMaterial map={base64Texture} emissiveMap={base64Texture} emissive={new Color(0.2, 0.2, 0.5)} />
          </mesh>
        </>
      )}
    </group>
  );
};

const Butterflies = ({
  feedData,
  selectedObjectRight,
  selectedObjectLeft,
  textures,
}) => {
  console.log("Butterflies render");
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
		const ratk = scene.getObjectByName("ratk");
		if (!ratk) return;

    const planes = ratk.children
		if (planes.length === 0) return;


		for (let i = 0; i < groups.length; i++) {
			if (Math.random() * 1000 > 1) continue; 

			const planeIndex = Math.floor(Math.random() * planes.length);

			// ugly hack. sometimes the plane position is created, but matrixWorld is not updated yet. so skip
			const zeroPos = new Vector3(0, 0, 0);
			zeroPos.applyMatrix4(planes[planeIndex].matrixWorld);
			if (zeroPos.x == 0 && zeroPos.y == 0 && zeroPos.z == 0) return; 
          	{/* @ts-ignore */}
			const planeHeight = planes[planeIndex].boundingRectangleHeight;
			{/* @ts-ignore */}
			const planeWidth = planes[planeIndex].boundingRectangleWidth;

			const posX = Math.random() * planeWidth - planeWidth/2;
			const posZ = Math.random() * planeHeight - planeHeight/2;

			const pos = new Vector3(posX, 0, posZ);

			pos.applyMatrix4(planes[planeIndex].matrixWorld);

			groups[i].userData.targetPosition = new Vector3(pos.x, pos.y, pos.z);
		}


    console.log('ratk planes: ', planes)
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

  let offset = null;
  
  useFrame((state, delta) => {
    if (!leftController) return;
    if (!rightController) return;

    // Grabbing
    if (selectedObjectLeft.current && selectedObjectRight.current) {
      if (selectedObjectLeft.current === selectedObjectRight.current) {

        console.log("HANDLING GRAB", selectedObjectLeft.current);
      }
    } else if ((!selectedObjectLeft.current && selectedObjectRight.current) ||
      (selectedObjectLeft.current && !selectedObjectRight.current)
    ) {
      console.log('one hand grabbing')
      // one hand is grabbing
      const grabbingHand = selectedObjectLeft.current ? leftController : rightController;
      console.log('grabbingHand', grabbingHand)
      const selectedObject = selectedObjectLeft.current || selectedObjectRight.current;
      console.log('selectedObject', selectedObject)
      const grabbingHandPosition = grabbingHand.controller.position;
      console.log('grabbingHandPosition', grabbingHandPosition)
      // calculate the difference between the startGrabPosition and the object
      if(!offset)
        offset = grabbingHandPosition.clone().sub(selectedObject.position);
		// check if selectedObjectLeft is a butterfly
		if (selectedObjectLeft.current) {
			console.log("left is butterfly", selectedObjectLeft.current)
			// if so, set the target position to the grabbing hand position
			selectedObjectLeft.current.userData.targetPosition = grabbingHandPosition.clone();
		}
		/// check if selectedObjectRight is a butterfly
		if (selectedObjectRight.current) {
			console.log("right is butterfly", selectedObjectRight.current)

			// if so, set the target position to the grabbing hand position
			selectedObjectRight.current.userData.targetPosition = grabbingHandPosition.clone();
		}


        // selectedObjectLeft.current.position.copy(grabbingHandPosition.clone().sub(offset));
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
        if(!nearestGroup) return;
        console.log("nearest group", nearestGroup);
        selectedObjectLeft.current = nearestGroup;
        lastLeftGroup = nearestGroup;
        nearestGroup.children.forEach((child, i) => {
          if (child.name?.includes("feed")) child.visible = true;
        });
      } else if (inputSource.handedness === "right") {
        const nearestGroup = getGroup(rightController.controller.position);
        if(!nearestGroup) return;
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

    const planes = ratk.children;
    console.log("planes", planes);

    return () => {
      session.removeEventListener("selectstart", selectStartListener);
      session.removeEventListener("selectend", selectEndListener);
    };
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

const XRScene = ({ feedData, sessionData, setSessionData }) => {
  const selectedObjectRight = useRef(null);
  const selectedObjectLeft = useRef(null);
  const textures = useFeedDataTextures(feedData);

  return (
    <Canvas
      style={{
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
        <RatkScene />
        <Hands />
        <Controllers />
        <directionalLight position={[1, 1, 1]} color={0xffffff} />
        <ambientLight intensity={1} />
        {sessionData && textures && (
          <Butterflies
            feedData={feedData}
            selectedObjectLeft={selectedObjectLeft}
            selectedObjectRight={selectedObjectRight}
            textures={textures}
          />
        )}
      </XR>
    </Canvas>
  );
};

export default App;
