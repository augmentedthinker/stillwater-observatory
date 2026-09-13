import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {center,height,base,smooth,halfWidth} from './navigation.js';
import {loadMaterials} from './materials.js';
export async function createWorld(scene){
 const assets=await loadMaterials();
 let seed=1926;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const stone=new T.MeshStandardMaterial({...assets.maps.masonry,color:0xcac6b2,roughness:.95});
 const dark=new T.MeshStandardMaterial({...assets.maps.plaster,color:0x448e7c,normalScale:new T.Vector2(.09,.09),roughness:.62,metalness:.5});
 const brass=new T.MeshStandardMaterial({color:0xbda26a,roughness:.43,metalness:.65});
 const warm=new T.MeshBasicMaterial({color:0xffdba0});
 const wall=new T.MeshStandardMaterial({...assets.maps.plaster,color:0xe6ddc1,roughness:.95});
 const mesh=(g,m,x=0,y=0,z=0,parent=scene)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o};
 const box=(w,h,d,m,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const cyl=(r1,r2,h,m,x,y,z,p,n=24)=>{const g=new T.CylinderGeometry(r1,r2,h,n);if(m.map){const uv=g.attributes.uv,scale=m===stone?3:2;for(let i=0;i<uv.count;i++){if(Math.abs(g.attributes.normal.getY(i))>.9)uv.setXY(i,g.attributes.position.getX(i)/scale,g.attributes.position.getZ(i)/scale);else uv.setXY(i,uv.getX(i)*Math.PI*2*Math.max(r1,r2)/scale,uv.getY(i)*h/scale)}}return mesh(g,m,x,y,z,p)};
 const torus=(r,t,m,x,y,z,p)=>mesh(new T.TorusGeometry(r,t,6,64),m,x,y,z,p);
 const batches=new Map(),dummy=new T.Object3D();
 function instance(key,g,m,x,y,z,sx,sy,sz,ry=0,rz=0){if(!batches.has(key))batches.set(key,{g,m,transforms:[]});dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,ry,rz);dummy.updateMatrix();batches.get(key).transforms.push(dummy.matrix.clone())}
 scene.background=new T.Color(0x162d3e);scene.fog=new T.FogExp2(0x28434b,.011);
 const sky=mesh(new T.SphereGeometry(220,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;void main(){float h=normalize(v).y;vec3 low=vec3(.19,.29,.32),high=vec3(.027,.07,.13);vec3 c=mix(low,high,smoothstep(-.08,.65,h));c+=vec3(.13,.07,.016)*exp(-pow((h-.015)*12.,2.));gl_FragColor=vec4(c,1.);}' }));
 scene.add(new T.HemisphereLight(0xb9d9ea,0x374348,1.35));const moonlight=new T.DirectionalLight(0xd1e5ed,2.1);moonlight.position.set(-25,35,-20);scene.add(moonlight);
 const sunset=new T.DirectionalLight(0xfbd6a1,1);sunset.position.set(20,8,-60);scene.add(sunset);
 // A continuous terrain mesh. Vertex colour blends path into the banks without overlay seams.
 const nx=180,nz=230,g=new T.BufferGeometry(),pos=[],col=[],uv=[],idx=[];const c=new T.Color();
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-45+i*90/nx,z=36-j*115/nz,y=height(x,z);pos.push(x,y,z);uv.push(x*.28,(z+y*.85)*.28);const d=Math.abs(x-center(z));const f=smooth((d-1.6)/1.7);c.set(0x969b89).lerp(new T.Color(0x3d6156),f);c.multiplyScalar(.86+rand()*.23);col.push(c.r,c.g,c.b)}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,b=a+nx+1;idx.push(a,a+1,b,b,a+1,b+1)}
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 // Small deterministic grain; UV slope compensation is shared with the source reference's lesson.
 const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=128;const ctx=texCanvas.getContext('2d'),im=ctx.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){let n=190+rand()*65;im.data.set([n,n,n,255],i)}ctx.putImageData(im,0,0);const grain=new T.CanvasTexture(texCanvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.colorSpace=T.SRGBColorSpace;
 mesh(g,new T.MeshStandardMaterial({...assets.maps.gravel,vertexColors:true,roughness:1}));
 // The sea is an inexpensive opaque shader: no reflection targets or heavy transparency.
 const seaMat=new T.ShaderMaterial({uniforms:{time:{value:0},fogColor:{value:scene.fog.color}},vertexShader:'varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;uniform vec3 fogColor;varying vec3 p;void main(){float w=sin(p.y*2.7+sin(p.x*.25+time*.13)*2.0+time*.25);float glint=pow(max(0.,w),18.)*.12;vec3 c=vec3(.08,.23,.28)+glint*vec3(.65,.78,.8);float f=smoothstep(35.,210.,length(p));gl_FragColor=vec4(mix(c,fogColor,f*.86),1.);}'});
 const sea=mesh(new T.PlaneGeometry(480,480),seaMat,105,-2.2,-60);sea.rotation.x=-Math.PI/2;
 // Small moon and restrained halo.
 mesh(new T.SphereGeometry(3.2,24,16),new T.MeshBasicMaterial({color:0xffecd0,fog:false}),-38,54,-150);
 const stars=[];for(let i=0;i<1000;i++){const a=rand()*Math.PI*2,e=.12+rand()*1.3,r=170;stars.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r)}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(sg,new T.PointsMaterial({color:0xe7e5ca,size:.16,sizeAttenuation:true,fog:false})));
 const rockGeo=new T.IcosahedronGeometry(1,1),rockMat=new T.MeshStandardMaterial({...assets.maps.rock,color:0xc8cabd,roughness:1});
 // Distant coastal islands frame the horizon.
 for(let i=0;i<22;i++){let x=-95+i*10,z=-100-rand()*55;instance('islands',rockGeo,rockMat,x,-1,z,7+rand()*9,5+rand()*19,8+rand()*10,rand()*6)}
 for(let i=0;i<360;i++){let z=27-rand()*97,x=center(z)+(rand()<.5?-1:1)*(3.5+rand()*21);if(z<-36&&Math.abs(x)<8)continue;let r=.25+rand()*(x>0?.95:1.9);x=center(z)+Math.sign(x-center(z))*Math.max(Math.abs(x-center(z)),halfWidth(z)+r+.55);instance('rocks'+i%3,assets.rocks[i%3],rockMat,x,height(x,z)+r*.08,z,r,r*(.5+rand()),r*.8,rand()*6)}
 // Individually placed paving stones remain almost flush with the continuous ground.
 const slab=new T.CylinderGeometry(1,1,.035,7),slabMat=new T.MeshStandardMaterial({...assets.maps.paving,color:0xc6c2ad,roughness:1});
 for(let z=21;z>-40.5;z-=.66)for(let k=-1;k<=1;k++){let x=center(z)+k*.85+(rand()-.5)*.14;instance('pavers',slab,slabMat,x,height(x,z)+.015,z,.37+rand()*.08,1,.26+rand()*.06,rand()*.6)}
 // Photographic grass tufts use crossed, alpha-tested cards in one instanced draw.
 const grassCard=new T.PlaneGeometry(1.12,.55);grassCard.translate(0,.275,0);const guv=grassCard.attributes.uv;for(let i=0;i<guv.count;i++)guv.setXY(i,.18+guv.getX(i)*.28,.105+guv.getY(i)*.14);const grassGeo=mergeGeometries([grassCard,grassCard.clone().rotateY(Math.PI/2)]);
 const grassMat=new T.MeshStandardMaterial({map:assets.grass,color:0xbbc9a2,roughness:1,side:T.DoubleSide,alphaTest:.42,depthWrite:true});
 grassMat.onBeforeCompile=s=>{s.uniforms.breeze={value:0};grassMat.userData.shader=s;s.vertexShader='uniform float breeze;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x += sin(breeze+instanceMatrix[3].z*.8+instanceMatrix[3].x)*.12*position.y*position.y;')};
 for(let i=0;i<7500;i++){let z=27-rand()*97,x=center(z)+(rand()<.5?-1:1)*(2.45+rand()*16);if(z<-35&&Math.abs(x)<8)continue;const s=.7+rand()*.8;instance('grass',grassGeo,grassMat,x,height(x,z)-.015,z,s,s,s,rand()*6)}
 // Conifer silhouettes use bark trunks and layered photographic needle sprigs.
 const trunkGeo=new T.CylinderGeometry(.12,.21,1,7),trunkMat=new T.MeshStandardMaterial({...assets.maps.bark,color:0xb6a792,roughness:1});const twig=new T.PlaneGeometry(.6,.65);twig.translate(0,.1,0);const tuv=twig.attributes.uv;for(let i=0;i<tuv.count;i++)tuv.setXY(i,tuv.getX(i)*.225,.55+tuv.getY(i)*.45);const sprigs=[];for(let i=0;i<18;i++){const g=twig.clone();g.rotateZ((rand()-.5)*.9);g.rotateY(rand()*6.28);g.translate((rand()-.5)*1.15,(rand()-.5)*1.1,(rand()-.5)*1.15);sprigs.push(g)}const crownGeo=mergeGeometries(sprigs),leafMat=new T.MeshStandardMaterial({map:assets.needles,color:0xb1c6ad,roughness:1,side:T.DoubleSide,alphaTest:.38});
 for(let i=0;i<48;i++){const z=25-rand()*91,x=center(z)-(4.8+rand()*16);if(z<-32&&Math.abs(x)<9)continue;let h=4+rand()*5,y=height(x,z);instance('trunks',trunkGeo,trunkMat,x,y+h*.36,z,1,h*.72,1);for(let j=0;j<7;j++)instance('crowns',crownGeo,leafMat,x+.13*Math.sin(j),y+h*(.3+j*.1),z,1.1-j*.14,h*.16,.95-j*.12,rand()*6)}
 // Framed lantern lenses and ground pools; a bounded light budget adds nearby illumination.
 const lensMaterial=new T.MeshStandardMaterial({color:0xf4ddb5,emissive:0xffce87,emissiveIntensity:1.1,roughness:.3,metalness:.12});const postGeo=new T.CylinderGeometry(.035,.05,1,8),lensGeo=new T.CylinderGeometry(.095,.095,.26,8),capGeo=new T.ConeGeometry(.17,.13,8),poolGeo=new T.CircleGeometry(.66,20),poolMat=new T.MeshBasicMaterial({color:0xb7ad7b,transparent:true,opacity:.12,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 for(let z=18,i=0;z>-39;z-=4.4,i++){for(let side of [-1,1]){let x=center(z)+side*Math.max(2.13,halfWidth(z)+.45),y=height(x,z);instance('posts',postGeo,brass,x,y+.61,z,1,1.22,1);instance('lenses',lensGeo,lensMaterial,x,y+1.28,z,1,1,1);instance('caps',capGeo,dark,x,y+1.47,z,1,1,1);for(let j=0;j<4;j++){const a=j*Math.PI/2+Math.PI/4;instance('lantern-cage',postGeo,dark,x+Math.cos(a)*.106,y+1.28,z+Math.sin(a)*.106,.17,.32,.17)}const pool=mesh(poolGeo,poolMat,x,y+.015,z);pool.rotation.x=-Math.PI/2}}
 const lanternLights=[-1,1].map(()=>{const l=new T.PointLight(0xffb965,14,5,2);scene.add(l);return l});const porchLight=new T.PointLight(0xffca82,10,11,2);porchLight.position.set(0,3.6,-40.6);scene.add(porchLight);
 // STILLWATER: pale masonry, a patinated dome, a brass celestial instrument.
 const home=new T.Group();home.position.set(0,base(-40),-46);scene.add(home);
 cyl(5.35,5.7,1.6,stone,0,-.67,0,home,64); // bottom is 1.47m below the approach.
 cyl(5.25,5.25,.18,brass,0,.13,0,home,64);
 // Curved outer wall leaves a real 2.35m entrance gap facing the path.
 const wallArc=mesh(new T.CylinderGeometry(5,5,3.7,64,1,true,.245,Math.PI*2-.49),wall,0,2.05,0,home);wallArc.material.side=T.DoubleSide;{const uv=wallArc.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*14,uv.getY(i)*1.8)}
 for(let i=0;i<14;i++){let a=.42+i*(Math.PI*2-.84)/13;const x=Math.sin(a)*5.02,z=Math.cos(a)*5.02;const win=box(.65,2.1,.045,warm,x,2.05,z,home);win.rotation.y=a;for(let s of [-1,1]){let f=box(.055,2.3,.12,brass,x+Math.cos(a)*s*.38,2.05,z-Math.sin(a)*s*.38,home);f.rotation.y=a}let mull=box(.035,2.15,.12,dark,x,2.05,z,home);mull.rotation.y=a;let bar=box(.84,.065,.12,brass,x,1.65,z,home);bar.rotation.y=a;const butt=cyl(.17,.24,3.9,stone,Math.sin(a+.17)*5.05,2,Math.cos(a+.17)*5.05,home,8)}
 cyl(5.35,5.2,.28,stone,0,3.96,0,home,64);cyl(5.45,5.45,.065,brass,0,4.12,0,home,64);
 const dome=mesh(new T.SphereGeometry(5.3,48,20,0,Math.PI*2,0,Math.PI/2),dark,0,4.13,0,home);dome.scale.y=.59;{const uv=dome.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*10,uv.getY(i)*3)}
 for(let i=0;i<16;i++){let a=i*Math.PI/8,pts=[];for(let j=0;j<=24;j++){let t=j/24*Math.PI/2;pts.push(new T.Vector3(Math.sin(t)*5.32*Math.sin(a),4.13+Math.cos(t)*3.15,Math.sin(t)*5.32*Math.cos(a)))}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.024,4,false),brass,0,0,0,home)}
 cyl(.48,.65,.35,brass,0,7.35,0,home);const orrery=new T.Group();orrery.position.set(0,8.12,0);home.add(orrery);for(let i=0;i<3;i++){let r=torus(.85,.024,brass,0,0,0,orrery);r.rotation.set(i*.62,i*.9,.4)}mesh(new T.SphereGeometry(.12,12,8),warm,0,0,0,orrery);
 // Entrance portal and flush, broad approach apron.
 const apron=box(3.7,.9,2.1,stone,0,-.36,5.15,home);box(3.7,.07,2.1,wall,0,.11,5.15,home);
 for(let x of [-1.48,1.48]){cyl(.15,.2,3.25,stone,x,1.74,5.9,home,16);cyl(.25,.25,.12,brass,x,.22,5.9,home);cyl(.23,.23,.14,brass,x,3.34,5.9,home)}
 box(3.65,.19,1.7,dark,0,3.51,5.35,home);box(3.75,.04,1.8,brass,0,3.62,5.35,home);
 const doorPivot=new T.Group();doorPivot.position.set(-1.05,.19,4.98);home.add(doorPivot);const door=box(2.1,2.95,.16,dark,1.05,1.475,0,doorPivot);for(const x of [.16,1.94])box(.028,2.7,.035,brass,x,1.5,.095,doorPivot);for(const y of [.16,2.81])box(1.8,.035,.035,brass,1.05,y,.095,doorPivot);
 let emblem=torus(.31,.026,brass,1.05,1.89,.1,doorPivot);box(.04,.64,.04,brass,1.05,1.89,.1,doorPivot);box(.64,.04,.04,brass,1.05,1.89,.1,doorPivot);let handle=torus(.095,.025,warm,1.76,1.2,.13,doorPivot);
 // Interior is a modest vestibule, deliberately waiting for its next chapter.
 cyl(4.95,4.95,.12,dark,0,.2,0,home,48);cyl(1.2,1.35,.1,brass,0,.29,0,home);const inner=mesh(new T.SphereGeometry(4.9,32,12,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:0x183336,side:T.BackSide}),0,3.9,0,home);inner.scale.y=.59;
 box(1.7,.1,.55,wall,-2.6,.66,1.6,home);for(let x of [-3.2,-2])box(.18,.55,.45,stone,x,.37,1.6,home);
 const label=(lines,width=1024,heightPx=512)=>{let canvas=document.createElement('canvas');canvas.width=width;canvas.height=heightPx;const c=canvas.getContext('2d');c.fillStyle='#132e34';c.fillRect(0,0,width,heightPx);c.strokeStyle='#baa477';c.lineWidth=3;c.strokeRect(18,18,width-36,heightPx-36);c.textAlign='center';for(const [text,y,font,color] of lines){c.font=font;c.fillStyle=color;c.fillText(text,width/2,y)}const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map,side:T.DoubleSide})};
 const sign=mesh(new T.PlaneGeometry(1.8,.5),label([['STILLWATER',110,'48px Georgia','#f1dcaf'],['O B S E R V A T O R Y',178,'25px Arial','#d0dcd5']],1024,256),0,3.13,6.22,home);
 const slate=mesh(new T.PlaneGeometry(1.9,.95),label([['WELCOME TO STILLWATER',103,'38px Georgia','#eed5a0'],['Come as you are.',205,'44px Georgia','#f0eee2'],['There is room here for',276,'37px Georgia','#f0eee2'],['an unfinished thought.',332,'37px Georgia','#f0eee2'],['— Astra',425,'30px Georgia','#d1b782']]),0,2.9,-43);slate.visible=false;
 // A few sculptural tide markers and the trailhead inscription.
 const trailSign=mesh(new T.PlaneGeometry(1.5,.65),label([['THE STILLWATER PATH',100,'40px Georgia','#efdab3'],['Follow the lights. Take your time.',184,'29px Georgia','#d0dcd5']],1024,300),center(18)-2.7,height(center(18)-2.7,18)+1,18);trailSign.rotation.y=.25;
 for(let i=0;i<3;i++){let x=7+i*1.1,z=-30-i*1.6;const pillar=mesh(new T.BoxGeometry(.4,2+i*.5,.35),stone,x,height(x,z)+1,z);pillar.rotation.z=-.07+i*.03;torus(.28,.028,brass,x,height(x,z)+2+i*.2,z)}
 for(const {g,m,transforms} of batches.values()){const im=new T.InstancedMesh(g,m,transforms.length);transforms.forEach((t,i)=>im.setMatrixAt(i,t));im.computeBoundingSphere();scene.add(im)}
 // Merge static architecture by material; preserve independently animated objects.
 scene.updateMatrixWorld(true);const groups=new Map(),originals=[];
 const dynamic=o=>{for(let p=o;p;p=p.parent)if([doorPivot,orrery,slate,sea,sky].includes(p))return true;return false};
 scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||dynamic(o))return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,geometries:[]});groups.get(key).geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld));originals.push(o)});
 for(const {material,geometries} of groups.values()){const merged=mergeGeometries(geometries);if(!merged)throw Error('Static geometry merge failed');mesh(merged,material);for(const g of geometries)g.dispose()}
 for(const o of originals)o.removeFromParent();const oldGeometries=new Set(originals.map(o=>o.geometry));for(const g of oldGeometries)g.dispose();
 return {door,doorPivot,slate,home,update(t,opened,dt,viewerZ=20){const lz=Math.max(-34.8,Math.min(18,18-Math.round((18-viewerZ)/4.4)*4.4));lanternLights.forEach((l,i)=>{const x=center(lz)+(i?1:-1)*Math.max(2.13,halfWidth(lz)+.45);l.position.set(x,height(x,lz)+1.28,lz);l.intensity=14*smooth(1-Math.abs(viewerZ-lz)/2.2)});seaMat.uniforms.time.value=t;if(grassMat.userData.shader)grassMat.userData.shader.uniforms.breeze.value=t*.65;orrery.rotation.y=t*.045;doorPivot.rotation.y+=((opened?Math.PI*.52:0)-doorPivot.rotation.y)*(1-Math.exp(-6*dt))}};
}
