from __future__ import annotations

import json
import math
from pathlib import Path

SOURCE = Path("web/data/greece-nuts2-2024.geojson")
TARGET = Path("web/src/lib/greece-map-data.ts")

TARGET_WIDTH = 760
TARGET_HEIGHT = 980
PADDING = 28

GROUPS = {
    "amth": ["EL51"],
    "kentriki-makedonia": ["EL52"],
    "dytiki-makedonia": ["EL53"],
    "ipeiros-ionia": ["EL54", "EL62"],
    "thessalia": ["EL61"],
    "sterea": ["EL64"],
    "dytiki-ellada": ["EL63"],
    "peloponnisos": ["EL65"],
    "attiki": ["EL30"],
    "aigaio": ["EL41", "EL42"],
    "kriti": ["EL43"],
}


def walk_points(coords):
    if isinstance(coords[0], (int, float)):
        yield coords
        return

    for item in coords:
        yield from walk_points(item)


def iter_polygons(geometry):
    geometry_type = geometry["type"]
    coordinates = geometry["coordinates"]

    if geometry_type == "Polygon":
        return [coordinates]

    if geometry_type == "MultiPolygon":
        return coordinates

    raise ValueError(f"Unsupported geometry type: {geometry_type}")


def main() -> None:
    feature_collection = json.loads(SOURCE.read_text(encoding="utf-8"))
    greek_features = [
        feature
        for feature in feature_collection["features"]
        if feature["properties"]["CNTR_CODE"] == "EL"
    ]

    all_points = [
        point
        for feature in greek_features
        for point in walk_points(feature["geometry"]["coordinates"])
    ]

    min_lon = min(point[0] for point in all_points)
    max_lon = max(point[0] for point in all_points)
    min_lat = min(point[1] for point in all_points)
    max_lat = max(point[1] for point in all_points)
    mean_lat = (min_lat + max_lat) / 2
    lon_factor = math.cos(math.radians(mean_lat))

    def project(point):
        lon, lat = point
        return ((lon - min_lon) * lon_factor, max_lat - lat)

    projected_points = [project(point) for point in all_points]
    min_x = min(point[0] for point in projected_points)
    max_x = max(point[0] for point in projected_points)
    min_y = min(point[1] for point in projected_points)
    max_y = max(point[1] for point in projected_points)

    width = max_x - min_x
    height = max_y - min_y
    scale = min((TARGET_WIDTH - 2 * PADDING) / width, (TARGET_HEIGHT - 2 * PADDING) / height)
    offset_x = (TARGET_WIDTH - width * scale) / 2
    offset_y = (TARGET_HEIGHT - height * scale) / 2

    def format_number(value):
        rounded = round(value, 1)
        if rounded.is_integer():
            return str(int(rounded))
        return f"{rounded:.1f}".rstrip("0").rstrip(".")

    def to_svg_point(point):
        px, py = project(point)
        sx = (px - min_x) * scale + offset_x
        sy = (py - min_y) * scale + offset_y
        return format_number(sx), format_number(sy)

    features_by_nuts = {
        feature["properties"]["NUTS_ID"]: feature for feature in greek_features
    }

    region_shape_entries = []

    for region_id, nuts_codes in GROUPS.items():
        paths = []
        region_points = []

        for nuts_code in nuts_codes:
            geometry = features_by_nuts[nuts_code]["geometry"]
            for polygon in iter_polygons(geometry):
                commands = []
                for ring in polygon:
                    if not ring:
                        continue
                    region_points.extend(ring)
                    start_x, start_y = to_svg_point(ring[0])
                    commands.append(f"M{start_x} {start_y}")
                    for point in ring[1:]:
                        x, y = to_svg_point(point)
                        commands.append(f"L{x} {y}")
                    commands.append("Z")
                if commands:
                    paths.append(" ".join(commands))

        if not paths:
            raise ValueError(f"No paths generated for {region_id}")

        projected_region_points = [to_svg_point(point) for point in region_points]
        xs = [float(point[0]) for point in projected_region_points]
        ys = [float(point[1]) for point in projected_region_points]
        center_x = format_number((min(xs) + max(xs)) / 2)
        center_y = format_number((min(ys) + max(ys)) / 2)

        region_shape_entries.append(
            {
                "id": region_id,
                "labelX": center_x,
                "labelY": center_y,
                "paths": paths,
            }
        )

    lines = [
        "// Generated from Eurostat/GISCO NUTS 2024 Level 2 GeoJSON.",
        "// Regenerate with: python web/scripts/generate-greece-map-data.py",
        "",
        "export const GREECE_MAP_WIDTH = 760;",
        "export const GREECE_MAP_HEIGHT = 980;",
        "",
        "export type GreeceMapShape = {",
        "  labelX: number;",
        "  labelY: number;",
        "  paths: string[];",
        "};",
        "",
        "export const greeceMapShapes: Record<string, GreeceMapShape> = {",
    ]

    for shape in region_shape_entries:
        lines.append(f'  "{shape["id"]}": {{')
        lines.append(f'    labelX: {shape["labelX"]},')
        lines.append(f'    labelY: {shape["labelY"]},')
        lines.append("    paths: [")
        for path in shape["paths"]:
            escaped = path.replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'      "{escaped}",')
        lines.append("    ],")
        lines.append("  },")

    lines.append("};")
    lines.append("")

    TARGET.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
