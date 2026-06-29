const fs = require('fs');
const buffer = fs.readFileSync('public/table-3d.glb');
const jsonChunkLength = buffer.readUInt32LE(12);
const jsonString = buffer.toString('utf8', 20, 20 + jsonChunkLength);
const json = JSON.parse(jsonString);
console.log(JSON.stringify(json.meshes, null, 2));
console.log(JSON.stringify(json.materials, null, 2));
