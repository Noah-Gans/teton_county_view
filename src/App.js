import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Intro from './pages/Intro';
import Map from './pages/Mapy';
import Search from './pages/Search';
import SidePanel from "./components/SidePanel";
import { DataProvider } from './assets/DataContext';
import Print from './pages/Print';
import MainHeader from './pages/MainHeader';
import Tutorial from './components/Tutorial'; // Import the new Tutorial page
import Updates from './pages/Updates'; // Import the new Updates page
import { MapProvider } from './pages/MapContext';
import { UserProvider } from './contexts/UserContext'; // Import UserContext
import Login from './components/Login'; // Import Login component
import LoginDropdown from "./components/LoginDropdown";
import SignUp from "./components/SignUp";
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('intro');  // Default to 'intro'
  console.log("App is re-rendering");

  return (
    <UserProvider> {/* Wrap the app with UserProvider */}
      <MapProvider>
        <DataProvider>
          <Router>
            <div className="app-container">
              <LoginDropdown />
              <MainHeader activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Always render the map, so it stays in the background */}
              <div className="map-container">
                <Map />
              </div>

              {/* Components that overlay the map */}
              <div className="overlay-container">
                <Routes>
                  <Route path="/" element={<Intro onStartClick={() => setActiveTab('map')} />} />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Search onTabChange={setActiveTab} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/print"
                    element={
                      <ProtectedRoute>
                        <Print />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/tutorial" element={<Tutorial />} />
                  <Route path="/updates" element={<Updates />} />
                  <Route path="/login" element={<Login />} /> {/* Add Login Route */}
                  <Route path="/signup" element={<SignUp />} />
                </Routes>
              </div>
            </div>
          </Router>
        </DataProvider>
      </MapProvider>
    </UserProvider>
  );
}

export default App;
