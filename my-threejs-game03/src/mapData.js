export const DEFAULT_GROUND_TEXTURE = './public/textures/ground.jpg';
export const DEFAULT_WALL_TEXTURE = './public/textures/wall.jpg';

export const TILE_LEGEND = {
    '.': './public/textures/ground.jpg',
    'R': './public/textures/road_straight.jpg',
    'C': './public/textures/road_corner.jpg',
    'T': './public/textures/rail_tile.jpg',
    'P': './public/textures/sidewalk_tile.jpg'
};

// 地面の外周形状（西側30x30 + 中央連絡通路10x10 + 東側30x30）
export const MAP_OUTLINE_POINTS = [
    { x: -15, z: -15 },
    { x:  15, z: -15 },
    { x:  15, z:  -5 },
    { x:  25, z:  -5 },
    { x:  25, z: -15 },
    { x:  55, z: -15 },
    { x:  55, z:  15 },
    { x:  25, z:  15 },
    { x:  25, z:   5 },
    { x:  15, z:   5 },
    { x:  15, z:  15 },
    { x: -15, z:  15 }
];

// 西側エリア（5x5、各マス6x6）
// 0行目（Z: -15〜-9）を 'T' にして 7・8・9 側の北寄りに線路ラインを形成
export const GRID_WEST_5X5 = [
    ['T', 'T', 'T', 'T', 'T'],
    ['.', '.', 'R', 'P', '.'],
    ['.', 'R', 'C', 'R', 'R'],
    ['.', '.', 'R', 'P', '.'],
    ['.', '.', 'R', '.', '.']
];

// 東側エリア（5x5、各マス6x6、X: 25〜55）
// 0行目（Z: -15〜-9）も 'T' にして西から東へ線路をつなぐ
export const GRID_EAST_5X5 = [
    ['T', 'T', 'T', 'T', 'T'],
    ['.', '.', 'R', 'P', '.'],
    ['R', 'R', 'C', 'R', 'P'],
    ['.', '.', 'R', '.', '.'],
    ['.', 'P', 'R', '.', '.']
];

// 中央の連絡通路タイル（X: 15〜25, Z: -5〜+5 を 2x2 マス、各 5x5 で分割）
// 北側（Z = -2.5）に 'T' を配置して西と東の線路を接続
export const BRIDGE_TILES = [
    { x: 17.5, z: -2.5, width: 5, depth: 5, symbol: 'T' },
    { x: 22.5, z: -2.5, width: 5, depth: 5, symbol: 'T' },
    { x: 17.5, z:  2.5, width: 5, depth: 5, symbol: 'R' },
    { x: 22.5, z:  2.5, width: 5, depth: 5, symbol: 'R' }
];

function buildAreaTiles(matrix, startX, startZ, areaW, areaD) {
    const rows = matrix.length;
    const cols = matrix[0]?.length ?? 5;
    const tileW = areaW / cols;
    const tileD = areaD / rows;
    const tiles = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const symbol = matrix[r][c];
            tiles.push({
                x: startX + (c + 0.5) * tileW,
                z: startZ + (r + 0.5) * tileD,
                width: tileW,
                depth: tileD,
                texture: TILE_LEGEND[symbol] || TILE_LEGEND['.'],
                symbol
            });
        }
    }
    return tiles;
}

export const groundTiles = [
    ...buildAreaTiles(GRID_WEST_5X5, -15, -15, 30, 30),
    ...BRIDGE_TILES.map(t => ({
        ...t,
        texture: TILE_LEGEND[t.symbol] || TILE_LEGEND['R']
    })),
    ...buildAreaTiles(GRID_EAST_5X5, 25, -15, 30, 30)
];

const DEFAULT_BUILDING_TEXTURES = [
    './public/textures/building_right.png',
    './public/textures/building_left.png',
    './public/textures/building_top.png',
    './public/textures/building_bottom.png',
    './public/textures/building_front.png',
    './public/textures/building_back.png'
];

export const buildingData = [
    // ================= 西側エリア（線路 Z = -10 と重ならないよう配置） =================
    { width: 4.2, height: 11.5, depth: 4.2, positionX:  0,    positionZ: -6.2, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 4.4, height: 14.0, depth: 4.4, positionX: 10.5,  positionZ: -6.2, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.6, height: 8.5,  depth: 3.6, positionX:  5.5,  positionZ: -6.5, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.6, height: 7.5,  depth: 3.6, positionX: -5.2,  positionZ: -6.5, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.6, height: 6.5,  depth: 3.6, positionX:  5.2,  positionZ: -1.8, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.4, height: 5.0,  depth: 3.4, positionX: -5.0,  positionZ: -1.8, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.6, height: 6.0,  depth: 3.6, positionX:  5.2,  positionZ:  4.8, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 4.2, height: 5.5,  depth: 4.2, positionX: 10.5,  positionZ: 10.5, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.4, height: 4.2,  depth: 3.4, positionX:  5.5,  positionZ: 11.0, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.4, height: 4.0,  depth: 3.4, positionX: -5.2,  positionZ: 11.0, textures: DEFAULT_BUILDING_TEXTURES },

    // ================= 東側エリア（線路 Z = -10 と重ならないよう配置） =================
    { width: 4.5, height: 13.0, depth: 4.5, positionX: 40.0,  positionZ: -6.2, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 4.2, height: 10.0, depth: 4.2, positionX: 30.0,  positionZ: -6.2, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 4.5, height: 14.5, depth: 4.5, positionX: 49.5,  positionZ: -6.2, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.8, height: 7.0,  depth: 3.8, positionX: 34.5,  positionZ: -1.8, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.8, height: 8.0,  depth: 3.8, positionX: 45.5,  positionZ: -1.8, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 4.2, height: 6.5,  depth: 4.2, positionX: 34.5,  positionZ:  5.5, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 4.5, height: 5.5,  depth: 4.5, positionX: 49.5,  positionZ: 10.5, textures: DEFAULT_BUILDING_TEXTURES },
    { width: 3.6, height: 4.5,  depth: 3.6, positionX: 30.0,  positionZ: 10.5, textures: DEFAULT_BUILDING_TEXTURES }
];

export const waterData = [
    { width: 5.5, depth: 5.5, positionX: 10.5, positionZ: 1.5 },
    { width: 6.0, depth: 6.0, positionX: 45.5, positionZ: 5.5 }
];

export const pitData = [
    { width: 5.6, depth: 4.8, depthY: 1.5, positionX: 0,    positionZ: 10.5 },
    { width: 5.6, depth: 4.8, depthY: 1.5, positionX: 40.0, positionZ: 10.5 }
];

export const propData = [
    // 西側エリア
    { type: 'lamp',    x: -7.8, z: -7.5, height: 3.4, rotationY: 0 },
    { type: 'lamp',    x: -7.8, z:  7.5, height: 3.4, rotationY: 0 },
    { type: 'fence',   x:  0,   z:  7.8, width: 4.4, height: 0.9, rotationY: 0 },
    { type: 'bench',   x:  7.4, z: -2.2, width: 1.8, rotationY: Math.PI / 2 },

    // 中央連絡通路（X: 15〜25, Z: -5〜+5）
    { type: 'fence',   x: 20,   z: -4.8, width: 9.2, height: 0.9, rotationY: 0 },
    { type: 'fence',   x: 20,   z:  4.8, width: 9.2, height: 0.9, rotationY: 0 },
    { type: 'lamp',    x: 16.5, z: -4.4, height: 3.5, rotationY: -Math.PI / 2 },
    { type: 'lamp',    x: 23.5, z:  4.4, height: 3.5, rotationY:  Math.PI / 2 },

    // 東側エリア（X: 25〜55）
    { type: 'lamp',    x: 32.5, z: -7.5, height: 3.5, rotationY: 0 },
    { type: 'lamp',    x: 47.5, z: -7.5, height: 3.5, rotationY: Math.PI },
    { type: 'sign',    x: 37.5, z:  2.5, height: 2.5, variant: 'rect', rotationY: Math.PI / 4 },
    { type: 'bench',   x: 42.0, z:  5.5, width: 1.8, rotationY: -Math.PI / 2 },
    { type: 'planter', x: 37.5, z: -2.5, width: 1.5, depth: 1.0, rotationY: 0 },
    { type: 'fence',   x: 40,   z:  7.8, width: 4.4, height: 0.9, rotationY: 0 }
];