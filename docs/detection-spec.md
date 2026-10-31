# Detection spec

Classic computer vision on fixed zones of the image. Each detector is a pure function:

```ts
type Detector = (frame: ImageData, t: number, calib: Calibration, state: DetectorState)
  => { state: DetectorState; events: DetectedEvent[]; debug?: DebugInfo };
```

The same code runs live (apps/camera) and offline (eval harness over recorded clips).
Only pixels inside the calibrated zones are processed.

## Camera setup — basketball

- Phone about 1 m to one side of the hoop, **level with the rim**, seeing the rim edge-on
  and the full net below it. Outside the ball cage; lens at a gap in the netting.
- Rigid mount on the machine frame, not on anything that shakes when balls hit.
- Plain background behind the net (backboard or a dark sheet).
- Steady lighting; turn off flashing attract-mode lights near the hoop.
- Don't move the phone after calibration.

## Calibration — basketball

Saved on the device as JSON:

```json
{
  "gameType": "basketball",
  "frameSize": [1280, 720],
  "rim": { "left": [x, y], "right": [x, y] },
  "rimZone":  { "x": 0, "y": 0, "w": 0, "h": 0 },
  "netZone":  { "x": 0, "y": 0, "w": 0, "h": 0 },
  "countLineY": 0,
  "ball": { "hMin": 0, "hMax": 0, "sMin": 0, "vMin": 0, "areaPx": 0 },
  "baseline": "<downscaled empty-scene image, base64>"
}
```

- User taps left and right rim edges; defaults: rim zone = a band just above the rim line
  about 0.6 ball-diameters tall; net zone = rim width × net height below; count line at
  ~50% of the net zone.
- "Show the ball" step: user holds the ball in a box on screen; learn an HSV range and the
  typical blob area at net distance (`areaPx`).
- Baseline: average of ~30 frames of the empty scene; updates slowly during play
  (only pixels with no ball detected) to absorb lighting drift.

## Algorithm — basketball

Per frame, inside rimZone ∪ netZone:

1. **Mask:** pixel matches ball HSV range AND differs from baseline by > threshold.
2. **Blobs:** connected components; drop blobs < 0.3 × `areaPx`.
3. **Track:** match blobs to existing tracks by nearest centroid (max jump scaled to fps);
   new blobs start new tracks; tracks expire after ~150 ms unseen.
4. **Count:** a track scores when its centroid crosses `countLineY` **downward** AND it was
   seen in rimZone within the previous 0.4 s. Each track scores at most once.
5. **Overlap:** if a scoring blob's area ≥ 1.7 × `areaPx`, count 2 (≥ 2.6 × → 3) and lower confidence.
6. **Reject:** tracks that leave the rim zone sideways or upward never cross the line → no score.
7. **Confidence (0–1):** higher for clean single blobs with a clear downward path through the
   rim zone and net movement detected; lower for overlaps, short tracks, or no rim-zone sighting.

Capture: request 60 fps (`frameRate: { ideal: 60 }`); fall back to 30. Work at a downscaled
resolution where possible (e.g. 640 px wide).

## Camera setup + algorithm — putt-skee (Phase 6)

- Phone fixed above and in front of the target face, looking down at the holes.
- Matte dark target face, bright ball, four ArUco corner markers, steady light, visible
  miss gutter, one ball at a time.
- Calibration: detect markers (or tap 4 corners) → homography → project hole circles from a
  layout file; drag to adjust; learn ball colour; capture baseline.
- Per hole, a state machine:
  1. `empty` → ball colour present ≥ 2 frames → `present`
  2. `present` → returns to baseline within 0.5 s AND ball not seen in a neighbouring hole → `scored`
  3. ball reappears next door → it was a pass-over; reset
  4. after any score, global cooldown ~1.5 s
- Miss gutter zone → `throw` with `miss`.

## Eval harness

`pnpm vision:eval <gameType>` decodes each clip in `fixtures/<gameType>/clips/`, runs the
detector with `fixtures/<gameType>/calibration.json`, and compares to `labels.json`.

`labels.json` schema:

```json
[
  { "clip": "shot_001.mp4", "kind": "single", "baskets": 1 },
  { "clip": "shot_002.mp4", "kind": "single", "baskets": 0, "note": "rim-out" },
  { "clip": "rapid_01.mp4", "kind": "rapid", "baskets": 23 }
]
```

(For putt-skee: `"throws": ["h30", "miss", ...]` in order.)

Report: single-shot accuracy (%), rapid-fire count error per clip (absolute and %),
and a failure list with clip name and timestamps. Save results to `fixtures/<gameType>/last-eval.json`
so changes can be compared.

## ML upgrade (only if Phase 4's gate fails)

Use the clips saved around every live event, label them, train a small object detector
(YOLO "nano"-size) on extracted frames, and run it in the browser with TensorFlow.js or
ONNX Runtime Web. It replaces only the mask/blob step; tracking, counting and confidence
stay the same.
