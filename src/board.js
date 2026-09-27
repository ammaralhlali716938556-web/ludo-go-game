export function buildLudoBoard(scene) {
  const boardGroup = new THREE.Group();
  scene.add(boardGroup);

  // 1. Heavy Wooden Skeuomorphic Tray
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x42220f, roughness: 0.7, metalness: 0.1 });
  const woodBorder = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.6, 16.5), rimMat);
  woodBorder.position.y = -0.35;
  woodBorder.receiveShadow = true;
  boardGroup.add(woodBorder);

  // 2. Thick Cardboard Playfield
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xfbf6ea, roughness: 0.85, metalness: 0.05 });
  const boardCore = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.45, 15.6), boardMat);
  boardCore.receiveShadow = true;
  boardGroup.add(boardCore);

  // 3. Central Golden Victory Castle
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.5, 8), goldMat);
  hub.position.y = 0.1;
  boardGroup.add(hub);

  // 4. Coordinates Grid (15x15 standard Ludo mapped to 52 Circuit Tiles)
  const circuitCoords = [];
  for (let r = 13; r >= 9; r--) circuitCoords.push({ c: 6, r });
  for (let c = 5; c >= 0; c--) circuitCoords.push({ c, r: 8 });
  circuitCoords.push({ c: 0, r: 7 });
  for (let c = 0; c <= 5; c++) circuitCoords.push({ c, r: 6 });
  for (let r = 5; r >= 0; r--) circuitCoords.push({ c: 6, r });
  circuitCoords.push({ c: 7, r: 0 });
  for (let r = 0; r <= 5; r++) circuitCoords.push({ c: 8, r });
  for (let c = 9; c <= 14; c++) circuitCoords.push({ c, r: 6 });
  circuitCoords.push({ c: 14, r: 7 });
  for (let c = 14; c >= 9; c--) circuitCoords.push({ c, r: 8 });
  for (let r = 9; r <= 14; r++) circuitCoords.push({ c: 8, r });
  circuitCoords.push({ c: 7, r: 14 });
  circuitCoords.push({ c: 6, r: 14 });

  // Safe Star Tiles (Monopoly & Ludo Safe Spots)
  const safeIndices = [0, 8, 13, 21, 26, 34, 39, 47];
  const specialAttack = [4, 17, 30, 43]; // Railroads / Shut Down
  const specialHeist = [10, 23, 36, 49]; // Vaults / Heists

  const circuitTiles = circuitCoords.map((coord, idx) => {
    // Map grid (0..14) to 3D space (-6.5 to +6.5)
    const x = (coord.c - 7) * 0.95;
    const z = (coord.r - 7) * 0.95;

    let color = 0xffffff;
    let type = 'NORMAL';

    if (safeIndices.includes(idx)) {
      color = 0xffd32a; type = 'SAFE';
    } else if (specialAttack.includes(idx)) {
      color = 0xff3f34; type = 'ATTACK';
    } else if (specialHeist.includes(idx)) {
      color = 0x0be881; type = 'HEIST';
    }

    const tileMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.45, 0.22, 16),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 })
    );
    tileMesh.position.set(x, 0.22, z);
    tileMesh.receiveShadow = true;
    boardGroup.add(tileMesh);

    return { id: idx, pos: new THREE.Vector3(x, 0.45, z), type };
  });

  // 5. 3D Miniature Landmarks for Red Player's Kingdom (Bottom-Left)
  const landmarks = [];
  function addLandmark(x, z, name, color) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    base.position.y = 0.3;
    base.castShadow = true;
    group.add(base);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.6, 4), new THREE.MeshStandardMaterial({ color }));
    roof.position.y = 0.9;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    group.position.set(x, 0.22, z);
    boardGroup.add(group);
    landmarks.push({ name, mesh: group, level: 1 });
  }

  addLandmark(-4.8, 4.8, 'القلعة الملكية', 0xff3838);
  addLandmark(-3.4, 4.8, 'برج الساعة', 0x2e86de);
  addLandmark(-4.8, 3.4, 'الطاحونة', 0xff9f1a);
  addLandmark(-3.4, 3.4, 'النافورة', 0x10ac84);

  return { circuitTiles, landmarks, boardGroup };
}
