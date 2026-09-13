// World coordinates are metres. All visual terrain and navigation use this model.
export const START=20, END=-40.55, SPEED=1.65, TURN_RATE=58*Math.PI/180;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
export function center(z){const t=clamp((START-z)/60,0,1);return 4.1*Math.sin(t*Math.PI*2)*Math.sin(t*Math.PI)*(1-smooth((t-.78)/.19))}
export function base(z){return 1.15*smooth((START-z)/60)}
export function height(x,z){const d=Math.abs(x-center(z));const bank=1-Math.exp(-Math.pow(d/4.2,4));const clearing=1-.84*Math.exp(-(((z+44)/9)**2));const hills=1.2+.75*Math.sin(z*.13+x*.11)+.5*Math.cos(z*.21-x*.2);const coast=5*smooth((x-15)/22);return base(z)+bank*clearing*hills-coast+.15*smooth((-z-37.5)/2.5)}
export function halfWidth(z){return 1.65+.75*smooth((-z-29)/7)-1.45*smooth((-z-37)/3)}
export const banks=[];
for(let z=START+1;z>=END-1;z-=.65){const w=halfWidth(z);for(const side of [-1,1])banks.push({x:center(z)+side*(w+1.65),z,r:1.38})}
export function isValid(x,z){if(z<END||z>START||Math.abs(x-center(z))>halfWidth(z)+1e-8)return false;return banks.every(b=>Math.hypot(x-b.x,z-b.z)>=b.r-1e-8)}
function project(x,z){z=clamp(z,END,START);x=clamp(x,center(z)-halfWidth(z),center(z)+halfWidth(z));return {x,z}}
// Substeps stop tunnelling. Invalid circle contacts slide along the legal corridor.
export function move(from,dx,dz){let p=project(from.x,from.z);const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));for(let i=0;i<n;i++){let q=project(p.x+dx/n,p.z+dz/n);if(isValid(q.x,q.z))p=q;else{q=project(p.x+dx/n,p.z);if(isValid(q.x,q.z))p=q;q=project(p.x,p.z+dz/n);if(isValid(q.x,q.z))p=q}}return p}
export function boundedHead(x,z){let p=project(x,z);for(let i=0;i<4;i++){for(const b of banks){const dx=p.x-b.x,dz=p.z-b.z,d=Math.hypot(dx,dz);if(d<b.r){p=project(b.x+(dx/(d||1))*b.r,b.z+(dz/(d||1))*b.r)}}}return p}
export function axis(v){return Math.abs(v)<.15?0:Math.sign(v)*(Math.abs(v)-.15)/.85}
export function direction(yaw,x,y,dt){const l=Math.max(1,Math.hypot(x,y));return {dx:(Math.cos(yaw)*x+Math.sin(yaw)*y)*SPEED*dt/l,dz:(-Math.sin(yaw)*x+Math.cos(yaw)*y)*SPEED*dt/l}}

// A gentle ramp meets the entrance apron at its actual top surface.
export function floorHeight(x,z){return height(x,z)}
