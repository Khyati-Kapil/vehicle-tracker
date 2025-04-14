import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import axios from 'axios';
import carIconPng from './assets/car.png';

const vehicleIcon = new L.Icon({
  iconUrl: carIconPng,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const start = [28.6139, 77.2090];
const end = [28.6199, 77.2390];

const yesterdayRouteData = [
  [28.6145, 77.2101],
  [28.6150, 77.2115],
  [28.6155, 77.2130],
  [28.6160, 77.2145],
  [28.6165, 77.2160],
  [28.6170, 77.2175],
  [28.6175, 77.2190],
  [28.6180, 77.2305],
  [28.6185, 77.2320],
  [28.6190, 77.2335],
  [28.6195, 77.2350],
  [28.6200, 77.2265],
  [28.6205, 77.2280],
  [28.6210, 77.2295],
  [28.6215, 77.2310],
  [28.6220, 77.2325],
];

function App() {
  const [vehiclePosition, setVehiclePosition] = useState(start);
  const [routeData, setRouteData] = useState([]);
  const [selectedOption, setSelectedOption] = useState("today");
  const [isTracking, setIsTracking] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const apiKey = '5b3ce3597851110001cf624885b04e3a393840719ed095b9bc4e2d28';
        const url = 'https://api.openrouteservice.org/v2/directions/driving-car';

        const response = await axios.get(url, {
          params: {
            api_key: apiKey,
            start: `${start[1]},${start[0]}`,
            end: `${end[1]},${end[0]}`,
            geometry_simplify: false,
            geometry_format: 'geojson',
          },
        });
        

        const coordinates = response.data.features[0].geometry.coordinates;
        const latLngCoords = coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteData(latLngCoords);
        setVehiclePosition(latLngCoords[0]);
      } catch (error) {
        console.error('Failed to fetch route:', error);
      }
    };

    if (selectedOption === "today") {
      fetchRoute();
    } else if (selectedOption === "yesterday") {
      setRouteData(yesterdayRouteData);
      setVehiclePosition(yesterdayRouteData[0]);
    }
  }, [selectedOption]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isTracking && routeData.length > 0) {
      indexRef.current = 0;
      intervalRef.current = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % routeData.length;
        setVehiclePosition(routeData[indexRef.current]);
      }, 500);
    }

    return () => clearInterval(intervalRef.current);
  }, [isTracking, routeData]);

  const handleStartTracking = () => {
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    setIsTracking(false);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div>
          <h2>Vehicle Tracker</h2>
          <div className="info-box">
            <label htmlFor="route-select" style={{ fontWeight: 'bold' }}>
              Select Route:
            </label>
            <select
              id="route-select"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              style={{ width: '100%', marginTop: '10px', padding: '8px', borderRadius: '8px' }}
            >
              <option value="today">Live Route (Today)</option>
              <option value="yesterday">Yesterday's Route</option>
            </select>

            <p style={{ marginTop: '15px' }}>
              Currently showing: <strong>{selectedOption === "today" ? "Live Route" : "Yesterday's Route"}</strong>
            </p>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleStartTracking}
                style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#28a745', color: 'white', border: 'none' }}
              >
                Start Tracking
              </button>
              <button
                onClick={handleStopTracking}
                style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
              >
                Stop Tracking
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="map-container">
        <MapContainer center={vehiclePosition} zoom={14} style={{ height: '100vh', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={vehiclePosition} icon={vehicleIcon} />
          <Polyline positions={routeData} color="blue" weight={5} />
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
