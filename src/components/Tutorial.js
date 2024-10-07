import React from 'react';
import './Tutorial.css';
import mapWithAnnotations from '../assets/images/Map with annotations.jpg';
import zoomPhoto from '../assets/images/zoo.jpg';
import school from '../assets/images/School.jpg';
import sidePanelOwnership from '../assets/images/Basic side panel.jpg';
import sidePanel from '../assets/images/side panel.jpg';
import before from '../assets/images/ownershipBefore.jpg';
import owenrship from '../assets/images/ownership.jpg';
import publicBefore from '../assets/images/publicSide.jpg';
import publicAfter from '../assets/images/publicInfo.jpg';
import baseMap from '../assets/images/basemap.jpg';
import search from '../assets/images/save.jpg';

//import layerFeatureSelectionVideo from '..src/assets/images/tool panel zoom.jpg;
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
        <div className="tutorial-content">
          <h1>How to Use Teton County View</h1>
          <p>Welcome to the tutorial! Here you will learn how to explore spatial data in Teton County View.</p>
          <hr className="section-divider" />
          <h2>Controls and Buttons</h2>
          <p>Below is an identification of all of the buttons and features in the map. The data files are updated in the morning after the county updates their files at night. The time of update is shown in the top right. </p>
          <img src={mapWithAnnotations} alt="Map with annotations" className="step-image" />
          <hr className="section-divider" />
          <h2>Navigate the Map</h2>
          <p>Use your mouse wheel or the zoom buttons in the tool panel (shown below with + and -) to zoom in and out of the map. Click and drag to pan the map around.</p>
          <img src={zoomPhoto} alt="Map with annotations" className="step-image" />
          
          <hr className="section-divider" />
          <h2>Selecting Features</h2>
          <p>Features, or ownership lots in the case of the ownership layer, can be selected simply by clicking them on the map. When selected they will highlight red and the details of the feature will populate in the side panel infor tab. </p>
          <p>In the example below, the wilson school building was selected and its ownerhishp information from the county populates the info tab </p>
          <img src={school} alt="Map with annotations" className="step-image" />
          <hr className="section-divider" />
          <h2>The Side Panel</h2>
          <p> The side panel contains all the layers that can be shown on the platform at the moment. They are grouped 
            into different catagories which can be expanded by clicking the respective grey rounded rectangles. 
            In the right photo below, the public lands group has been expanded and the public land layer is 
            slected. Layers with lots of different feature types will contain a ledgend. Legends can be expanded by clicking the brown
            Legend button. The right image has the legend expanded. </p>
          <img src={sidePanelOwnership} alt="Map with annotations" className="ownership-side image-spacing" />
          <img src={sidePanel} alt="Map with annotations" className="public-side image-spacing" />
          <hr className="section-divider" />
          <h2>Managing the Top Layer and Selcting Features</h2>
          <p> The most confusing part of this GIS platform is managing the layer on top. In the side panel the most recently selected 
            layer is on top which is indcated by a black underline of the layer name in the side panel. In the first photo below, the Ownership layer
            was last selected and is currently top. When clicking features on the map information from the ownerhsip dataset will populate in the info tab, see the second photo.
            <br />
            <br />
            In the thrid from the top photo, the Public Land layer was last selcted and it is currently on top as signified with the black underline. Now when clicking 
            a feature on the map it will populate the infor tab with the details from that dataset which is from the state public lands database. To move a layer to the top, just unselect it and reselect it.   </p>
            <img src={before} alt="Map with annotations" className="step-image" />
            <img src={owenrship} alt="Map with annotations" className="step-image" />
            <img src={publicBefore} alt="Map with annotations" className="step-image" />
            <img src={publicAfter} alt="Map with annotations" className="step-image" />
            <hr className="section-divider" />

          <h2>Basemap Layer Selection</h2>
          <p>Basemaps can be selected in the bottom left</p>
          <img src={baseMap} alt="Map with annotations" className="step-image" />
          <h2>Use the Tool Panel to Draw on the Map</h2>
          <p>Also included in the tool panel is are the draw tools. From left to right, after the two zoom tools, are the draw line tool, draw polygon tool, clear drawings button, and eddit drawings button. All of them are pretty self explanatory so get in there and play around with them </p>
          <img src={zoomPhoto} alt="Map with annotations" className="step-image" />

          <h2>Searching for Properties</h2>
          <p>The search feature is accessed by clicking the search tab in the top left. You can search by adress, owner, so keep it general and you should get you result. The reuslts are shown in a list an you can visit the properites detailed page by clicking the Detail Button or see it highligted in the map by clicking the Map button</p>
          <img src={search} alt="Map with annotations" className="step-image" />

          {/* Add video below step 6 */}
          
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
