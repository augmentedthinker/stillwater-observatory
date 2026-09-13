"""Pack licensed source maps for mobile delivery; no painting or baked lighting.

python tools/prepare-textures.py --source /path/to/downloads --scans /path/to/scans
Download folders use Poly Haven asset names. --source contains rocky_gravel,
large_sandstone_blocks, rough_plaster_03, bark_brown_01, grass_medium_01 and
pine_sapling_medium with their 1K maps. --scans contains rock_moss_set_01,
brown_mud_leaves_01 and coast_rocks_02, each with a textures/ subfolder.
Use JPG or PNG normal maps (OpenGL convention), not EXR. See ASSETS.md.
"""
from PIL import Image
from pathlib import Path
import json,hashlib,argparse
SITE=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source',type=Path,required=True);parser.add_argument('--scans',type=Path,required=True);parser.add_argument('--output',type=Path,default=SITE/'textures');args=parser.parse_args()
SOURCE=args.source;TIDE=args.scans;OUT=args.output;OUT.mkdir(exist_ok=True);records=[]
sets={'gravel':(SOURCE/'rocky_gravel','rocky_gravel'),'masonry':(SOURCE/'large_sandstone_blocks','large_sandstone_blocks'),'plaster':(SOURCE/'rough_plaster_03','rough_plaster_03'),'bark':(SOURCE/'bark_brown_01','bark_brown_01'),'rock':(TIDE/'rock_moss_set_01/textures','rock_moss_set_01'),'soil':(TIDE/'brown_mud_leaves_01/textures','brown_mud_leaves_01'),'paving':(TIDE/'coast_rocks_02/textures','coast_rocks_02')}
for dest,(folder,asset) in sets.items():
 for kind,token in [('color','diff'),('normal','nor_gl'),('rough','rough')]:
  src=next(p for p in folder.glob('*_'+token+'_1k.*') if p.suffix in ['.png','.jpg']);im=Image.open(src).convert('RGB');size=1024 if kind=='color' else 512;im.thumbnail((size,size),Image.Resampling.LANCZOS)
  out=OUT/(dest+'-'+kind+'.webp');im.save(out,quality=88 if kind=='color' else 92,method=6)
  records.append({'file':out.name,'source':'https://polyhaven.com/a/'+asset,'license':'CC0','map':kind,'size':list(im.size),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
for dest,name,diff,alpha in [('grass','grass_medium_01','grass_medium_01_diff_1k.jpg','grass_medium_01_alpha_1k.png'),('needles','pine_sapling_medium','pine_sapling_medium_twig_diff_1k.jpg','pine_sapling_medium_twig_alpha_1k.png')]:
 folder=SOURCE/name;im=Image.open(folder/diff).convert('RGBA');a=Image.open(folder/alpha).convert('L');im.putalpha(a);im.thumbnail((1024,1024),Image.Resampling.LANCZOS);out=OUT/(dest+'.webp');im.save(out,quality=92,method=6)
 records.append({'file':out.name,'source':'https://polyhaven.com/a/'+name,'license':'CC0','map':'color and alpha','size':list(im.size),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
(OUT/'provenance.json').write_text(json.dumps(records,indent=2)+'\n');print('Packed',len(records),'textures,',sum(r['bytes'] for r in records),'bytes')
