/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { forwardRef } from 'react'
import { shadowTexture } from './textures'

// Cheap soft contact shadow (no shadow maps).
export const BlobShadow = forwardRef(function BlobShadow({ size = 1, opacity = 0.32, position = [0, 0.004, 0], sz = 1 }, ref) {
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[1, sz, 1]} renderOrder={1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={shadowTexture()} color="#000000" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
})
