import { feature } from "topojson-client";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import land110 from "world-atlas/land-110m.json";
import countries50 from "world-atlas/countries-50m.json";

let _land: Feature<Geometry> | null = null;
let _countries: FeatureCollection<Geometry, { name: string }> | null = null;

export function land(): Feature<Geometry> {
  if (!_land) {
    const topo = land110 as any;
    const fc = feature(topo, topo.objects.land) as unknown as FeatureCollection<Geometry>;
    _land = { type: "Feature", properties: {}, geometry: { type: "GeometryCollection", geometries: fc.features.map((f) => f.geometry) } } as Feature<Geometry>;
  }
  return _land;
}

export function countries(): FeatureCollection<Geometry, { name: string }> {
  if (!_countries) {
    const topo = countries50 as any;
    _countries = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
  }
  return _countries;
}

export interface LonLat {
  lon: number;
  lat: number;
}
