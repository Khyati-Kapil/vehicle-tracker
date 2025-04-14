import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import carIconImage from '../assets/car.png';

const carIcon = new L.Icon({
  iconUrl: carIconImage,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const MapView = ({ vehiclePosition, route }) => {
  return (
    <MapContainer center={vehiclePosition} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <Marker position={vehiclePosition} icon={carIcon} />
      <Polyline positions={route} color="green" weight={4} />
    </MapContainer>
  );
};

export default MapView;
