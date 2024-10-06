import React from 'react';
import './Tutorial.css';
import mapWithAnnotations from '../assets/images/Map with annotations.jpg';
//import navigateMapVideo from '../assets/images/navigate map.mp4';
//import layerFeatureSelectionVideo from '../assets/images/Layer and Feature selection.mp4';
//import basemapLayerSelectionVideo from '../assets/images/basemap layer selection.mp4';
//import drawFeatureVideo from '../assets/images/draw feature.mp4';
//import searchingForPropertiesVideo from '../assets/images/Seaching for properties.mp4';


const Tutorial = ({ onClose }) => {
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-popup">
        <button className="back-button" onClick={onClose}>
          &larr; Back
        </button>
        
      </div>
    </div>
  );
};

export default Tutorial;
