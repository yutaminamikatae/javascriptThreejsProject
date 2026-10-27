import * as THREE from 'three';

// プレイヤーの作成
export function createPlayer(scene) {
    const playerGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8); // 縦長の直方体
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 }); // 緑色の見た目
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    
    // 足元が地面に付くように高さ調整
    player.position.y = 0.9; 
    scene.add(player);

    return player;
}

// プレイヤーの移動ロジック
export function updatePlayer(player, keys) {
    const speed = 0.1; // ★ここを変えると移動スピードが変わる！

    if (keys.ArrowUp)    player.position.z -= speed;
    if (keys.ArrowDown)  player.position.z += speed;
    if (keys.ArrowLeft)  player.position.x -= speed;
    if (keys.ArrowRight) player.position.x += speed;
}