// web-component.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import RoutingMap from "./RoutingMap"; // o la ruta correcta
import reactToWebComponent from "react-to-webcomponent";

// Necesitas importar los estilos de Leaflet para que funcionen los mapas
import "leaflet/dist/leaflet.css";

// Registra el custom element
const RoutingMapElement = reactToWebComponent(RoutingMap, React, ReactDOM);

customElements.define("routing-map", RoutingMapElement);
