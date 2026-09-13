import * as T from './vendor/three.module.js';
export async function loadMaterials(){
 const loader=new T.TextureLoader(),maps={};
 await Promise.all(['gravel','masonry','plaster','bark','rock','paving'].map(async name=>{const textures=await Promise.all(['color','normal','rough'].map(async kind=>{const t=await loader.loadAsync(`./textures/${name}-${kind}.webp`);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(kind==='color')t.colorSpace=T.SRGBColorSpace;return t}));maps[name]={map:textures[0],normalMap:textures[1],roughnessMap:textures[2],normalScale:new T.Vector2(.55,.55),roughness:1}}));
 for(const key of ['map','normalMap','roughnessMap'])maps.bark[key].repeat.set(1,4);
 const grass=await loader.loadAsync('./textures/grass.webp');grass.colorSpace=T.SRGBColorSpace;grass.anisotropy=4;
 const needles=await loader.loadAsync('./textures/needles.webp');needles.colorSpace=T.SRGBColorSpace;
 const rocks=await Promise.all([0,1,2].map(async n=>{const r=await fetch(`./geometry/rock-${n}.json`);if(!r.ok)throw Error('Rock geometry unavailable');const d=await r.json(),g=new T.BufferGeometry();for(const [name,size] of [['position',3],['normal',3],['uv',2]])g.setAttribute(name,new T.Float32BufferAttribute(d[name],size));return g}));
 return {maps,grass,needles,rocks};
}
