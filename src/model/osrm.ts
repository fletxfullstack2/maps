export interface Osrm {
  code: string;
  routes: Route[];
  waypoints: Waypoint[];
}

export interface Route {
  legs: Leg[];
  distance: number;
  duration: number;
  weight_name: string;
  weight: number;
}

export interface Leg {
  steps: Step[];
  distance: number;
  duration: number;
  summary: string;
  weight: number;
}

export interface Step {
  intersections: Intersection[];
  driving_side: DrivingSide;
  geometry: string;
  mode: Mode;
  duration: number;
  maneuver: Maneuver;
  weight: number;
  distance: number;
  name: string;
  destinations?: string;
  ref?: string;
  rotary_name?: string;
}

export enum DrivingSide {
  Left = "left",
  Right = "right",
  SlightRight = "slight right",
  Straight = "straight",
}

export interface Intersection {
  out?: number;
  entry: boolean[];
  bearings: number[];
  location: number[];
  in?: number;
  lanes?: Lane[];
  classes?: string[];
}

export interface Lane {
  valid: boolean;
  indications: string[];
}

export interface Maneuver {
  bearing_after: number;
  type: string;
  modifier: DrivingSide;
  bearing_before: number;
  location: number[];
  exit?: number;
}

export enum Mode {
  Driving = "driving",
}

export interface Waypoint {
  hint: string;
  distance: number;
  name: string;
  location: number[];
}
