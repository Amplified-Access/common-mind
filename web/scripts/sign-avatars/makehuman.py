# Builds one MakeHuman signer in Blender with MPFB, for makehuman.mjs.
#
#   blender --background --python makehuman.py -- <preset.json> <out.glb>
#
# The preset is an MPFB human (phenotype, skin, eyes, hair, clothes). The
# character gets MPFB's "default" rig, which has every finger bone, the
# eyes, and a twist bone in each arm, and is exported with the ARKit face
# shapes and the Meta visemes for mouthing.

import json
import sys

import bpy
from bl_ext.blender_org.mpfb.services import ExportService, FaceService, HumanService, ObjectService, TargetService

preset_file, out = sys.argv[sys.argv.index("--") + 1:][:2]
with open(preset_file, encoding="utf-8") as f:
    human = json.load(f)

settings = HumanService.get_default_deserialization_settings()
# No subdivision: the base mesh is enough at the size the signer is drawn.
settings["subdiv_levels"] = 0
basemesh = HumanService.deserialize_from_dict(human, settings)

# The export copy bakes the body's shape into the mesh, adds the face shapes
# (spreading them to the brows, lashes, hair and teeth), and drops the
# helper geometry MakeHuman fits clothes with.
armature = ExportService.create_character_copy(basemesh, name_suffix="_export")
body = ObjectService.find_object_of_type_amongst_nearest_relatives(armature)
TargetService.bake_targets(body)
FaceService.load_targets(body, load_microsoft_visemes=False, load_meta_visemes=True, load_arkit_faceunits=True)
FaceService.interpolate_targets(body)
ExportService.bake_modifiers_remove_helpers(body, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True)

bpy.ops.object.select_all(action="DESELECT")
for obj in [armature, *armature.children_recursive]:
    obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    use_selection=True,
    export_animations=False,
    export_morph=True,
    export_skins=True,
)
