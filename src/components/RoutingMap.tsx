'use client';

import { useEffect, useRef, useState } from 'react';
import polyline from 'polyline';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import type { Osrm } from '../model/osrm';
import L from 'leaflet';
import axios from 'axios';

interface RoutingProps {
  start: [number, number];
  end: [number, number];
  vehicleLocation: [number, number];
  isRouting: boolean;
}

const greenIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function VehicleMarker({ position }: { position: [number, number] }) {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        html: '🚗',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })}
    />
  );
}

const OSRM_SERVER = 'https://dev.enrutat.com/map/route/v1/driving';

async function calculateRoute(from: [number, number], to: [number, number]) {
  try {
    const fromReversed = [from[1], from[0]];
    const toReversed = [to[1], to[0]];

    const url = `${OSRM_SERVER}/${fromReversed.join(',')};${toReversed.join(',')}?overview=false&alternatives=true&steps=true&hints=;`;
    console.log('Consultando OSRM:', url);

    const res = await axios.get<Osrm>(url);
    const data = res.data;

    if (!data.routes || data.routes.length === 0) {
      console.warn('OSRM no devolvió ninguna ruta válida');
      return { distance: 0, duration: 0, geometry: [] as [number, number][] };
    }

    const route = data.routes[0];
    const geometry: [number, number][] = [];

    for (const leg of route.legs) {
      for (const step of leg.steps) {
        if (step.geometry) {
          const decoded = polyline.decode(step.geometry);
          geometry.push(
            ...decoded.map(([lat, lng]): [number, number] => [lng, lat])
          );
        }
      }
    }

    return {
      distance: route.distance,
      duration: route.duration,
      geometry,
    };
  } catch (error) {
    console.error('Error al calcular la ruta:', error);
    return { distance: 0, duration: 0, geometry: [] as [number, number][] };
  }
}

function getDistance(a: [number, number], b: [number, number]): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 6371e3;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const aVal =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}

function getProgress(
  vehicle: [number, number],
  start: [number, number],
  end: [number, number],
  routeDistance: number
): number {
  const vehicleToEnd = getDistance(vehicle, end);
  const coveredDistance = routeDistance - vehicleToEnd;
  const percent = (coveredDistance / routeDistance) * 100;
  return Math.min(Math.max(percent, 0), 100);
}

function formatDuration(seconds: number) {
  if (seconds <= 0 || isNaN(seconds)) return '0h 0m';
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function MapEffect({ start, end, vehicleLocation, isRouting, setInfo }: RoutingProps & { setInfo: Function }) {
  const map = useMap();
  const drawnLayersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    const draw = async () => {
      drawnLayersRef.current.forEach((layer) => map.removeLayer(layer));
      drawnLayersRef.current = [];

      const fullRoute = await calculateRoute(start, end);
      const routeToEvaluate = await calculateRoute(vehicleLocation, isRouting ? end : start);

      console.log('Ruta completa:', fullRoute);
      console.log('Ruta vehículo:', routeToEvaluate);

      if (fullRoute.geometry.length > 0) {
        const fullPolyline = L.polyline(fullRoute.geometry, { color: 'green' }).addTo(map);
        drawnLayersRef.current.push(fullPolyline);
      }

      if (routeToEvaluate.geometry.length > 0) {
        const dynamicPolyline = L.polyline(routeToEvaluate.geometry, {
          color: isRouting ? 'red' : 'blue',
          dashArray: '5,10',
        }).addTo(map);
        drawnLayersRef.current.push(dynamicPolyline);
      }

      const progress = getProgress(vehicleLocation, start, end, fullRoute.distance);

      setInfo({
        totalDistanceKm: (fullRoute.distance / 1000).toFixed(2),
        vehicleToTargetKm: (routeToEvaluate.distance / 1000).toFixed(2),
        progressPercent: progress.toFixed(2),
        estimatedTime: formatDuration(routeToEvaluate.duration),
        totalEstimatedTime: formatDuration(fullRoute.duration),
      });

      map.setView(vehicleLocation, 10);
    };

    draw();
    const interval = setInterval(draw, 60000);
    return () => clearInterval(interval);
  }, [start, end, vehicleLocation, isRouting]);

  return null;
}

export default function RoutingMap(props: RoutingProps) {
  const [info, setInfo] = useState({
    totalDistanceKm: '0',
    vehicleToTargetKm: '0',
    progressPercent: '0',
    estimatedTime: '0h 0m',
    totalEstimatedTime: '0h 0m',
  });

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <MapContainer
        center={props.vehicleLocation}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution="OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={props.start} icon={greenIcon}>
          <Popup>Inicio</Popup>
        </Marker>
        <Marker position={props.end} icon={redIcon}>
          <Popup>Destino</Popup>
        </Marker>
        <VehicleMarker position={props.vehicleLocation} />
        <MapEffect {...props} setInfo={setInfo} />
      </MapContainer>

      <div className="bg-white p-4 rounded shadow w-full max-w-xl text-center text-sm">
        <p>
          🟩 Ruta origen → destino: <strong>{info.totalDistanceKm} km</strong>
        </p>
        <p>
          {props.isRouting ? '🔴 Vehículo → destino:' : '🔵 Vehículo → origen:'}{' '}
          <strong>{info.vehicleToTargetKm} km</strong>
        </p>
        <p>
          📍 Progreso de ruta: <strong>{info.progressPercent}%</strong>
        </p>
        <p>
          ⏱️ Tiempo estimado (vehículo → destino/origen):{' '}
          <strong>{info.estimatedTime}</strong>
        </p>
        <p>
          ⏲️ Tiempo total estimado (inicio → destino):{' '}
          <strong>{info.totalEstimatedTime}</strong>
        </p>

        {info.totalDistanceKm === '0' && (
          <p className="text-red-600 font-semibold">
            ⚠️ No se pudo calcular la ruta. Verifica los puntos.
          </p>
        )}
      </div>
    </div>
  );
}