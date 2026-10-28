import * as THREE from 'three';

export function createPlayer(scene) {
    const playerGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    
    const textureLoader = new THREE.TextureLoader();
    const playerTexture = textureLoader.load('./public/textures/player.jpg');
    playerTexture.colorSpace = THREE.SRGBColorSpace;

    const playerMaterial = new THREE.MeshBasicMaterial({ map: playerTexture });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    
    player.position.y = 0.9; 
    scene.add(player);

    player.velocityY = 0;
    player.isJumping = false;

    return player;
}

export function updatePlayer(player, keys, buildings) {
    const speed = 0.1;
    const gravity = 0.008;
    const jumpPower = 0.18;

    // X軸の移動と壁判定
    if (keys.ArrowLeft)  player.position.x -= speed;
    if (keys.ArrowRight) player.position.x += speed;

    let playerBox = new THREE.Box3().setFromObject(player);
    for (const b of buildings) {
        if (playerBox.intersectsBox(b.box3) && (player.position.y - 0.9) < b.topY) {
            if (keys.ArrowLeft)  player.position.x += speed;
            if (keys.ArrowRight) player.position.x -= speed;
        }
    }

    // Z軸の移動と壁判定
    if (keys.ArrowUp)    player.position.z -= speed;
    if (keys.ArrowDown)  player.position.z += speed;

    playerBox.setFromObject(player);
    for (const b of buildings) {
        if (playerBox.intersectsBox(b.box3) && (player.position.y - 0.9) < b.topY) {
            if (keys.ArrowUp)    player.position.z += speed;
            if (keys.ArrowDown)  player.position.z -= speed;
        }
    }

    // ジャンプ処理
    if (keys.Space && !player.isJumping) {
        player.velocityY = jumpPower;
        player.isJumping = true;
    }

    player.velocityY -= gravity;
    player.position.y += player.velocityY;

    let groundY = 0.9;

    // 段差・屋根の着地判定
    for (const b of buildings) {
        const halfW = b.geometry.parameters.width / 2;
        const halfD = b.geometry.parameters.depth / 2;

        if (player.position.x > b.position.x - halfW &&
            player.position.x < b.position.x + halfW &&
            player.position.z > b.position.z - halfD &&
            player.position.z < b.position.z + halfD) {
            
            const roofY = b.topY + 0.9;

            if (player.velocityY <= 0 && player.position.y >= roofY - 0.6 && player.position.y <= roofY + 0.6) {
                if (roofY > groundY) {
                    groundY = roofY;
                }
            }
        }
    }

    if (player.position.y <= groundY) {
        player.position.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
    }
}