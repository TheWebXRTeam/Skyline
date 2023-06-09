import { Box as ContainerBox } from "@mantine/core";
import { Text } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Controllers, Hands, XR, useController, useXR } from "@react-three/xr";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  AnimationMixer,
  Color,
  MathUtils,
  Mesh,
  Object3D,
  Vector3,
} from "three";
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
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 100000,
        }}
      >
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

  const clipActions = [];

  if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((animation) => {
      clipActions.push(mixer.clipAction(animation));
      mixer.clipAction(animation).play();
      // add an offset to the animation
      mixer.clipAction(animation).time = MathUtils.randFloat(
        0,
        animation.duration
      );
    });
  }
  clipActions[0].paused = false;
  clipActions[1].paused = true;

  //useframe to update the animation mixer (from @react-three/fiber)
  useFrame((state, delta) => {
    //if (groupRef.current) groupRef.current.run(delta);
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
      g.DEAD = 1;
      g.RESPAWNING = 2;
      g.HELD = 3;
      g.STATE = g.DEAD
      g.initializePosition()
      g.period = new Vector3(random(0, 1), random(0, 1), random(0, 1));
      g.wanderRadius = 0.1;
      g.phase = random(0, TWO_PI);
      g.theta = 0;
      g.foundDepencies = false
      
      // g.feedBackground = g.getObjectByName("looker")
      // g.postParent = g.getObjectByName("postParent")  
      // g.feed = g.postParent.getObjectByName("feed")
      // g.feedBackground = g.postParent.getObjectByName("feedBackground")

      // let feedBB = g.feed.geometry.boundingBox
      // let feedwidth = Math.abs(feedBB.min.x-feedBB.max.x)
      // let feedheight =  Math.abs(feedBB.min.y-feedBB.max.y)
      // console.log("feed bg: ". g.feed);
      // g.feedBackground.scale.set(feedwidth+0.1,feedheight+0.1,1)
      // g.feed.position.x = -feedwidth/2

      // g.feedBackground.position.y = -feedheight/2
      // g.feed.position.y = -feedheight/2

      // g.postParent.visible = false
      
    };

    g.checkForDependencies = ()=>{

      g.postParent = g.getObjectByName("postParent")  
      if(g.postParent){
        g.feed = g.postParent.getObjectByName("feed")
        if(g.feed){          
          g.feedBackground = g.postParent.getObjectByName("feedBackground")           
          if(g.feedBackground){
            setTimeout(function(){
              let feedBB = g.feed.geometry.boundingBox
              let feedwidth = Math.abs(feedBB.min.x-feedBB.max.x)
              let feedheight =  Math.abs(feedBB.min.y-feedBB.max.y)
              g.feedBackground.scale.set(feedwidth+0.1,feedheight+0.1,1)
              g.feed.position.x = -feedwidth/2
  
              g.feedBackground.position.y = -feedheight/2
              g.feed.position.y = -feedheight/2
              console.log("found my dependences")
              g.postParent.visible = true
              g.foundDependencies = true

            },1000)
            

          }        
          
        }

      }

      
      
    }

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

      g.theta += d *  0.5;

      let x = g.multichord(g.theta * g.period.x, 4, g.phase, g.wanderRadius);
      let y = g.multichord(g.theta * g.period.y, 4, g.phase, g.wanderRadius);
      let z = g.multichord(g.theta * g.period.z, 4, g.phase, g.wanderRadius);

      x += g.initialPosition.x;
      y += g.initialPosition.y;
      z += g.initialPosition.z;
      
      g.position.lerp(new Vector3(x, y, z), 0.1);
    };

    g.triggerMoveToPlane = () => {
      if (Math.random() > 0.001) return; 
	
      if (g.atWall) {
	console.log("go back..");
	g.atWall = false;

	clipActions[0].paused = false;
	clipActions[1].paused = true;

	g.wallTarget = null;
	g.targetPosition = new Vector3(random(-2, 2), random(-0.25,0.25), random(-2, 2));
      } else {

        const ratk = scene.getObjectByName("ratk");
        if (!ratk) return;
        const planes = ratk.children as Object3D[];
        if (planes.length < 1) return;

        const planeIndex = Math.floor(Math.random() * planes.length);

        // ugly hack. sometimes the plane position is created, but matrixWorld is not updated yet. so skip
        const zeroPos = new Vector3(0, 0, 0);
        zeroPos.applyMatrix4(planes[planeIndex].matrixWorld);
        if (zeroPos.x == 0 && zeroPos.y == 0 && zeroPos.z == 0) return;

        const planeHeight = (planes[planeIndex] as any).boundingRectangleHeight;
        const planeWidth = (planes[planeIndex] as any).boundingRectangleWidth;

        const posX = Math.random() * planeWidth - planeWidth / 2;
        const posZ = Math.random() * planeHeight - planeHeight / 2;

        const pos = new Vector3(posX, 0, posZ);

        pos.applyMatrix4(planes[planeIndex].matrixWorld);

        g.wallTarget = new Vector3(pos.x, pos.y, pos.z);
      }
    };
    g.checkEaten = (distanceToCamera)=>{
      if (distanceToCamera < 0.15) {
        console.log("eating");
        // play a sound
        const audio = new Audio("/eat.mp3");
        audio.play();
        g.STATE = g.DEAD        
        g.disappear()
      }

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
      g.checkEaten(camdist)
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
    g.initializePosition = ()=>{      
      g.position.set(random(-2, 2), random(-0.25,0.25), random(-2, 2));
      g.scale.set(0,0,0)
      g.initialPosition = g.position.clone();
      g.fade = 0  
      // g.postParent.scale.set(0,0,0) 
      // g.postParent.visible = false
    }

    g.disappear=()=>{
      g.scale.set(0,0,0)
      g.fadeIn = false
      g.position.set(g.position.x,10,g.position.z)
    }
    g.runFade = ()=>{
        g.fade += 0.01
        if(g.fade > 1){
          g.fade = 1
          g.fadeIn = false
          g.STATE = g.IDLE
        }
        let s = Math.max(0,g.fade)
        g.scale.set(s,s,s) 
      
    }
    g.updatePost = ()=>{
      if(g.STATE == g.HELD){ 
        g.postParent.scale.set(1,1,1)
      }else{     
        g.postParent.scale.set(0,0,0)
      }
    }
    g.run = (d) => {
      if(!g.foundDependencies)g.checkForDependencies()
      else g.updatePost()
      if (g.STATE == g.IDLE) {
        g.triggerMoveToPlane();
        if (g.wallTarget) {
          g.moveToPlane();
        } else {
          g.hover(d);
      }
      } else if (g.STATE == g.HELD) {
        g.seek(d);
      } else if(g.STATE == g.DEAD){
        if(Math.random() < 0.001){
          console.log("respawning")
          g.STATE = g.RESPAWNING
          g.initializePosition()
        }
      } else if(g.STATE == g.RESPAWNING){
        g.hover(d); 
        g.runFade()
      }
      g.avoidCamera(d);

      if(g.STATE != g.HELD)g.initialPosition.add(g.cv); //add centroid velocity
      g.cv.multiplyScalar(0.9);
    };

    g.moveToPlane = (d) => {
      if (g.wallTarget) {

        let dv = g.wallTarget.clone()
        dv.sub(g.position)
        dv.multiplyScalar(0.02)
        dv.clampLength(0,0.005)
        g.position.add(dv)
        // g.position.lerp(g.wallTarget, 0.02);
      if (g.wallTarget.distanceTo(g.position) < 0.1) {
        g.atWall = true;
        clipActions[0].paused = true;
        clipActions[1].paused = false;
      }
      }
    };

    g.seek = (d) => {
      g.position?.lerp(g.targetPosition, 0.1);
    };

    g.release = () => {
      if (g.STATE == g.HELD) {
        // g.postParent.visible = false
        //TODO actually evaluate what state to transition to? Make sure we can't hurt state machine
        g.STATE = g.IDLE;
      }
    };
    g.setTarget = (t, openness) => {
      // g.postParent.visible = true
      if(g.STATE == g.IDLE)g.STATE = g.HELD
      //track grabbedness here
      g.targetPosition = t;
      //TODO - care about handedness, add an offset to target based on where we should go (or else hands have an offset null and we target that offset null? many ways to skin)
    };
    g.init();
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
      // pfpRef.current.lookAt(camera.position);
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
          <group
          key={`${uniqueKey}-looker`}
          name={"looker"}>            
            <group          
            position={[0, -0.2, -0.03]}
            rotation={[-Math.PI/12,0,0]}
            key={`${uniqueKey}-postParent`}
            name={"postParent"}>
              
            <Text
              key={`${uniqueKey}-text1`}
              name={"feed"}
              position={[0, 0, 0.005]} // TODO: might want to offset Z a bit

              fontSize={0.03}
              maxWidth={0.3}
              lineHeight={1.3}
              letterSpacing={0.02}
              anchorX={0}
              // @ts-ignore
              wrap={0.1}
              height={0.1}
              color={0xffffff}
              textAlign={"center"}
              outlineWidth={0.001}
              outlineColor={0x000000}
            >
              {item?.post?.author?.displayName + ":\n" + item.post.record.text}
            </Text>
            {/* <Text
              key={`${uniqueKey}-text2`}
              name={"likes"}
              position={[0,0,0]} // TODO: might want to offset Z a bit
              fontSize={0.03}
              maxWidth={0.4}
              lineHeight={1.3}
              letterSpacing={0.02}
              depthOffset={-1}
              anchorX={0}
              // @ts-ignore
              wrap={0.1}
              height={0.1}
              color={0xffffff}
              textAlign={"center"}
              outlineWidth={0.001}
              outlineColor={0x000000}
            >
              {likeCount + "\n" + (likeCount === 1 ? "like" : "likes")}
            </Text> */}

            <mesh
              key={`${uniqueKey}-mesh`}
              geometry={pfpGeometry}// TODO: might want to offset Z a bit
              name={"feedBackground"}
              visible={true}
              ref={pfpRef}
            >
              <meshBasicMaterial
                key={`${uniqueKey}-material`}
                color={0x000000}
                transparent={true}
              />
              <planeBufferGeometry
                key={`${uniqueKey}-geometry`}
                attach="geometry"
                args={[1, 1]}
              />
            </mesh>
            </group>
          </group>
          <mesh
            geometry={pfpGeometry}
            scale={[0.07, 0.07, 0.07]}
            position={[0, 0, 0.04]}
          >
            <meshStandardMaterial
              map={base64Texture}
              emissiveMap={base64Texture}
              emissive={new Color(0.2, 0.2, 0.5)}
            />
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
  const { scene, camera } = useThree();
  const groupsRef = useRef([]);

  const leftController = useController("left");
  const rightController = useController("right");

  //const groups = [];
  const groups = groupsRef.current;

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

  let leftOffset = null;
  let rightOffset = null;

  useFrame((state, delta) => {
    if (!leftController) return;
    if (!rightController) return;

    // Grabbing
    if (selectedObjectLeft.current && selectedObjectRight.current) {
      // Grabbing the same object
      if (selectedObjectLeft.current === selectedObjectRight.current) {
        // selectedObjectLeft.current.grab();
      } else {
        // Grabbing different objects
      }
    }
    // one hand is grabbing
    else if (
      (!selectedObjectLeft.current && selectedObjectRight.current) ||
      (selectedObjectLeft.current && !selectedObjectRight.current)
    ) {
      const isLeftHand =
        selectedObjectLeft.current && !selectedObjectRight.current;

      console.log("one hand grabbing");
      // one hand is grabbing
      const grabbingHand = isLeftHand ? leftController : rightController;
      const selectedObject = isLeftHand
        ? selectedObjectLeft.current
        : selectedObjectRight.current;

      const grabbingHandPosition = grabbingHand.controller.position;

      // calculate the difference between the startGrabPosition and the object
      if (isLeftHand && !leftOffset) {
        leftOffset = grabbingHandPosition.clone().sub(selectedObject.position);
      } else if (!isLeftHand && !rightOffset) {
        rightOffset = grabbingHandPosition.clone().sub(selectedObject.position);
      }

      // check if selectedObjectLeft is a butterfly
      if (isLeftHand) {
        selectedObjectLeft.current.setTarget(grabbingHandPosition.clone(),0)
        // TODO: do we want this?
        // selectedObjectLeft.current.position.copy(
        //   grabbingHandPosition
        //     .clone()
        //     .sub(isLeftHand ? leftOffset : rightOffset)
        // );
      }
      /// check if selectedObjectRight is a butterfly
      else {
        // if so, set the target position to the grabbing hand position
        selectedObjectRight.current.setTarget(grabbingHandPosition.clone(),0)
        // TODO: do we want this?

        // selectedObjectRight
        // selectedObjectRight.current.position.copy(
        //   grabbingHandPosition
        //     .clone()
        //     .sub(isLeftHand ? leftOffset : rightOffset)
        // );
      }

      // check for distance to camera for eating
      const distanceToCamera = grabbingHandPosition.distanceTo(camera.position);

    } else if (!selectedObjectLeft.current && !selectedObjectRight.current) {
      leftOffset = null;
      rightOffset = null;
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
        if (!nearestGroup) return;
        console.log("nearest group", nearestGroup);
        selectedObjectLeft.current = nearestGroup;
        lastLeftGroup = nearestGroup;
        // nearestGroup.children.forEach((child, i) => {
        //   if (child.name?.includes("feed")) child.visible = true;
        // });
      } else if (inputSource.handedness === "right") {
        const nearestGroup = getGroup(rightController.controller.position);
        if (!nearestGroup) return;
        console.log("nearest group", nearestGroup);
        selectedObjectRight.current = nearestGroup;
        lastRightGroup = nearestGroup;
        // nearestGroup.children.forEach((child, i) => {
        //   if (child.name?.includes("feed")) child.visible = true;
        // });
      }

      //
    };

    const selectEndListener = (event) => {
      const inputSource = event.inputSource;

      if (inputSource.handedness === "left") {
        console.log("left hand deselected");
        selectedObjectLeft.current.release()
        selectedObjectLeft.current = null;
        lastLeftGroup?.children.forEach((child, i) => {
          if (child.name?.includes("feed")) child.visible = false;
        });
      } else if (inputSource.handedness === "right") {
        console.log("left hand deselected");
        selectedObjectRight.current.release()
        selectedObjectRight.current = null;

        lastRightGroup?.children.forEach((child, i) => {
          if (child.name?.includes("feed")) child.visible = false;
        });
      }

      //
    };
    session.addEventListener("selectstart", selectStartListener);
    session.addEventListener("selectend", selectEndListener);
    session.addEventListener("pinchstart", selectStartListener);
    session.addEventListener("pinchend", selectEndListener);

    const ratk = scene.getObjectByName("ratk");
    if (!ratk) return;

    const planes = ratk.children;
    console.log("planes", planes);

    return () => {
		session.removeEventListener("selectstart", selectStartListener);
		session.removeEventListener("selectend", selectEndListener);
		session.removeEventListener("pinchstart", selectStartListener);
		session.removeEventListener("pinchend", selectEndListener);
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
