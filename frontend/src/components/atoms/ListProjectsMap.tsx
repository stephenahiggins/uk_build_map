import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface Project {
  id: string;
  title: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface ListProjectsMapProps {
  projects: Project[];
}

const DEFAULT_POSITION = { lat: 54, lng: -3 };
const DEFAULT_ZOOM = 5.5;
const UK_BOUNDS = {
  south: 49.5,
  west: -8.7,
  north: 60.9,
  east: 2.1,
};

// Adjust the map boundaries to focus on the given projects
// This is just a UX helper to avoid the user having to zoom out/in manually
const FitBounds: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const map = useMap();

  useEffect(() => {
    const filtered = projects.filter(
      (p) => p.latitude != null && p.longitude != null
    );

    const ukFiltered = filtered.filter((project) => {
      const lat = project.latitude!;
      const lng = project.longitude!;
      return (
        lat >= UK_BOUNDS.south &&
        lat <= UK_BOUNDS.north &&
        lng >= UK_BOUNDS.west &&
        lng <= UK_BOUNDS.east
      );
    });

    if (ukFiltered.length === 0) {
      const ukBounds = L.latLngBounds(
        [UK_BOUNDS.south, UK_BOUNDS.west],
        [UK_BOUNDS.north, UK_BOUNDS.east]
      );
      map.fitBounds(ukBounds, {
        padding: [20, 20],
        maxZoom: 7,
      });
      return;
    }

    if (ukFiltered.length === 1) {
      // If only one UK marker, center on it with a reasonable zoom
      const project = ukFiltered[0];
      map.setView([project.latitude!, project.longitude!], 10);
      return;
    }

    // Create bounds from all marker positions
    const bounds = L.latLngBounds(
      ukFiltered.map((project) => [project.latitude!, project.longitude!])
    );

    // Fit the map to show all markers with padding
    map.fitBounds(bounds, {
      padding: [20, 20], // Add 20px padding on all sides
      maxZoom: 12, // Prevent zooming in too far for better context
    });
  }, [map, projects]);

  return null;
};

const getMarkerColor = (status: string) => {
  switch (status) {
    case 'RED':
      return '#ef4444';
    case 'AMBER':
      return '#f59e42';
    case 'GREEN':
      return '#22c55e';
    default:
      return '#2563eb';
  }
};

const ListProjectsMap: React.FC<ListProjectsMapProps> = ({ projects }) => {
  const filtered = projects.filter(
    (p) => p.latitude != null && p.longitude != null
  );

  // Use default center, but the FitBounds component will adjust it
  const center = DEFAULT_POSITION;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      style={{ height: '500px', width: '100%', borderRadius: '12px' }}
      className="shadow-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds projects={projects} />
      {filtered.map((project) => {
        const markerIcon = new L.DivIcon({
          html: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='none' viewBox='0 0 32 32'><circle cx='16' cy='16' r='10' fill='${getMarkerColor(
            project.status
          )}' stroke='#fff' stroke-width='3'/><circle cx='16' cy='16' r='5' fill='#fff'/></svg>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
        return (
          <Marker
            key={project.id}
            position={{ lat: project.latitude!, lng: project.longitude! }}
            icon={markerIcon}
            eventHandlers={{
              click: () => (window.location.href = `/project/${project.id}`),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -32]}
              opacity={1}
              permanent={false}
              className="bg-white text-gray-900 rounded shadow px-2 py-1 text-xs"
            >
              <div className="font-semibold">{project.title}</div>
              <div className="mt-0.5">
                Status:{' '}
                <span
                  className={`font-bold ${
                    project.status === 'RED'
                      ? 'text-red-600'
                      : project.status === 'AMBER'
                        ? 'text-yellow-500'
                        : project.status === 'GREEN'
                          ? 'text-green-600'
                          : 'text-blue-600'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export { ListProjectsMap };
