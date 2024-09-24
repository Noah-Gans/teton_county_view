import React, { useState } from 'react';
import './Intro.css';

const Intro = ({ isMapLoading, onStartClick }) => {
  const [showSpinner, setShowSpinner] = useState(false);

  const handleStartClick = () => {
    setShowSpinner(true); // Show spinner immediately when button is clicked
    onStartClick(); // Trigger the map loading and navigation
  };

  return (
    <div className="intro">
      <h1>Welcome to Teton County View</h1>
      <p>This application provides spatial data for Teton County.</p>
      <button onClick={handleStartClick} className="start-button">
        Start Exploring
      </button>

      {/* Show the spinner if the map is still loading */}
      {showSpinner && isMapLoading && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading Map...</p>
        </div>
      )}
    </div>
  );
};

export default Intro;
