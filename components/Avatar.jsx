import React, { useEffect } from 'react'
import { useFBX } from '@react-three/drei'
import { useZustand } from '../lib/store/useZustand'
import { customDebug } from '../lib/utils/custom.debug'
import { useVrm } from '../lib/hooks/useVrm'
import { useVrmMixamoAnimations } from '../lib/hooks/useVrmMixamoAnimations'
import { useFrame } from '@react-three/fiber'
import { BlinkManager } from '../lib/utils/blink.manager'
import { WATCH_BONE_NAME } from '../lib/utils/constants'


export const Avatar = () => {
  const {
    avatarInitPos,
    setAvatarVrm,
  } = useZustand()
  const avatarVrm = useVrm('/models/pixel.vrm')
  customDebug().log('Avatar: avatarVrm: ', avatarVrm)

  const fbx = useFBX('/models/idle.fbx')
  customDebug().log('Avatar: fbx: ', fbx)

  const { mixer, mixamoClip } = useVrmMixamoAnimations(avatarVrm, fbx.animations, [WATCH_BONE_NAME])
  customDebug().log('Avatar: mixer: ', mixer)
  customDebug().log('Avatar: mixamoClip: ', mixamoClip)


  useEffect(() => {
    if (!avatarVrm) {
      return
    }
    customDebug().log('Avatar#useEffect')
    const newBlinkManager = new BlinkManager()
    newBlinkManager.addBlinker(avatarVrm)
    setAvatarVrm(avatarVrm)
  }, [avatarVrm])


  useEffect(() => {
    if (!mixer || !mixamoClip) {
      return
    }
    customDebug().log('Avatar: call at once');
    mixer.timeScale = 1;
    mixer.clipAction(mixamoClip).play();
  }, [mixer, mixamoClip])


  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta)
    }
  })


  return avatarVrm && avatarVrm.scene && (
    <primitive
      object={avatarVrm.scene}
      position={avatarInitPos}
    />
  )
}
