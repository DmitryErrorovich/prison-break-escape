import { Container, Graphics, Text } from 'pixi.js';
import { getSectorIndex, SECTORS, type Sector } from './sectorProgress';

const W=1000;
const PARALLAX=0.22;
const FADE_MS=380;
type Detail = { root:Container; cameras:Container[]; lamps:Graphics[]; steam:Graphics[] };
type Zone = { root:Container; far:[Container,Container]; near:[Detail,Detail] };

function label(value:string,size:number,color:number):Text {
  return new Text({text:value,style:{fontFamily:'Arial, sans-serif',fontWeight:'bold',fontSize:size,fill:color,letterSpacing:2}});
}
function farTile(sector:Sector):Container {
  const tile=new Container();
  const g=new Graphics().rect(0,0,W,345).fill(sector.wall)
    .rect(0,0,W,26).fill(0x0e1726).rect(0,318,W,27).fill(0x101c2b);
  for(let x=25;x<W;x+=178) {
    g.roundRect(x,50,118,236,9).fill({color:0x08121f,alpha:0.3});
    g.rect(x+8,60,102,5).fill({color:sector.accent,alpha:0.09});
  }
  tile.addChild(g);
  return tile;
}
function surveillance(x:number):Container {
  const pivot=new Container();
  pivot.position.set(x,69);
  const beam=new Graphics().moveTo(0,0).lineTo(-125,245).lineTo(125,245).closePath().fill({color:0x72d5f8,alpha:0.065});
  const body=new Graphics().roundRect(-18,-10,36,18,4).fill(0x1c293c)
    .roundRect(-13,-6,26,8,2).fill(0x57748c).circle(0,0,5).fill(0xe7f4ff);
  pivot.addChild(beam,body);
  return pivot;
}
function nearTile(sector:Sector,variant:number):Detail {
  const root=new Container();
  const cameras:Container[]=[];
  const lamps:Graphics[]=[];
  const steam:Graphics[]=[];
  root.addChild(new Graphics().rect(0,18,W,12).fill(0x35475d).rect(0,305,W,15).fill(0x2a3d50).rect(0,321,W,18).fill(0x0d1c30));
  if(sector.id==='cells') {
    const bars=new Graphics();
    for(let i=0;i<5;i++) {
      const x=40+i*202;
      bars.roundRect(x,90,132,214,6).fill(0x0c1727).roundRect(x+8,98,116,202,3).fill(0x18283b);
      for(let dx=25;dx<122;dx+=26) bars.rect(x+dx,103,5,188).fill(0x58758b);
      bars.rect(x+13,151,107,6).fill(0x435c71).rect(x+13,259,107,6).fill(0x435c71);
      const number=label('CELL '+String(i+1+variant*5).padStart(2,'0'),11,0x829cb1);
      number.position.set(x+9,67);root.addChild(number);
    }
    root.addChild(bars);
  } else if(sector.id==='maintenance') {
    const pipes=new Graphics();
    for(let x=20;x<W;x+=214) {
      pipes.roundRect(x,74,28,242,8).fill(0x69544a).rect(x-8,125,44,13).fill(0x947460)
        .circle(x+14,181,19).fill(0x182531).circle(x+14,181,13).fill(0xd4a266)
        .circle(x+14,181,6).fill(0x344254).roundRect(x+52,241,120,65,7).fill(0x232b33)
        .rect(x+59,258,105,8).fill({color:sector.accent,alpha:0.38});
      const cloud=new Graphics().ellipse(0,0,28,12).fill({color:0xe9f8ff,alpha:0.13})
        .ellipse(18,-20,20,24).fill({color:0xe9f8ff,alpha:0.07});
      cloud.position.set(x+106,238);root.addChild(cloud);steam.push(cloud);
    }
    root.addChildAt(pipes,1);
  } else if(sector.id==='security') {
    const monitors=new Graphics();
    for(let x=43;x<W;x+=228) {
      monitors.roundRect(x,115,178,178,10).fill(0x0b1629)
        .roundRect(x+9,126,160,120,4).fill(0x17334d)
        .rect(x+24,265,100,5).fill(0x5d7287);
      const screen=new Graphics().roundRect(x+20,137,140,91,3).fill({color:0x74d2fc,alpha:0.18});
      root.addChild(screen);lamps.push(screen);
    }
    root.addChildAt(monitors,1);
  } else {
    const vents=new Graphics();
    for(let x=34;x<W;x+=192) {
      vents.roundRect(x,112,148,174,8).fill(0x0d242b)
        .roundRect(x+10,123,128,147,5).fill(0x28434c);
      for(let y=145;y<265;y+=22) vents.rect(x+16,y,116,6).fill(0x0e2b30);
      vents.rect(x+30,90,99,11).fill({color:0x6ee7ac,alpha:0.42});
    }
    root.addChild(vents);
    const sign=label('EXIT  →  →',24,0x8cf5bd);
    sign.position.set(360,47);root.addChild(sign);
  }
  if(sector.id==='cells'||sector.id==='security') {
    for(const x of [310,790]) {const camera=surveillance(x);root.addChild(camera);cameras.push(camera);}
  }
  const glow=new Graphics().roundRect(392,34,210,23,10).fill({color:sector.accent,alpha:0.12});
  const light=new Graphics().roundRect(412,25,170,9,4).fill(sector.accent);
  root.addChild(glow,light);lamps.push(glow);
  return {root,cameras,lamps,steam};
}
function zoneFor(sector:Sector):Zone {
  const root=new Container();
  const far:[Container,Container]=[farTile(sector),farTile(sector)];
  const near:[Detail,Detail]=[nearTile(sector,0),nearTile(sector,1)];
  root.addChild(...far,near[0].root,near[1].root);
  return {root,far,near};
}
/** Visual-only environment. The Crash Engine never reads this class. */
export class PrisonEnvironment extends Container {
  private readonly zones=SECTORS.map(zoneFor);
  private readonly title=label(SECTORS[0].name,18,SECTORS[0].accent);
  private readonly subtitle=label(SECTORS[0].description,10,0x9ab7c5);
  private readonly dots=SECTORS.map((_,i)=>{
    const dot=new Graphics().roundRect(0,0,20,4,2).fill(0xffffff);
    dot.position.set(28+i*27,123);return dot;
  });
  private index=0;
  private clock=0;
  constructor() {
    super();
    this.zones.forEach((z,i)=>{z.root.alpha=i===0?1:0;this.addChild(z.root);});
    this.title.position.set(28,70);this.subtitle.position.set(28,96);
    this.addChild(this.title,this.subtitle,...this.dots);
    this.refreshLabels();
  }
  update(deltaMs:number,distance:number,running:boolean):void {
    const dt=Math.min(100,Math.max(0,deltaMs));
    this.clock+=dt;
    const next=getSectorIndex(distance);
    if(next!==this.index){this.index=next;this.refreshLabels();}
    const farShift=(distance*PARALLAX)%W;
    const nearShift=distance%W;
    for(const [i,z] of this.zones.entries()) {
      z.root.alpha=Math.max(0,Math.min(1,z.root.alpha+(i===next?1:-1)*dt/FADE_MS));
      z.root.visible=z.root.alpha>0;
      if(!z.root.visible)continue;
      z.far[0].x=-farShift;z.far[1].x=W-farShift;
      z.near[0].root.x=-nearShift;z.near[1].root.x=W-nearShift;
      for(const tile of z.near) {
        tile.cameras.forEach((camera,j)=>{
          camera.rotation=running?Math.sin(this.clock*0.0016+j)*0.17:0;
        });
        tile.lamps.forEach((lamp,j)=>{
          lamp.alpha=running?0.55+0.35*Math.sin(this.clock*0.006+j):0.7;
        });
        tile.steam.forEach((cloud,j)=>{
          cloud.alpha=0.4+0.23*Math.sin(this.clock*0.002+j);
          cloud.y=235-5*Math.sin(this.clock*0.001+j);
        });
      }
    }
  }
  private refreshLabels():void {
    const sector=SECTORS[this.index];
    this.title.text='SECTOR '+(this.index+1)+'/'+SECTORS.length+'  ·  '+sector.name;
    this.title.style.fill=sector.accent;
    this.subtitle.text=sector.description;
    this.dots.forEach((dot,i)=>{
      dot.tint=i<=this.index?sector.accent:0x4b5b6b;
      dot.alpha=i===this.index?1:0.65;
    });
  }
}
