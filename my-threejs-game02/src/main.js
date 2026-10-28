import * as THREE from 'three';
import { createWorld } from './World.js';
import { createPlayer, updatePlayer } from './Player.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 15); // 少しカメラを引いて全体を見やすくする
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 世界（地面と建物）を作る。建物のリストを受け取る
const buildings = createWorld(scene);
const player = createPlayer(scene);

// キーボード入力を監視（Spaceキーを追加）
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') keys.ArrowUp = true;
    if (e.key === 'ArrowDown' || e.key === 's') keys.ArrowDown = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.ArrowLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.ArrowRight = true;
    if (e.key === ' ' || e.code === 'Space') keys.Space = true; // スペースキー
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') keys.ArrowUp = false;
    if (e.key === 'ArrowDown' || e.key === 's') keys.ArrowDown = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.ArrowLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.ArrowRight = false;
    if (e.key === ' ' || e.code === 'Space') keys.Space = false;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.sessionId = renderer.setSize(window.innerWidth, window.innerHeight);
});

// 毎フレームのループ
function animate() {
    requestAnimationFrame(animate);

    // プレイヤーの動きと衝突判定を更新
    updatePlayer(player, keys, buildings);

    renderer.render(scene, camera);
}

animate();