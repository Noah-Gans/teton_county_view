import React from 'react';
import './Tutorial.css';
import mapWithAnnotations from '../assets/images/Map with annotations.jpg';
import zoomPhoto from '../assets/images/zoo.jpg';
import school from '../assets/images/School.jpg';
import sidePanelOwnership from '../assets/images/Basic side panel.jpg';
import sidePanel from '../assets/images/side panel.jpg';
import before from '../assets/images/ownershipBefore.jpg';
import ownership from '../assets/images/ownership.jpg';
import publicBefore from '../assets/images/publicSide.jpg';
import publicAfter from '../assets/images/publicInfo.jpg';
import baseMap from '../assets/images/basemap.jpg';
import search from '../assets/images/save.jpg';
import { useNavigate } from 'react-router-dom'; // For navigation

const Tutorial = () => {
  const navigate = useNavigate(); // For navigation back to previous page

  return (
    <div className="tutorial-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      <div className="tutorial-content-container">
      <div className="tutorial-content">
            <h1>How to Use The Better Teton County GIS</h1>
            <p>Welcome to the tutorial! Here you will learn how to explore spatial data in Teton County.</p>
            <hr className="section-divider" />
            
            <h2>Controls and Buttons</h2>
            <p>The data files are updated in the morning after the county updates their files at night. The time of update is shown in the top right.</p>
            <img src={mapWithAnnotations} alt="Map with annotations" className="step-image" />
            
            <hr className="section-divider" />
            <h2>Navigate the Map</h2>
            <p>Use your mouse wheel or the zoom buttons in the tool panel to zoom in and out of the map. Click and drag to pan the map around.</p>
            <img src={zoomPhoto} alt="Zoom functionality" className="step-image" />

            <hr className="section-divider" />
            <h2>Selecting Features</h2>
            <p>Features, or ownership lots, can be selected by clicking them on the map. Selected features will highlight red and their details will be shown in the info tab of the side panel</p>
            <p>In the example below, the Wilson school building was selected, and its ownership information populates the info tab:</p>
            <img src={school} alt="Wilson school selection" className="step-image" />
            
            <hr className="section-divider" />
            <h2>The Side Panel</h2>
            <p>The side panel contains all the layers that can be shown on the platform. Layers with multiple feature types contain a legend, which can be expanded by clicking the 'Legend' button.</p>
            <img src={sidePanelOwnership} alt="Ownership side panel" className="image-spacing" />
            <img src={sidePanel} alt="Public side panel" className="image-spacing" />
            
            <hr className="section-divider" />
            <h2>Managing the Top Layer and Selecting Features</h2>
            <p>The most recently selected layer is on top, indicated by a black underline of the layer name in the side panel.</p>
            <p>To move a layer to the top, unselect and reselect it in the side panel. The following images illustrate how this works with the Ownership and Public Land layers:</p>
            <img src={before} alt="Ownership layer top" className="step-image" />
            <img src={ownership} alt="Ownership details in info tab" className="step-image" />
            <img src={publicBefore} alt="Public land layer top" className="step-image" />
            <img src={publicAfter} alt="Public land info" className="step-image" />
            
            <hr className="section-divider" />
            <h2>Basemap Layer Selection</h2>
            <p>Basemaps can be selected in the bottom left of the interface.</p>
            <img src={baseMap} alt="Basemap selection" className="step-image" />

            <hr className="section-divider" />
            <h2>Use the Tool Panel to Draw on the Map</h2>
            <p>Use the tool panel to draw lines and polygons, clear drawings, and edit them. The tool icons are self-explanatory, so feel free to experiment with them.</p>
            <img src={zoomPhoto} alt="Tool panel" className="step-image" />

            <hr className="section-divider" />
            <h2>Searching for Properties</h2>
            <p>The search feature allows you to search by address or owner. Results will display in a list, and you can view the property's details or highlight it on the map by clicking the respective buttons.</p>
            <img src={search} alt="Search properties" className="step-image" />
        </div>
        </div>
    </div>
  );
};

export default Tutorial;
