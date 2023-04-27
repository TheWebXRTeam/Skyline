import { library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faVrCardboard } from "@fortawesome/free-solid-svg-icons";
import { Box as ContainerBox } from "@mantine/core";
import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Controllers, Hands, Interactive, XR } from "@react-three/xr";
import * as THREE from "three";

import { Text } from "@react-three/drei";
import { RealityAccelerator } from "ratk";
import { RefObject, useEffect, useRef, useState } from "react";
import { BackSide, IcosahedronGeometry, Mesh } from "three";
// import next/dynamic and dynamically load LoginForm instead
import dynamic from "next/dynamic";
const LoginForm = dynamic(() => import("../components/Login"), { ssr: false });

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import skeletonutils
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
// import AR button from react three xr
import Layout from "../components/layouts/article";
import { useLocalStorage } from "../components/useLocalStorage";

library.add(faVrCardboard);
const TWO_PI = 6.28318530718

interface HighlightProps {
	highlightRef: RefObject<Mesh>;
}

const Highlight = ({ highlightRef }: HighlightProps) => {
	return (
		<mesh ref={highlightRef} scale={[1.2, 1.2, 1.2]} visible={false}>
			<icosahedronGeometry args={[0.08, 2]} />
			<meshBasicMaterial color={0xffffff} side={BackSide} />
		</mesh>
	);
};
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

const Balls = ({
	onSelectStart,
	onSelectEnd,
	onHover,
	onBlur,
	onSelectMissed,
}) => {
	const [feedData, setFeedData] = useLocalStorage("feedData", null);
	const textures = useFeedDataTextures(feedData);


	const radius = 0.08;

	const random = (min, max) => Math.random() * (max - min) + min;

	const groups = [];

	useFrame((state, delta) => {
		//GLOBAL tick update
		for(let i = 0; i < groups.length; i++){
		  let bf = groups[i]
		  bf.run(delta)
		}
	});
	
	
	// load a gltf file to be used as geometry
	const gltf = useLoader(GLTFLoader, "butterfly.glb");
	const pfp = useLoader(GLTFLoader, "profilepic.glb");
	const mixers = [];
	const clock = new THREE.Clock();
	
	const balls = !feedData
		? []
		: feedData.map((item, i) => {
			const uniqueKey = `${item.post.author.displayName}-${i}`;
		
		const butterfly = clone(gltf.scene);

		// Clone animations and setup the mixer
		const mixer = new THREE.AnimationMixer(butterfly);
		mixers.push(mixer);
		// make the animation go forward backward
		// butterfly.animations.forEach((clip) => {
		// 	mixer.clipAction(clip).setLoop(THREE.LoopPingPong);
		// });

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
		const {camera} = useThree()
		useEffect(() => {
			if (!groupRef.current) return;
			let g = groupRef.current;
			// console.log("ggggggg", g);
			groups.push(g);
			// randomize the color of the butterfly
			g.init = ()=>{
				g.cv = new THREE.Vector3()
				g.cam = camera
				g.IDLE = 0
				g.STATE = g.IDLE
				g.position.set(random(-2,2),random(0.1,1),random(-2,2))
				g.period = new THREE.Vector3(random(0,1),random(0,1),random(0,1))
				g.initialPosition = g.position.clone()
				g.wanderRadius = 0.1
				g.phase = random(0,TWO_PI)
				g.theta = 0
	
			}
			
			g.init()
			g.multichord= (p,chords,offset,r)=>{
				let val = Math.cos(p+offset)*r
				for(let i = 0; i < chords; i++){
				p*=2
				r*= 0.5
				val += Math.cos(p+offset)*r
				}  
				return val
			}
			g.hover = (d)=>{
				g.avoidCamera(d)

				g.theta += d*0.5
	
				let x = g.multichord(g.theta*g.period.x,4,g.phase,g.wanderRadius)
				let y = g.multichord(g.theta*g.period.y,4,g.phase,g.wanderRadius)
				let z = g.multichord(g.theta*g.period.z,4,g.phase,g.wanderRadius)
	
				x += g.initialPosition.x
				y += g.initialPosition.y
				z += g.initialPosition.z
	
				
				g.position.lerp(new THREE.Vector3(x,y,z),0.1)
			}

			g.avoidCamera = (d)=>{
				
				let gcamposition = new THREE.Vector3()
				g.cam.getWorldPosition(gcamposition)
				gcamposition.sub(g.position)
		
				let theta = Math.atan2(gcamposition.x,gcamposition.z)
				let dt = theta - g.rotation.y
				if(dt > Math.PI) dt -= Math.PI*2
				if(dt < Math.PI) dt += Math.PI*2
				g.rotation.y += dt*0.01

				let camdist = gcamposition.length()
				let avoidDistance = 0.5
				if (camdist < avoidDistance){
					let camMix = 1-THREE.MathUtils.smoothstep(camdist,0,avoidDistance)
					let headavoid = gcamposition.clone()
					headavoid.multiply(new THREE.Vector3(1,0,1))
					headavoid.normalize()
					headavoid.multiplyScalar(camMix*-0.1*d)
					g.cv.add(headavoid)
				}
			}
		
			g.run = (d)=>{
				if(g.STATE == g.IDLE){
					g.hover(d)
				}else if(g.STATE == g.HELD){
					g.seek(d)
				}else{
				
				}
				g.initialPosition.add(g.cv) //add centroid velocity
				g.cv.multiplyScalar(0.9)
		
			}
	
			g.seek = (d)=>{
				g.position.lerp(g.targetPosition,0.2)
			}
			g.grab = ()=>{
				if(g.STATE == g.IDLE)g.STATE = g.HELD
			}
	
			g.release= ()=>{
				if(g.STATE == g.HELD)g.STATE = g.IDLE
			}
			g.setTarget = (t,openness)=>{
				g.targetPosition = t
				//TODO - care about handedness, add an offset to target based on where we should go (or else hands have an offset null and we target that offset null? many ways to skin)
			}		
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

			const base64Texture = textures[i];

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

	return (
		<>
			{balls.map((ball, index) => (
				<Interactive
					key={index + "-interactive"}
					onSelectStart={onSelectStart}
					onSelectEnd={onSelectEnd}
					onHover={onHover}
					onBlur={onBlur}
					onSelectMissed={onSelectMissed}
				>
					{ball}
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
		// THESE ARE THE REFERENCES TO THE THREE.JS STUFF

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
						<ambientLight intensity={0.5} />
						<OrbitControls target={[0, 1.6, 0]} />
						<Stats />
						<Balls
							onSelectStart={onSelectStart}
							onSelectEnd={onSelectEnd}
							onHover={onHover}
							onBlur={onBlur}
							onSelectMissed={onSelectMissed}
						/>
						<Highlight highlightRef={rightHighlight} />
						<Highlight highlightRef={leftHighlight} />
					</XR>
				</Canvas>
			</ContainerBox>
		</Layout>
	);
};

export default App;
