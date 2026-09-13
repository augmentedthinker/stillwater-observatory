# Scanned material sources

The September 13 material pass uses the following **Poly Haven CC0** assets. All published material files are local to this repository; the running scene makes no request to Poly Haven. [Poly Haven license](https://polyhaven.com/license).

| Source | Stillwater use |
| --- | --- |
| [Rocky Gravel](https://polyhaven.com/a/rocky_gravel) | Continuous terrain colour, OpenGL normals and roughness |
| [Coast Rocks 02](https://polyhaven.com/a/coast_rocks_02) | Worn paving surfaces |
| [Rock Moss Set 01](https://polyhaven.com/a/rock_moss_set_01) | Three simplified boulder meshes and matching PBR maps |
| [Large Sandstone Blocks](https://polyhaven.com/a/large_sandstone_blocks) | Foundation, stonework and tide markers |
| [Rough Plaster 03](https://polyhaven.com/a/rough_plaster_03) | Observatory walls; fine relief reused for weathered painted metal |
| [Bark Brown 01](https://polyhaven.com/a/bark_brown_01) | Trunks and bark detail |
| [Grass Medium 01](https://polyhaven.com/a/grass_medium_01) | Photographic grass cutout atlas, instanced as crossed cards |
| [Pine Sapling Medium](https://polyhaven.com/a/pine_sapling_medium) | Needle-sprig atlas arranged into original conifer silhouettes |
| [Brown Mud Leaves 01](https://polyhaven.com/a/brown_mud_leaves_01) | Packed alternative soil maps, retained in the material library; not loaded by the current scene |

## Processing

Colour maps use sRGB; normal and roughness maps use linear data. Colour and cutouts are at most 1024px on the longest side, normal and roughness maps 512px. Alpha is packed into foliage WebP images; runtime foliage uses alpha testing and depth writes. Texture provenance, output dimensions, bytes and hashes are in [textures/provenance.json](textures/provenance.json).

The three rock shapes were simplified in Blender 4.3.2 to 219–220 triangles each, retaining the original UVs. Mesh coordinates are converted to Three.js Y-up and normalized to a maximum horizontal radius of one metre; placement keeps that radius outside the walking corridor. Their named source meshes are recorded inside the JSON files in `geometry/`.

Original geometry and texture files can be obtained from the linked source pages. `tools/prepare-textures.py --help` documents the optional Pillow texture repack. The checked-in packed files are the deployment inputs, so rebuilding textures or installing Blender is unnecessary to run or edit the scene.

Three.js and BufferGeometryUtils remain MIT licensed under `vendor/THREE-LICENSE.txt`. Stillwater's original architecture, placement, navigation, interface and procedural audio are covered by the repository's MIT license.
