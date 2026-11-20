import * as THREE from 'three';
import {
    MAP_OUTLINE_POINTS,
    buildingData,
    waterData,
    pitData,
    groundTiles,
    propData,
    DEFAULT_GROUND_TEXTURE,
    DEFAULT_WALL_TEXTURE
} from './mapData.js';
import { createTrain } from './Train.js';
import { createWater } from './Water.js';
import { createPits } from './Pit.js';
import { createProps } from './Props.js';

const textureCache = new Map();

function getCachedTexture(textureLoader, path, fallbackPath = null, options = {}) {
    const cacheKey = `${path}|${options.repeatX ?? 1}|${options.repeatY ?? 1}|${options.rotation ?? 0}`;
    if (textureCache.has(cacheKey)) {
        return textureCache.get(cacheKey);
    }

    const tex = textureLoader.load(
        path,
        undefined,
        undefined,
        () => {
            if (fallbackPath && path !== fallbackPath) {
                const fallbackTex = getCachedTexture(textureLoader, fallbackPath, null, {});
                tex.image = fallbackTex.image;
                tex.needsUpdate = true;
            }
        }
    );

    tex.colorSpace = THREE.SRGBColorSpace;

    if (options.repeatX || options.repeatY) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(options.repeatX ?? 1, options.repeatY ?? 1);
    }

    if (typeof options.rotation === 'number' && options.rotation !== 0) {
        tex.center.set(0.5, 0.5);
        tex.rotation = options.rotation;
    }

    textureCache.set(cacheKey, tex);
    return tex;
}

function isInWestSquare(x, z) {
    return x >= -15 && x <= 15 && z >= -15 && z <= 15;
}

function buildGroundMesh(textureLoader, outlinePoints, pits, repeatX, repeatY) {
    const baseGroundTex = getCachedTexture(textureLoader, DEFAULT_GROUND_TEXTURE, null, {
        repeatX,
        repeatY
    });

    const groundShape = new THREE.Shape();
    outlinePoints.forEach((pt, idx) => {
        if (idx === 0) {
            groundShape.moveTo(pt.x, -pt.z);
        } else {
            groundShape.lineTo(pt.x, -pt.z);
        }
    });
    groundShape.closePath();

    if (Array.isArray(pits)) {
        pits.forEach(pit => {
            const halfW = pit.width / 2;
            const halfD = pit.depth / 2;
            const hole = new THREE.Path();

            const cx = pit.positionX;
            const cy = -pit.positionZ;

            hole.moveTo(cx - halfW, cy - halfD);
            hole.lineTo(cx + halfW, cy - halfD);
            hole.lineTo(cx + halfW, cy + halfD);
            hole.lineTo(cx - halfW, cy + halfD);
            hole.closePath();

            groundShape.holes.push(hole);
        });
    }

    const groundGeometry = new THREE.ShapeGeometry(groundShape);
    const groundMesh = new THREE.Mesh(
        groundGeometry,
        new THREE.MeshBasicMaterial({ map: baseGroundTex, side: THREE.DoubleSide })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    return groundMesh;
}

function buildTilesGroup(textureLoader, tiles, pits) {
    const group = new THREE.Group();
    if (!Array.isArray(tiles)) return group;

    tiles.forEach(tile => {
        const tileW = tile.width ?? 6;
        const tileD = tile.depth ?? 6;
        const tileX = tile.x ?? 0;
        const tileZ = tile.z ?? 0;

        const overlapsPit = Array.isArray(pits) && pits.some(pit => {
            const pitHalfW = pit.width / 2;
            const pitHalfD = pit.depth / 2;
            return (
                Math.abs(tileX - pit.positionX) < (tileW / 2 + pitHalfW) &&
                Math.abs(tileZ - pit.positionZ) < (tileD / 2 + pitHalfD)
            );
        });
        if (overlapsPit) return;

        const tileTex = getCachedTexture(
            textureLoader,
            tile.texture || DEFAULT_GROUND_TEXTURE,
            DEFAULT_GROUND_TEXTURE,
            {
                repeatX: tile.repeatX ?? 1,
                repeatY: tile.repeatY ?? 1,
                rotation: tile.rotation ?? 0
            }
        );

        const tileGeo = new THREE.PlaneGeometry(tileW * 0.999, tileD * 0.999);
        const tileMat = new THREE.MeshBasicMaterial({
            map: tileTex,
            side: THREE.DoubleSide
        });
        const tileMesh = new THREE.Mesh(tileGeo, tileMat);
        tileMesh.rotation.x = -Math.PI / 2;
        tileMesh.position.set(tileX, 0.01, tileZ);
        group.add(tileMesh);
    });

    return group;
}

function buildBuildings(textureLoader, items, targetGroup, fallbackWallTex) {
    const meshes = [];
    if (!Array.isArray(items)) return meshes;

    items.forEach(data => {
        const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);

        let materials;
        if (Array.isArray(data.textures) && data.textures.length === 6) {
            materials = data.textures.map(path => {
                const tex = getCachedTexture(textureLoader, path, DEFAULT_WALL_TEXTURE);
                return new THREE.MeshBasicMaterial({ map: tex });
            });
        } else {
            materials = new THREE.MeshBasicMaterial({ map: fallbackWallTex });
        }

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(data.positionX, data.height / 2, data.positionZ);
        targetGroup.add(mesh);

        mesh.box3 = new THREE.Box3().setFromObject(mesh);
        mesh.topY = data.height;
        meshes.push(mesh);
    });

    return meshes;
}

export function createWorld(scene, initialOptions = {}) {
    scene.background = new THREE.Color(0x18202c);

    const textureLoader = new THREE.TextureLoader();
    const fallbackWallTex = getCachedTexture(textureLoader, DEFAULT_WALL_TEXTURE);

    let isMapExpanded = initialOptions.isMapExpanded ?? true;

    // --- 1. 拡張マップ（西30x30 + 連絡通路10x10 + 東30x30） ---
    const expandedGroup = new THREE.Group();
    expandedGroup.name = 'ExpandedMapGroup';

    const expandedOutline = Array.isArray(MAP_OUTLINE_POINTS) && MAP_OUTLINE_POINTS.length >= 3
        ? MAP_OUTLINE_POINTS
        : [
            { x: -15, z: -15 }, { x: 15, z: -15 }, { x: 15, z: -5 },
            { x: 25, z: -5 },  { x: 25, z: -15 }, { x: 55, z: -15 },
            { x: 55, z: 15 },  { x: 25, z: 15 },  { x: 25, z: 5 },
            { x: 15, z: 5 },   { x: 15, z: 15 },  { x: -15, z: 15 }
        ];

    expandedGroup.add(buildGroundMesh(textureLoader, expandedOutline, pitData, 14, 6));
    expandedGroup.add(buildTilesGroup(textureLoader, groundTiles, pitData));
    const expandedBuildings = buildBuildings(textureLoader, buildingData, expandedGroup, fallbackWallTex);

    const expandedWaterGroup = new THREE.Group();
    createWater(expandedWaterGroup, waterData);
    expandedGroup.add(expandedWaterGroup);

    const expandedPitGroup = new THREE.Group();
    createPits(expandedPitGroup, textureLoader, pitData);
    expandedGroup.add(expandedPitGroup);

    const expandedProps = createProps(expandedGroup, propData, {
        visible: initialOptions.propsVisible ?? true
    });

    scene.add(expandedGroup);

    // --- 2. 西側単体マップ（西30x30 のみ） ---
    const westOnlyGroup = new THREE.Group();
    westOnlyGroup.name = 'WestOnlyMapGroup';

    const westOutline = [
        { x: -15, z: -15 },
        { x:  15, z: -15 },
        { x:  15, z:  15 },
        { x: -15, z:  15 }
    ];
    const westPits = (pitData || []).filter(p => isInWestSquare(p.positionX, p.positionZ));
    const westWaters = (waterData || []).filter(w => isInWestSquare(w.positionX, w.positionZ));
    const westTiles = (groundTiles || []).filter(t => isInWestSquare(t.x, t.z));
    const westBuildingData = (buildingData || []).filter(b => isInWestSquare(b.positionX, b.positionZ));
    const westPropData = (propData || []).filter(pr => isInWestSquare(pr.x, pr.z));

    westOnlyGroup.add(buildGroundMesh(textureLoader, westOutline, westPits, 6, 6));
    westOnlyGroup.add(buildTilesGroup(textureLoader, westTiles, westPits));
    const westBuildings = buildBuildings(textureLoader, westBuildingData, westOnlyGroup, fallbackWallTex);

    const westWaterGroup = new THREE.Group();
    createWater(westWaterGroup, westWaters);
    westOnlyGroup.add(westWaterGroup);

    const westPitGroup = new THREE.Group();
    createPits(westPitGroup, textureLoader, westPits);
    westOnlyGroup.add(westPitGroup);

    const westProps = createProps(westOnlyGroup, westPropData, {
        visible: initialOptions.propsVisible ?? true
    });

    scene.add(westOnlyGroup);

    // --- 3. 電車（西側 X = -11.5 を常時走行） ---
    const train = createTrain(scene);

    const worldState = {
        get isMapExpanded() {
            return isMapExpanded;
        },
        get buildings() {
            return isMapExpanded ? expandedBuildings : westBuildings;
        },
        get pits() {
            return isMapExpanded ? pitData : westPits;
        },
        get propsVisible() {
            return expandedProps.isVisible;
        },
        train,
        setMapExpanded(expanded) {
            isMapExpanded = Boolean(expanded);
            expandedGroup.visible = isMapExpanded;
            westOnlyGroup.visible = !isMapExpanded;
            return isMapExpanded;
        },
        toggleMapExpanded() {
            return this.setMapExpanded(!isMapExpanded);
        },
        setPropsVisible(visible) {
            const next = Boolean(visible);
            expandedProps.setVisible(next);
            westProps.setVisible(next);
            return next;
        },
        togglePropsVisible() {
            const next = !expandedProps.isVisible;
            return this.setPropsVisible(next);
        }
    };

    worldState.setMapExpanded(isMapExpanded);

    return worldState;
}