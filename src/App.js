import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Intro from './pages/Intro';
import Map from './pages/Mapy';
import Search from './pages/Search';
import { DataProvider } from './assets/DataContext';
import Print from './pages/Print';
import MainHeader from './pages/MainHeader';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('intro');  // Default to 'intro'
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [layerStatus, setLayerStatus] = useState({});  // Shared state for layer visibility

  return (
    <DataProvider>
      <Router>
        <div className="app-container">
          <MainHeader activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Always render the map, so it stays in the background */}
          <div className="map-container">
            <Map
              selectedFeature={selectedFeature}
              setSelectedFeature={setSelectedFeature}
              layerStatus={layerStatus} // Pass layer status to the map
              setLayerStatus={setLayerStatus} // Pass function to set layer status
            />
          </div>

          {/* Components that overlay the map */}
          <div className="overlay-container">
            <Routes>
              <Route path="/" element={<Intro onStartClick={() => setActiveTab('map')} />} />
              <Route
                path="/search"
                element={<Search setSelectedFeature={setSelectedFeature} onTabChange={setActiveTab} />}
              />
              <Route path="/print" element={<Print />} />
            </Routes>
          </div>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;
