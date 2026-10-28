import * as THREE from 'three';
// ★カメラ操作用のOrbitControlsをインポート
import { OrbitControls } from '../js/libs/OrbitControls.js';

import { createWorld } from './World.js';
import { createPlayer, updatePlayer } from './Player.js';

// シーン（空間）の作成
const scene = new THREE.Scene();

// カメラの設定
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 15);

// レンダラーの設定
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ★OrbitControlsの追加（マウス操作でカメラを動かせるようにする）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // カメラの動きに滑らかな慣性（ヌルッとした動き）をつける
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // カメラが地面の下に潜り込まないように制限

// 環境光（ライト）
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

// 世界とプレイヤーの生成
const buildings = createWorld(scene);
const player = createPlayer(scene);

// キーボード入力の状態管理
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.ArrowUp = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.ArrowDown = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = true;
    if (e.key === ' ' || e.code === 'Space') keys.Space = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.ArrowUp = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.ArrowDown = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = false;
    if (e.key === ' ' || e.code === 'Space') keys.Space = false;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    // プレイヤーの移動処理
    updatePlayer(player, keys, buildings);

    // ★カメラの操作状態を更新（Dampingを有効にしているため必要）
    controls.update();

    renderer.render(scene, camera);
}

animate();