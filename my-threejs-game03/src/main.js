import * as THREE from 'three';
import { createWorld } from './World.js';
import { updateTrain } from './Train.js';
import { createPlayer, updatePlayer } from './Player.js';
import { CameraRig } from './CameraRig.js';

// シーン・カメラ・レンダラーの初期化
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    300
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
document.body.appendChild(renderer.domElement);

// ワールドとプレイヤー、カメラリグの生成
const worldData = createWorld(scene);
const player = createPlayer(scene);
const cameraRig = new CameraRig(camera, renderer.domElement);

// キー入力管理
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // V または C キーで TPS と広域俯瞰モードを切り替え
    if ((e.code === 'KeyV' || e.code === 'KeyC') && !e.repeat) {
        cameraRig.toggleMode();
    }

    // G キー：小物のオン／オフ
    if (e.code === 'KeyG' && !e.repeat && worldData.togglePropsVisible) {
        worldData.togglePropsVisible();
    }

    // M キー：拡張マップ（西30x30 + 連絡通路 + 東30x30） ⇄ 西側30x30単体マップ 切替
    if (e.code === 'KeyM' && !e.repeat && worldData.toggleMapExpanded) {
        worldData.toggleMapExpanded();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});



// メインループ
function animate() {
    requestAnimationFrame(animate);

    if (worldData.train) {
        updateTrain(worldData.train);
    }

    updatePlayer(player, keys, worldData, cameraRig.currentYaw);
    cameraRig.update(player, keys);

    renderer.render(scene, camera);
}

animate();