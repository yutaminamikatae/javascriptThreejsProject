import * as THREE from 'three';

const PLAYER_HALF_HEIGHT = 0.9;
const PLAYER_RADIUS = 0.4;
const MOVE_SPEED = 0.14;
const JUMP_VELOCITY = 0.24;
const GRAVITY = 0.011;
const FALL_RESPAWN_Y = -12;
const DEFAULT_PLAYER_TEXTURE = './public/textures/player.png';

function createPlayerMaterial(texturePath) {
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff
    });

    if (!texturePath) {
        material.color.setHex(0x38bdf8);
        return material;
    }

    const loader = new THREE.TextureLoader();
    const texture = loader.load(
        texturePath,
        (loadedTex) => {
            loadedTex.colorSpace = THREE.SRGBColorSpace;
            material.map = loadedTex;
            material.color.setHex(0xffffff);
            material.needsUpdate = true;
        },
        undefined,
        () => {
            // 画像が見つからない場合は単色カラーへフォールバック
            material.map = null;
            material.color.setHex(0x38bdf8);
            material.needsUpdate = true;
        }
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;

    return material;
}

function createSixFacePlayerMaterials(textures) {
    const loader = new THREE.TextureLoader();
    return textures.map((path) => {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        if (!path) {
            mat.color.setHex(0x38bdf8);
            return mat;
        }
        const tex = loader.load(
            path,
            (loadedTex) => {
                loadedTex.colorSpace = THREE.SRGBColorSpace;
                mat.map = loadedTex;
                mat.color.setHex(0xffffff);
                mat.needsUpdate = true;
            },
            undefined,
            () => {
                mat.map = null;
                mat.color.setHex(0x38bdf8);
                mat.needsUpdate = true;
            }
        );
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        return mat;
    });
}

export function createPlayer(scene, options = {}) {
    const geometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);

    // 6面配列（options.textures）が渡された場合は6面個別、それ以外は単一画像（options.texturePath）
    const materialOrMaterials = Array.isArray(options.textures) && options.textures.length === 6
        ? createSixFacePlayerMaterials(options.textures)
        : createPlayerMaterial(options.texturePath ?? DEFAULT_PLAYER_TEXTURE);

    const mesh = new THREE.Mesh(geometry, materialOrMaterials);

    const startX = typeof options.startX === 'number' ? options.startX : 0;
    const startZ = typeof options.startZ === 'number' ? options.startZ : 0;

    mesh.position.set(startX, PLAYER_HALF_HEIGHT, startZ);
    mesh.velocityY = 0;
    mesh.isJumping = false;

    if (scene) {
        scene.add(mesh);
    }
    return mesh;
}

// 拡張マップ（西30x30 + 連絡通路10x10 + 東30x30）または西側単体マップ（西30x30）の地面判定
export function isOverMapGround(x, z, isMapExpanded = true) {
    const inWestSquare = x >= -15 && x <= 15 && z >= -15 && z <= 15;
    if (!isMapExpanded) {
        return inWestSquare;
    }

    const inBridge     = x >= 15  && x <= 25 && z >= -5  && z <= 5;
    const inEastSquare = x >= 25  && x <= 55 && z >= -15 && z <= 15;

    return inWestSquare || inBridge || inEastSquare;
}

// 段差・上り段差の床高さを取得
// ・depthY > 0（下り段差・窪み）：-depthY
// ・heightY > 0（1段上の段差）：+heightY
function getTerrainFloorY(x, z, pits = []) {
    if (!Array.isArray(pits) || pits.length === 0) return 0;

    let floorY = 0;

    for (const pit of pits) {
        if (!pit) continue;
        const px = pit.positionX ?? pit.x ?? 0;
        const pz = pit.positionZ ?? pit.z ?? 0;
        const halfW = (pit.width ?? 6) / 2;
        const halfD = (pit.depth ?? 5) / 2;

        const insideX = Math.abs(x - px) < halfW - PLAYER_RADIUS * 0.4;
        const insideZ = Math.abs(z - pz) < halfD - PLAYER_RADIUS * 0.4;

        if (!insideX || !insideZ) continue;

        if ((pit.heightY ?? 0) > 0) {
            floorY = Math.max(floorY, pit.heightY);
        } else if ((pit.depthY ?? 0) > 0) {
            floorY = Math.min(floorY, -Math.abs(pit.depthY));
        }
    }

    return floorY;
}

// ビル群の屋上着地・側面衝突判定
function resolveBuildingCollisions(player, buildings = [], prevFeetY = 0) {
    if (!Array.isArray(buildings) || buildings.length === 0) {
        return false;
    }

    let currFeetY = player.position.y - PLAYER_HALF_HEIGHT;
    let landedOnRoof = false;

    for (const building of buildings) {
        if (!building || !building.position) continue;

        const params = building.geometry?.parameters ?? null;
        const width = typeof building.width === 'number' ? building.width : (params?.width ?? 0);
        const depth = typeof building.depth === 'number' ? building.depth : (params?.depth ?? 0);
        const height = typeof building.height === 'number' ? building.height : (params?.height ?? 0);

        if (width <= 0 || depth <= 0) continue;

        const halfW = width / 2;
        const halfD = depth / 2;
        const topY = typeof building.topY === 'number'
            ? building.topY
            : (building.position.y + height / 2);

        const minX = building.position.x - halfW - PLAYER_RADIUS;
        const maxX = building.position.x + halfW + PLAYER_RADIUS;
        const minZ = building.position.z - halfD - PLAYER_RADIUS;
        const maxZ = building.position.z + halfD + PLAYER_RADIUS;

        const insideXZ =
            player.position.x > minX &&
            player.position.x < maxX &&
            player.position.z > minZ &&
            player.position.z < maxZ;

        if (!insideXZ) continue;

        const velY = typeof player.velocityY === 'number' ? player.velocityY : 0;

        const isDescendingOntoRoof =
            velY <= 0 &&
            prevFeetY >= topY - 0.35 &&
            currFeetY <= topY + 0.05;

        const isStandingOnRoof =
            !player.isJumping &&
            Math.abs(currFeetY - topY) <= 0.08;

        if (isDescendingOntoRoof || isStandingOnRoof) {
            player.position.y = topY + PLAYER_HALF_HEIGHT;
            currFeetY = topY;
            player.velocityY = 0;
            player.isJumping = false;
            landedOnRoof = true;
            continue;
        }

        if (currFeetY < topY - 0.08) {
            const overlapLeft = Math.abs(player.position.x - minX);
            const overlapRight = Math.abs(maxX - player.position.x);
            const overlapBack = Math.abs(player.position.z - minZ);
            const overlapFront = Math.abs(maxZ - player.position.z);

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapZ = Math.min(overlapBack, overlapFront);

            if (minOverlapX < minOverlapZ) {
                player.position.x = overlapLeft < overlapRight ? minX : maxX;
            } else {
                player.position.z = overlapBack < overlapFront ? minZ : maxZ;
            }
        }
    }

    return landedOnRoof;
}

// 電車（+X 方向進行・X ループ対応）の乗車連動・ワープ追従処理
function resolveTrainInteraction(player, train) {
    if (!train || !train.position) return false;

    const halfW = 8 / 2;
    const halfD = 4 / 2;
    const prevX = typeof train.prevX === 'number' ? train.prevX : train.position.x;
    const prevZ = typeof train.prevZ === 'number' ? train.prevZ : train.position.z;

    const insideTrainX = Math.abs(player.position.x - train.position.x) < halfW;
    const insideTrainZ = Math.abs(player.position.z - train.position.z) < halfD;
    const playerFeetY = player.position.y - PLAYER_HALF_HEIGHT;
    const isRiding = insideTrainX && insideTrainZ && playerFeetY >= -0.25 && playerFeetY < 1.5;

    // 東側終点（52付近）から西側始点（-13付近）へワープした瞬間を検知
    const trainWarped = prevX > 48 && train.position.x < -8;

    if (trainWarped) {
        const distFromPrevX = Math.abs(player.position.x - prevX);
        if (insideTrainZ && distFromPrevX < halfW && playerFeetY >= -0.25 && playerFeetY < 1.5) {
            const offsetX = player.position.x - prevX;
            const offsetZ = player.position.z - train.position.z;

            player.position.x = train.position.x + offsetX;
            player.position.z = train.position.z + offsetZ;
            player.position.y = PLAYER_HALF_HEIGHT + 0.05;
            player.velocityY = 0;
            player.isJumping = false;
            return true;
        }
    }

    if (isRiding) {
        const trainDeltaX = train.position.x - prevX;
        const trainDeltaZ = train.position.z - prevZ;

        player.position.x += trainDeltaX;
        player.position.z += trainDeltaZ;

        if (player.position.y < PLAYER_HALF_HEIGHT + 0.05) {
            player.position.y = PLAYER_HALF_HEIGHT + 0.05;
            player.velocityY = 0;
            player.isJumping = false;
        }
        return true;
    }

    return false;
}

export function updatePlayer(player, keys = {}, worldData = {}, cameraYaw = 0) {
    if (!player || !player.position) return;

    const safeWorld = worldData && typeof worldData === 'object' ? worldData : {};
    const isExpanded = safeWorld.isMapExpanded ?? true;

    if (typeof player.velocityY !== 'number') player.velocityY = 0;
    if (typeof player.isJumping !== 'boolean') player.isJumping = false;

    const prevFeetY = player.position.y - PLAYER_HALF_HEIGHT;

    // 1. 水平移動入力（cameraYaw 基準）
    let screenRight = 0;
    let screenForward = 0;

    if (keys['KeyA'] || keys['ArrowLeft'])  screenRight -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) screenRight += 1;
    if (keys['KeyW'] || keys['ArrowUp'])    screenForward += 1;
    if (keys['KeyS'] || keys['ArrowDown'])  screenForward -= 1;

    if (screenRight !== 0 || screenForward !== 0) {
        const len = Math.hypot(screenRight, screenForward);
        const rx = screenRight / len;
        const fz = screenForward / len;

        const rightX = Math.cos(cameraYaw);
        const rightZ = -Math.sin(cameraYaw);
        const fwdX = -Math.sin(cameraYaw);
        const fwdZ = -Math.cos(cameraYaw);

        player.position.x += (rx * rightX + fz * fwdX) * MOVE_SPEED;
        player.position.z += (rx * rightZ + fz * fwdZ) * MOVE_SPEED;
    }

    // 2. ジャンプ入力
    if (keys['Space'] && !player.isJumping) {
        player.velocityY = JUMP_VELOCITY;
        player.isJumping = true;
    }

    // 3. 重力適用
    player.velocityY -= GRAVITY;
    player.position.y += player.velocityY;

    // 4. ビル屋上着地・側面衝突判定
    const onRoof = resolveBuildingCollisions(player, safeWorld.buildings, prevFeetY);

    // 5. 電車との連動・ワープ追従判定
    const onTrain = resolveTrainInteraction(player, safeWorld.train);

    // 6. 地面・段差（1段上 / 1段下 / 2段下）着地判定
    if (!onRoof && !onTrain) {
        const hasGround = isOverMapGround(player.position.x, player.position.z, isExpanded);
        if (hasGround) {
            const terrainFloorY = getTerrainFloorY(player.position.x, player.position.z, safeWorld.pits);
            const targetCenterY = terrainFloorY + PLAYER_HALF_HEIGHT;

            if (player.position.y <= targetCenterY && player.velocityY <= 0) {
                player.position.y = targetCenterY;
                player.velocityY = 0;
                player.isJumping = false;
            }
        }
    }

    // 7. 落下復帰
    if (player.position.y < FALL_RESPAWN_Y) {
        player.position.set(0, PLAYER_HALF_HEIGHT + 0.1, 0);
        player.velocityY = 0;
        player.isJumping = false;
    }
}