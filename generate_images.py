#!/usr/bin/env python3
import urllib.request, json, base64, time, sys

api_key = os.environ.get("OPENAI_API_KEY", "")

xray_style = "dental radiograph, periapical X-ray, black and white, high quality medical imaging, realistic dental radiology"
photo_style = "dental clinical photograph, intraoral photo, professional dental image, realistic"

cases = [
    {
        "id": 5000,
        "style": "xray",
        "prompt": f"Periapical radiograph of maxillary central incisor showing empty tooth socket with clean borders after avulsion, no root fragments remaining, surrounding alveolar bone intact, adjacent teeth appear normal. {xray_style}."
    },
    {
        "id": 5001,
        "style": "xray",
        "prompt": f"Periapical radiograph showing maxillary central incisor displaced laterally with widened periodontal ligament space on one side and narrowed on the other, apex displaced, no root fracture visible. {xray_style}."
    },
    {
        "id": 5002,
        "style": "photo",
        "prompt": f"Clinical intraoral photograph of an immature permanent maxillary central incisor with complicated crown fracture showing pink pulp tissue exposure, enamel and dentin missing from the incisal third, fresh fracture surfaces visible. {photo_style}."
    },
    {
        "id": 5003,
        "style": "xray",
        "prompt": f"Periapical radiograph showing horizontal root fracture in the middle third of a maxillary central incisor root, with slight displacement of the coronal fragment, fracture line clearly visible as a radiolucent line crossing the root. {xray_style}."
    },
    {
        "id": 5004,
        "style": "photo",
        "prompt": f"Clinical intraoral photograph of maxillary primary incisors in a young child with severe early childhood caries (S-ECC), showing dark brown and black cavitations on labial surfaces, some teeth reduced to root stumps, severe decay pattern. {photo_style}."
    },
    {
        "id": 5005,
        "style": "xray",
        "prompt": f"Periapical radiograph of a mandibular primary molar after successful pulpotomy, showing radiopaque zinc oxide eugenol filling material in the pulp chamber with sealed canal entrances, stainless steel crown on the tooth, no periapical pathology, no internal root resorption. {xray_style}."
    },
    {
        "id": 5006,
        "style": "xray",
        "prompt": f"Periapical radiograph of a mandibular primary molar showing furcation involvement with radiolucency between the roots, periapical radiolucency at root apices, internal root resorption present, extensively broken down crown. {xray_style}."
    },
    {
        "id": 5007,
        "style": "xray",
        "prompt": f"Periapical radiograph of mandibular posterior region showing the extraction site of a missing primary first molar, erupted permanent first molar present distally, band and loop space maintainer visible with band on permanent first molar and wire loop contacting primary canine mesially, developing premolar tooth germ visible. {xray_style}."
    },
    {
        "id": 5008,
        "style": "photo",
        "prompt": f"Clinical intraoral photograph showing permanent first molars with molar-incisor hypomineralization (MIH), displaying demarcated yellow-brown and white-cream opacities with sharp irregular borders on cusps and occlusal surfaces, asymmetric distribution between molars, some with post-eruptive enamel breakdown. {photo_style}."
    },
    {
        "id": 5009,
        "style": "xray",
        "prompt": f"Periapical radiograph of mandibular molar region showing a primary molar with furcation radiolucency and pathologic root resorption due to dental abscess, with the developing permanent second premolar tooth germ visible below showing a subtle hypoplastic enamel defect on the crown (Turner's tooth), proximity of infection to the permanent tooth germ. {xray_style}."
    }
]

results = []

for case in cases:
    case_id = case["id"]
    prompt = case["prompt"]
    output_path = f"/Users/clugodmd/Developer/peddent-qe-app/public/images/cases/case_{case_id}.png"
    
    print(f"Generating image for case {case_id}...", flush=True)
    
    try:
        data = json.dumps({
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024",
            "response_format": "b64_json"
        }).encode()
        
        req = urllib.request.Request(
            "https://api.openai.com/v1/images/generations",
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )
        
        resp = json.loads(urllib.request.urlopen(req, timeout=120).read())
        img_data = base64.b64decode(resp["data"][0]["b64_json"])
        
        with open(output_path, "wb") as f:
            f.write(img_data)
        
        print(f"  ✓ Saved case_{case_id}.png ({len(img_data)} bytes)", flush=True)
        results.append({"id": case_id, "success": True, "path": output_path})
        
        # Small delay to avoid rate limiting
        time.sleep(1)
        
    except Exception as e:
        print(f"  ✗ Error for case {case_id}: {e}", flush=True)
        results.append({"id": case_id, "success": False, "error": str(e)})

print("\nDone! Results:", flush=True)
for r in results:
    if r["success"]:
        print(f"  ✓ {r['id']}", flush=True)
    else:
        print(f"  ✗ {r['id']}: {r['error']}", flush=True)
