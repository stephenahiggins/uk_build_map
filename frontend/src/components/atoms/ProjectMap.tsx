import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
interface ProjectMapProps {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  defaultZoom?: number;
}

// Default: London, UK
const DEFAULT_POSITION = { lat: 51.5074, lng: -0.1278 };
const DEFAULT_ZOOM = 10;
const MARKER_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='none' viewBox='0 0 32 32'><circle cx='16' cy='16' r='10' fill='#2563eb' stroke='#fff' stroke-width='3'/><circle cx='16' cy='16' r='5' fill='#fff'/></svg>`;

const customIcon = new L.DivIcon({
  html: MARKER_SVG,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const ProjectMap: React.FC<ProjectMapProps> = ({
  latitude,
  longitude,
  title,
  defaultZoom,
}) => {
  const hasLocation = latitude != null && longitude != null;
  const position = hasLocation
    ? { lat: latitude!, lng: longitude! }
    : DEFAULT_POSITION;
  const zoom = hasLocation ? (defaultZoom ?? DEFAULT_ZOOM) : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: '220px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasLocation && (
        <Marker position={position} icon={customIcon}>
          <Popup>{title || 'Project Location'}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default ProjectMap;
