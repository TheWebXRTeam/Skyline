import { library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faVrCardboard } from "@fortawesome/free-solid-svg-icons";
import { Box as ContainerBox } from "@mantine/core";
import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Controllers, Interactive, XR } from "@react-three/xr";
import { RealityAccelerator } from 'ratk';
import { RefObject, useEffect, useRef } from "react";
import { BackSide, IcosahedronGeometry, Mesh } from "three";
import { Avatar } from '../components/Avatar';
import CustomVRButton from "../components/VRButton";
import Layout from "../components/layouts/article";

library.add(faVrCardboard);

interface HighlightProps {
  highlightRef: RefObject<Mesh>;
}

const Highlight = ({ highlightRef }: HighlightProps) => {
  return (
    <mesh ref={highlightRef} scale={[1.2, 1.2, 1.2]} visible={false}>
      <icosahedronBufferGeometry args={[0.08, 2]} />
      <meshBasicMaterial color={0xffffff} side={BackSide} />
    </mesh>
  );
};

const Icosahedrons = ({
  onSelectStart,
  onSelectEnd,
  onHover,
  onBlur,
  onSelectMissed,
}: {
  onSelectStart: (event: any) => void;
  onSelectEnd: (event: any) => void;
  onHover: (event: any) => void;
  onBlur: (event: any) => void;
  onSelectMissed: (event: any) => void;
}) => {
  const radius = 0.08;
  const numInstances = 60;

  const geometry = new IcosahedronGeometry(radius, 2);

  const random = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const icosahedrons = Array.from({ length: numInstances }, (_, i) => (
    <mesh
      key={i}
      position={[random(-2, 2), random(.5, 2), random(-2, 2)]}
      geometry={geometry}
    >
      <meshLambertMaterial color={Math.random() * 0xffffff} />
    </mesh>
  ));

  const arrayOfCubes = Array.from({ length: numInstances }, (_, i) => (
    <mesh
      key={i}
      position={[random(-2, 2), random(.5, 2), random(-2, 2)]}
      geometry={geometry}
    >
      <meshLambertMaterial color={Math.random() * 0xffffff} />
    </mesh>
  ));


  return (
    <>
      {icosahedrons.map((icosahedron, index) => (
        <Interactive
          key={index}
          onSelectStart={onSelectStart}
          onSelectEnd={onSelectEnd}
          onHover={onHover}
          onBlur={onBlur}
          onSelectMissed={onSelectMissed}
        >
          {icosahedron}
        </Interactive>
      ))}
    </>
  );
};

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const rightHighlight = useRef<Mesh>(null!);

  const leftHighlight = useRef<Mesh>(null!);

  const isRightPointingToObject = useRef(false);

  const isLeftPointingToObject = useRef(false);

  const isRightSelectPressed = useRef(false);

  const isLeftSelectPressed = useRef(false);

  // THESE ARE THE REFERENCES TO THE THREE.JS STUF
  const { gl, scene, camera, xr } = useThree();

  useEffect(() => {
    console.log('three.js stuff happening')

    // WRITE THREE.JS CODE HERE

    console.log("three.js scene is", scene)

    console.log('three.js renderer is', gl)

  }, [])
  
  const onSelectStart = (event: any) => {
    const selectedObject = event.intersections[0]?.object;

    const controller = event.target;
    const handedness = controller.inputSource.handedness;

    if (handedness === "left") {
      //check
      isLeftSelectPressed.current = true; //check
      if (isLeftPointingToObject.current) {
        //check
        if (rightHighlight.current.visible) {
          //check
          leftHighlight.current.position.copy(selectedObject.position); //check
          leftHighlight.current.visible = true; //check
          rightHighlight.current.visible = false; //check
        } else if (!rightHighlight.current.visible) {
          //check
          leftHighlight.current.position.copy(selectedObject.position); //check
          leftHighlight.current.visible = true; //check
        }
      } else if (!isLeftPointingToObject.current) {
        if (isRightSelectPressed.current) {
          if (isRightPointingToObject.current) {
            leftHighlight.current.position.copy(selectedObject.position);
            leftHighlight.current.visible = true;
          } else if (!isRightPointingToObject.current) {
            leftHighlight.current.visible = false;
          }
        } else if (!isRightSelectPressed.current) {
          leftHighlight.current.visible = false;
        }
      }
    } else if (handedness === "right") {
      //check
      isRightSelectPressed.current = true; //check
      if (isRightPointingToObject.current) {
        //check
        if (leftHighlight.current.visible) {
          //check
          rightHighlight.current.position.copy(selectedObject.position); //check
          rightHighlight.current.visible = true; //check
          leftHighlight.current.visible = false; //check
        } else if (!leftHighlight.current.visible) {
          //check
          rightHighlight.current.position.copy(selectedObject.position); //check
          rightHighlight.current.visible = true; //check
        }
      } else if (!isRightPointingToObject.current) {
        if (isLeftSelectPressed.current) {
          if (isLeftPointingToObject.current) {
            rightHighlight.current.position.copy(selectedObject.position);
            rightHighlight.current.visible = true;
          } else if (!isLeftPointingToObject.current) {
            rightHighlight.current.visible = false;
          }
        } else if (!isLeftSelectPressed.current) {
          rightHighlight.current.visible = false;
        }
      }
    }
  };

  const onSelectEnd = (event: any) => {
    const selectedObject = event.intersections[0]?.object;

    const controller = event.target;
    const handedness = controller.inputSource.handedness;

    if (handedness === "left") {
      //check
      isLeftSelectPressed.current = false; //check
      if (isLeftPointingToObject.current) {
        //check
        if (isRightSelectPressed.current) {
          //checl
          leftHighlight.current.visible = false; //check
          rightHighlight.current.visible = true; //check
        } else if (!isRightSelectPressed.current) {
          //check
          leftHighlight.current.visible = false; //check
        }
      } else if (!isLeftPointingToObject.current) {
        if (isRightSelectPressed.current) {
          leftHighlight.current.position.copy(selectedObject.position);
          leftHighlight.current.visible = true;
        } else if (!isRightSelectPressed.current) {
          leftHighlight.current.visible = false;
        }
      }
    } else if (handedness === "right") {
      //check
      isRightSelectPressed.current = false; //check
      if (isRightPointingToObject.current) {
        //check
        if (isLeftSelectPressed.current) {
          //check
          rightHighlight.current.visible = false; //check
          leftHighlight.current.visible = true; //check
        } else if (!isLeftSelectPressed.current) {
          //check
          rightHighlight.current.visible = false; //check
          leftHighlight.current.visible = false; //check
        }
      } else if (!isRightPointingToObject.current) {
        if (isLeftSelectPressed.current) {
          rightHighlight.current.position.copy(selectedObject.position);
          rightHighlight.current.visible = true;
        } else if (!isLeftSelectPressed.current) {
          rightHighlight.current.visible = false;
        }
      }
    }
  };

  const onHover = (event: any) => {
    const selectedObject = event.intersections[0]?.object;

    const controller = event.target;
    const handedness = controller.inputSource.handedness;

    if (handedness === "left") {
      isLeftPointingToObject.current = true;
      if (isLeftSelectPressed.current) {
        leftHighlight.current.position.copy(selectedObject.position);
        leftHighlight.current.visible = true;
      } else if (!isLeftSelectPressed.current) {
        leftHighlight.current.visible = false;
      }
    } else if (handedness === "right") {
      isRightPointingToObject.current = true;
      if (isRightSelectPressed.current) {
        rightHighlight.current.position.copy(selectedObject.position);
        rightHighlight.current.visible = true;
      } else if (!isRightSelectPressed.current) {
        rightHighlight.current.visible = false;
      }
    }
  };

  const onBlur = (event: any) => {
    const controller = event.target;
    const handedness = controller.inputSource.handedness;

    if (handedness === "left") {
      isLeftPointingToObject.current = false;
      leftHighlight.current.visible = false;
    } else if (handedness === "right") {
      isRightPointingToObject.current = false;
      rightHighlight.current.visible = false;
    }
  };

  const onSelectMissed = (event: any) => {
    const controller = event.target;
    const handedness = controller.inputSource.handedness;

    if (handedness === "left") {
      if (isLeftSelectPressed.current) {
        if (!isLeftPointingToObject.current) {
          leftHighlight.current.visible = false;
          isLeftSelectPressed.current = false;
        }
      }
    } else if (handedness === "right") {
      if (isRightSelectPressed.current) {
        if (!isRightPointingToObject.current) {
          rightHighlight.current.visible = false;
          isRightSelectPressed.current = false;
        }
      }
    }
  };

  const RatkScene = () => {

    // get a reference to the react-three-fiber renderer
    const { gl, scene } = useThree();
    const ratkObject = new RealityAccelerator(gl.xr);
    scene.add(ratkObject.root); 
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
            <OrbitControls target={[0, 1.6, 0]} />
            <Stats />
            <Icosahedrons
              onSelectStart={onSelectStart}
              onSelectEnd={onSelectEnd}
              onHover={onHover}
              onBlur={onBlur}
              onSelectMissed={onSelectMissed}
            />
            <Highlight highlightRef={rightHighlight} />
            <Highlight highlightRef={leftHighlight} />

            {/* <Physics colliders="hull"> */}
              <Avatar />
             {/* </Physics> */}
          </XR>
        </Canvas>
      </ContainerBox>
    </Layout>
  );
};

export default App;
