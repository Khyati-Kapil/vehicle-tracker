import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import axios from 'axios';
import carIconPng from './assets/car.png';

const startToday = [28.6139, 77.2109];
const endToday = [28.6199, 77.2400];

const startYesterday = [28.6149, 77.2139];
const endYesterday = [28.6210, 77.2410];

const startLastWeek = [28.6100, 77.2000]; 
const endLastWeek = [28.6300, 77.2600];   

const routeInfo = {
  today: { distance: 12, time: 25 },     
  yesterday: { distance: 18, time: 30 },   
  lastweek: { distance: 38, time: 90 },   
};

const fetchRoute = async (start, end) => {
  const apiKey = '5b3ce3597851110001cf624885b04e3a393840719ed095b9bc4e2d28';
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car';

  try {
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
    return coordinates.map(([lng, lat]) => [lat, lng]);
  } catch (error) {
    console.error('Failed to fetch route:', error);
    return [];
  }
};

const getAngle = (from, to) => {
  const dy = to[0] - from[0];
  const dx = to[1] - from[1];
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

function RotatingMarker({ position, angle }) {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: 'rotating-marker',
        html: `<div style="transform: rotate(${angle}deg); width: 40px; height: 40px;">
                 <img src="${carIconPng}" style="width: 100%; height: 100%;" />
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })}
    />
  );
}

function App() {
  const [vehiclePosition, setVehiclePosition] = useState(startToday);
  const [routeData, setRouteData] = useState([]);
  const [selectedOption, setSelectedOption] = useState("today");
  const [isTracking, setIsTracking] = useState(false);
  const [angle, setAngle] = useState(0);
  const [isRouteGenerated, setIsRouteGenerated] = useState(false);
  const [routeDistance, setRouteDistance] = useState(routeInfo.today.distance);
  const [routeTime, setRouteTime] = useState(routeInfo.today.time);

  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  const handleGenerateRoute = async () => {
    setIsRouteGenerated(false);
    setIsTracking(false);
    clearInterval(intervalRef.current);

    let route = [];

    if (selectedOption === "today") {
      route = await fetchRoute(startToday, endToday);
      setRouteDistance(routeInfo.today.distance);
      setRouteTime(routeInfo.today.time);
    } else if (selectedOption === "yesterday") {
      route = await fetchRoute(startYesterday, endYesterday);
      setRouteDistance(routeInfo.yesterday.distance);
      setRouteTime(routeInfo.yesterday.time);
    } else {
      route = await fetchRoute(startLastWeek, endLastWeek);
      setRouteDistance(routeInfo.lastweek.distance);
      setRouteTime(routeInfo.lastweek.time);
    }

    if (route.length > 0) {
      setRouteData(route);
      setVehiclePosition(route[0]); // Move vehicle to starting point of new route
      setAngle(0);
      setIsRouteGenerated(true);
    }
  };

  const handleStartTracking = () => {
    if (routeData.length === 0) return;
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    setIsTracking(false);
  };

 
  useEffect(() => {
    setRouteData([]);
    setIsTracking(false);
    setIsRouteGenerated(false);
    setVehiclePosition(selectedOption === 'today' ? startToday : selectedOption === 'yesterday' ? startYesterday : startLastWeek);
    setAngle(0);
    setRouteDistance(routeInfo[selectedOption].distance);
    setRouteTime(routeInfo[selectedOption].time);
    clearInterval(intervalRef.current);
  }, [selectedOption]);

  // Movement logic
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isTracking && routeData.length > 0) {
      indexRef.current = 0;
      intervalRef.current = setInterval(() => {
        const currentIndex = indexRef.current;
        const nextIndex = (currentIndex + 1) % routeData.length;
        const newPos = routeData[nextIndex];
        const direction = getAngle(routeData[currentIndex], newPos);

        setVehiclePosition(newPos);
        setAngle(direction);
        indexRef.current = nextIndex;

        if (nextIndex === routeData.length - 1) {
          clearInterval(intervalRef.current);
          setIsTracking(false);
        }
      }, 500); // Fixed speed here
    }

    return () => clearInterval(intervalRef.current);
  }, [isTracking, routeData]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="sidebar-title">🚗 Vehicle Tracker</h2>

        <div className="sidebar-box route-selector-box">
          <label htmlFor="route-select" className="label">
            Select Route
          </label>
          <select
            id="route-select"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="route-select"
          >
            <option value="today">Live Route (Today)</option>
            <option value="yesterday">Yesterday's Route</option>
            <option value="lastweek">Last Week's Route</option>
          </select>
          <p className="route-description">
            Showing: <strong>{selectedOption === "today" ? "Live Route" : selectedOption === "yesterday" ? "Yesterday's Route" : "Last Week's Route"}</strong>
          </p>
        </div>

        <div className="sidebar-box tracking-controls-box">
          <label className="label">Tracking Controls</label>
          <div className="button-group">
            <button onClick={handleGenerateRoute} className="button generate-button">
              📍 Generate Route
            </button>

            <button
              onClick={handleStartTracking}
              disabled={!isRouteGenerated || isTracking}
              className={`button start-button ${!isRouteGenerated || isTracking ? 'disabled' : ''}`}
            >
              ▶ Start
            </button>

            <button
              onClick={handleStopTracking}
              disabled={!isTracking}
              className={`button stop-button ${!isTracking ? 'disabled' : ''}`}
            >
              ⏹ Stop
            </button>
          </div>
        </div>

        {/* Distance and Time Information */}
        <div className="sidebar-box route-info-box">
          <p><strong>Distance:</strong> {routeDistance} km</p>
          <p><strong>Time:</strong> {routeTime} minutes</p>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <MapContainer center={vehiclePosition} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <RotatingMarker position={vehiclePosition} angle={angle} />
          {isRouteGenerated && <Polyline positions={routeData} color="blue" weight={5} />}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;


