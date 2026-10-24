// rPPG 실험실용 WASM 런타임을 node_modules → public/vendor 로 복사 (git 미추적, dev/build 직전 실행).
// 외부 CDN 없이 자체 서빙 — 영상·데이터가 기기 밖으로 나가지 않는 원칙 유지 + 오프라인 동작.
import { copyFileSync, mkdirSync } from 'node:fs'

const copies = [
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs', 'public/vendor/ort/'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', 'public/vendor/ort/'],
  ['node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js', 'public/vendor/mediapipe/'],
  ['node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm', 'public/vendor/mediapipe/'],
]

for (const [src, dir] of copies) {
  mkdirSync(dir, { recursive: true })
  copyFileSync(src, dir + src.split('/').pop())
}
console.log(`rPPG WASM 자산 ${copies.length}개 복사 → public/vendor/`)
