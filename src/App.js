import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Intro from './pages/Intro';
import Map from './pages/Mapy';
import Search from './pages/Search';
import { DataProvider } from './assets/DataContext';  // Ensure correct import of DataContext
import Print from './pages/Print';
import MainHeader from './pages/MainHeader';

function App() {
  const [activeTab, setActiveTab] = useState('intro');  // Set default to 'intro'
  const [selectedFeature, setSelectedFeature] = useState(null);
  const mapRef = useRef(null);
  const [isMapLoading, setIsMapLoading] = useState(false); // Track map loading state
  const [hasMapStartedLoading, setHasMapStartedLoading] = useState(false); // Track if map has started loading

  const handleMapButtonClick = () => {
    setActiveTab('map');
    setHasMapStartedLoading(true); // Set the map to start loading
    setIsMapLoading(true); // Set map loading state to true
    
    // Simulate map loading delay
    setTimeout(() => {
      setIsMapLoading(false); // Set map loading to false once "loaded"
    }, 2000); // Simulate a 2-second delay, adjust as needed

    // Navigate to the map by changing window location
    window.location.href = '/map';
  };

  return (
    <DataProvider> {/* Wrap your app with DataProvider to make context available globally */}
      <Router>
        <MainHeader activeTab={activeTab} onTabChange={setActiveTab} />

        <Routes>
          <Route
            path="/"
            element={
              <Intro
                isMapLoading={isMapLoading}
                onStartClick={handleMapButtonClick} // Pass down map button click handler
              />
            }
          />
          <Route
            path="/map"
            element={
              <>
                {hasMapStartedLoading && isMapLoading ? (
                  <div className="spinner">Loading Map...</div> // Show spinner while map is loading
                ) : (
                  <Map
                    ref={mapRef}
                    selectedFeature={selectedFeature}
                    setSelectedFeature={setSelectedFeature}
                    isVisible={activeTab === 'map'} // Control visibility of the map component
                  />
                )}
              </>
            }
          />
          <Route
            path="/search"
            element={
              <Search
                setSelectedFeature={setSelectedFeature}
                onTabChange={setActiveTab} // Pass onTabChange to Search for tab switching
              />
            }
          />
          <Route path="/print" element={<Print />} />
        </Routes>
      </Router>
    </DataProvider>
  );
}

export default App;
