import * as THREE from 'three';
import { createWorld } from './World.js';
import { createPlayer, updatePlayer } from './Player.js';

// シーン、カメラ、レンダラーの初期化
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 世界とプレイヤーを配置
createWorld(scene);
const player = createPlayer(scene);

// キーボード入力を監視する仕組み
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// ウィンドウサイズが変わったときの処理
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 毎フレームのループ処理
function animate() {
    requestAnimationFrame(animate);

    // プレイヤーの動きを更新
    updatePlayer(player, keys);

    // 描画
    renderer.render(scene, camera);
}

animate();