const THREE = require('three');

function asPhysicalMaterial(mat) {
  if (mat instanceof THREE.MeshPhysicalMaterial) return mat;
  const physical = new THREE.MeshPhysicalMaterial();
  
  try {
    THREE.MeshStandardMaterial.prototype.copy.call(physical, mat);
  } catch (e) {
    console.log("Caught error in copy.call:", e.message);
  }
  return physical;
}

const standard = new THREE.MeshStandardMaterial();
const physical = asPhysicalMaterial(standard);
console.log("Converted successfully! color:", physical.color.getHexString());
