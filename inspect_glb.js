const fs = require('fs');
const gltf = JSON.parse(fs.readFileSync('public/Kiosk_Centre.glb', 'utf8').replace(/[\s\S]*?JSON/, '{"asset"').split('BIN')[0].trim()); // Note: this is a hacky way to parse GLB JSON chunk, might not work if not properly aligned.
console.log(JSON.stringify(gltf.materials, null, 2));
