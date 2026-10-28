import * as THREE from 'three';
import { OrbitControls } from '../js/libs/OrbitControls.js';

import { CONFIG } from './config.js';
import { createWorld } from './World.js';
import { updateTrain } from './Train.js'; // ★電車の更新関数をインポート
import { createPlayer, updatePlayer } from './Player.js';

// シーン・カメラ・レンダラーの設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// カメラコントロール
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// 環境光
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

// 世界・電車・プレイヤーの生成
const { buildings, train } = createWorld(scene); // ★建物と電車を受け取る
const player = createPlayer(scene);

let isTPSMode = CONFIG.initialTPS;

// キー入力の状態管理
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    Space: false
};

window.addEventListener('keydown', (e) => {
    if (['w', 'W', 'ArrowUp'].includes(e.key)) keys.ArrowUp = true;
    if (['s', 'S', 'ArrowDown'].includes(e.key)) keys.ArrowDown = true;
    if (['a', 'A', 'ArrowLeft'].includes(e.key)) keys.ArrowLeft = true;
    if (['d', 'D', 'ArrowRight'].includes(e.key)) keys.ArrowRight = true;
    if (e.key === ' ' || e.code === 'Space') keys.Space = true;

    if (e.key.toLowerCase() === CONFIG.tpsToggleKey.toLowerCase()) {
        isTPSMode = !isTPSMode;
    }
});

window.addEventListener('keyup', (e) => {
    if (['w', 'W', 'ArrowUp'].includes(e.key)) keys.ArrowUp = false;
    if (['s', 'S', 'ArrowDown'].includes(e.key)) keys.ArrowDown = false;
    if (['a', 'A', 'ArrowLeft'].includes(e.key)) keys.ArrowLeft = false;
    if (['d', 'D', 'ArrowRight'].includes(e.key)) keys.ArrowRight = false;
    if (e.key === ' ' || e.code === 'Space') keys.Space = false;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ゲームループ
function animate() {
    requestAnimationFrame(animate);

    // 1. 電車を周回移動させる
    updateTrain(train);

    // 2. プレイヤーの移動処理（電車との当たり判定・同乗移動を含む）
    updatePlayer(player, keys, buildings, CONFIG, camera, train);

    // 3. カメラの追従処理
    controls.enabled = true;
    const targetPosition = new THREE.Vector3(
        player.position.x,
        player.position.y + 1.0,
        player.position.z
    );

    if (isTPSMode) {
        const deltaTarget = targetPosition.clone().sub(controls.target);
        camera.position.add(deltaTarget);
        controls.target.copy(targetPosition);
    } else {
        controls.target.copy(targetPosition);
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();