// The looks ParticleOrb can take. Each one lays out its dots once and moves
// them every frame in its vertex shader. Every setting reaches the shader
// as a uniform named after it (`peelScale` → `uPeelScale`), beside the
// shared uTime, uAngle (the sphere's turn), uAspect, uDpr and uEnergy;
// changing one of `geometry`'s settings lays the dots out again.

type Attributes = Record<string, { size: number; data: Float32Array }>;

type OrbVariant<S extends BaseSettings> = {
  defaults: S;
  geometry: (keyof S)[];
  build: (s: S) => Attributes;
  vertex: string;
};

type BaseSettings = {
  /** The sphere's radius as a share of half the canvas's shorter side. */
  scale: number;
  /** Dot diameter in CSS pixels. */
  pointSize: number;
  opacity: number;
  /** Turn of the sphere, in radians per second. */
  spin: number;
  /** How fast the motion drifts. */
  flow: number;
};

type RowsSettings = BaseSettings & {
  /** Rows of dots from pole to pole. */
  rows: number;
  /** Dots in the row round the equator; shorter rows get fewer. */
  perRow: number;
  /** Lean of the rows, in radians. */
  tilt: number;
  /** Ripple height as a share of the radius. */
  wave: number;
  /** Ripples across the sphere: higher is busier. */
  waveFreq: number;
  /** How far the sheets lift away, as a share of the radius. */
  peel: number;
  /** Noise level a point must pass to peel: higher peels less of the surface. */
  peelThreshold: number;
  /** Sheets across the sphere: lower makes fewer, broader sheets. */
  peelScale: number;
  /** How far a lifted sheet twists round the sphere, in radians. */
  twist: number;
};

type ShellSettings = BaseSettings & {
  /** Dots in the shell. */
  count: number;
  /** Dots drifting loose inside it. */
  inner: number;
  /** Depth of the shell as a share of the radius. */
  thickness: number;
  /** How far the outline swells and dips, as a share of the radius. */
  wobble: number;
  /** Swells round the outline: higher is busier. */
  wobbleFreq: number;
  /** How far each dot wanders, as a share of the radius. */
  chaos: number;
  /** Grain of the wandering: higher sends neighbours different ways. */
  chaosFreq: number;
  /** How sharply brightness gathers at the rim. */
  rim: number;
  /** Brightness of the face, against the rim's 1. */
  face: number;
};

// Ashima Arts' 3D simplex noise (MIT).
const simplex = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const shared = `
uniform float uTime;
uniform float uAngle;
uniform float uAspect;
uniform float uScale;
uniform float uPointSize;
uniform float uDpr;
uniform float uEnergy;
out float vAlpha;
${simplex}
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.0,0.0,0.0,0.0,c,s,0.0,-s,c);}
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.0,-s,0.0,1.0,0.0,s,0.0,c);}
mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.0,-s,c,0.0,0.0,0.0,1.0);}
// Perspective from a camera four radii away, sized to the canvas's shorter
// side so the sphere stays round at any shape.
void place(vec3 q,float size){
  float persp=4.0/(4.0-q.z);
  vec2 xy=q.xy*persp*uScale*vec2(min(1.0,1.0/uAspect),min(1.0,uAspect));
  gl_Position=vec4(xy,-q.z*0.1,1.0);
  gl_PointSize=size*uDpr*persp;
}
`;

// Small seeded PRNG (mulberry32), so the layout is the same on every load.
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Rows: dots in tight rows over a sphere, so every row reads as a line. The
// surface ripples with drifting noise, and a few sheets of it peel away and
// twist round as they lift, like cloth flowing over a ball.
const rows: OrbVariant<RowsSettings> = {
  defaults: {
    rows: 150,
    perRow: 900,
    scale: 0.52,
    pointSize: 1.3,
    opacity: 0.6,
    tilt: -0.35,
    spin: 0.12,
    flow: 0.35,
    wave: 0.025,
    waveFreq: 1.4,
    peel: 0.14,
    peelThreshold: 0.4,
    peelScale: 0.8,
    twist: 1.4,
  },
  geometry: ["rows", "perRow"],
  build: ({ rows, perRow }) => {
    const rand = rng(11);
    const positions: number[] = [];
    const randoms: number[] = [];
    for (let i = 0; i < rows; i++) {
      const phi = ((i + 0.5) / rows) * Math.PI;
      const y = Math.cos(phi);
      const r = Math.sin(phi);
      const n = Math.max(6, Math.round(perRow * r));
      const offset = rand() * Math.PI * 2;
      for (let j = 0; j < n; j++) {
        const a = offset + (j / n) * Math.PI * 2;
        positions.push(r * Math.cos(a), y, r * Math.sin(a));
        randoms.push(rand());
      }
    }
    return {
      position: { size: 3, data: new Float32Array(positions) },
      aRand: { size: 1, data: new Float32Array(randoms) },
    };
  },
  vertex: `#version 300 es
precision highp float;
in vec3 position;
in float aRand;
uniform float uTilt;
uniform float uWave;
uniform float uWaveFreq;
uniform float uPeel;
uniform float uPeelThreshold;
uniform float uPeelScale;
uniform float uTwist;
${shared}
void main(){
  vec3 p=position;
  float t=uTime;

  // Ripples: two octaves of noise pushing each point along its normal.
  float wave=uWave*(1.0+1.8*uEnergy);
  float d=snoise(p*uWaveFreq+vec3(0.0,t*0.35,t*0.2))*wave
         +snoise(p*uWaveFreq*2.3-vec3(t*0.3,0.0,0.0))*wave*0.35;

  // Sheets: where a slow, broad noise field runs high, the surface lifts
  // away and twists round the axis, sliding over the rows beneath it.
  float f=snoise(p*uPeelScale+vec3(t*0.08,-t*0.05,t*0.06));
  float lift=smoothstep(uPeelThreshold,uPeelThreshold+0.35,f);
  vec3 q=rotY(lift*uTwist)*p;
  q*=1.0+d+lift*uPeel;

  // Pose: spin about the rows' axis, then lean toward the viewer.
  q=rotZ(uTilt)*rotX(0.3)*rotY(uAngle)*q;
  place(q,uPointSize);

  // Light from the upper left; grazing points at the limb read brighter,
  // which hollows the face into a shell, and the far side falls dim.
  vec3 n=normalize(q);
  float lit=max(dot(n,normalize(vec3(-0.5,0.6,0.6))),0.0);
  float front=smoothstep(-0.3,0.3,n.z);
  float rim=0.75+0.45*(1.0-abs(n.z));
  vAlpha=(0.32+0.5*lit)*mix(0.12,1.0,front)*rim*(0.6+0.4*aRand)*(1.0+lift*0.5);
}
`,
};

// Shell: dots scattered through a thin, ragged shell, so they crowd into a
// bright rim round a dim face, with a few loose ones drifting inside. Each
// dot wanders through its own patch of noise and the outline swells and
// dips, so the whole thing seethes.
const shell: OrbVariant<ShellSettings> = {
  defaults: {
    count: 30000,
    inner: 500,
    scale: 0.8,
    pointSize: 1.6,
    opacity: 0.85,
    spin: 0.08,
    flow: 0.4,
    thickness: 0.05,
    wobble: 0.035,
    wobbleFreq: 2.2,
    chaos: 0.03,
    chaosFreq: 3,
    rim: 3.2,
    face: 0.06,
  },
  geometry: ["count", "inner", "thickness"],
  build: ({ count, inner, thickness }) => {
    const rand = rng(23);
    const total = count + inner;
    const position = new Float32Array(total * 3);
    const radius = new Float32Array(total);
    const randoms = new Float32Array(total);
    const loose = new Float32Array(total);
    for (let i = 0; i < total; i++) {
      // Uniform on the sphere: z uniform in [-1, 1], angle uniform.
      const z = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const ring = Math.sqrt(1 - z * z);
      position.set([ring * Math.cos(a), z, ring * Math.sin(a)], i * 3);
      if (i < count) {
        // A rough bell curve about the surface, a little more of it outside.
        const bell = rand() + rand() + rand() - 1.35;
        radius[i] = 1 + bell * thickness * 1.2;
      } else {
        radius[i] = 0.15 + 0.8 * Math.cbrt(rand());
        loose[i] = 1;
      }
      randoms[i] = rand();
    }
    return {
      position: { size: 3, data: position },
      aRadius: { size: 1, data: radius },
      aRand: { size: 1, data: randoms },
      aLoose: { size: 1, data: loose },
    };
  },
  vertex: `#version 300 es
precision highp float;
in vec3 position;
in float aRadius;
in float aRand;
in float aLoose;
uniform float uWobble;
uniform float uWobbleFreq;
uniform float uChaos;
uniform float uChaosFreq;
uniform float uRim;
uniform float uFace;
${shared}
void main(){
  vec3 dir=position;
  float t=uTime;

  // The outline swells and dips on broad, slow noise.
  float r=aRadius+snoise(dir*uWobbleFreq+vec3(0.0,t*0.4,t*0.3))*uWobble;
  vec3 p=dir*r;

  // Each dot wanders through a noise field; loose ones roam further.
  float c=uChaos*(1.0+1.5*uEnergy)*(1.0+2.0*aLoose);
  vec3 s=p*uChaosFreq+vec3(t*0.7,-t*0.5,t*0.6);
  p+=vec3(snoise(s),snoise(s+vec3(17.1,3.3,-8.2)),snoise(s+vec3(-31.7,11.9,5.4)))*c;

  mat3 pose=rotX(0.25)*rotY(uAngle);
  vec3 q=pose*p;
  place(q,uPointSize);

  // Bright where the shell grazes the line of sight, dim across the face,
  // in drifting patches so the rim never reads as a clean ring.
  vec3 n=pose*dir;
  float edge=pow(1.0-abs(n.z),uRim);
  float patches=0.65+0.35*snoise(dir*2.5+vec3(t*0.15));
  float shellAlpha=mix(uFace,1.0,edge)*patches*(0.55+0.45*aRand);
  vAlpha=mix(shellAlpha,0.45*(0.4+0.6*aRand),aLoose);
}
`,
};

const ORB_VARIANTS = { rows, shell };

type OrbVariantName = keyof typeof ORB_VARIANTS;
type OrbSettings<V extends OrbVariantName> = (typeof ORB_VARIANTS)[V]["defaults"];

export { ORB_VARIANTS, type BaseSettings, type OrbSettings, type OrbVariant, type OrbVariantName };
