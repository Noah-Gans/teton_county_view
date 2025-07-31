import React, { useState } from 'react';
import './SidePanel.css';
import { legends } from '../assets/legends';
import { layerNameMappings } from './layerMappings'; // Import layer mappings
import { useMapContext } from '../pages/MapContext';
import { useNavigate } from 'react-router-dom';
import { memo } from 'react';
import * as turf from '@turf/turf';

const SidePanel = memo(({
  isOpen,
  togglePanel,
  layerStatus,
  setLayerStatus, // Function to update the layer status
  selectedFeature = [], // Feature information from the map
  activeSidePanelTab,
  setActiveSidePanelTab,
  onFeatureHover,
}) => {
  console.log("SideTab is: ", activeSidePanelTab)
  // States to manage expanded/collapsed sections
  const { activeTab, setActiveTab } = useMapContext();
  const [isPlanningOpen, setIsPlanningOpen] = useState(false); // Minimized by default
  const [isOwnershipOpen, setIsOwnershipOpen] = useState(true); // Ownership expanded by default
  const [isPublicLandOpen, setIsPublicLandOpen] = useState(false);
  const [isPLSSOpen, setIsPLSSOpen] = useState(false);
  const [isRoadsOpen, setIsRoadsOpen] = useState(false);
  const [isPrecinctsOpen, setIsPrecinctsOpen] = useState(false);
  const [isControlPointsOpen, setIsControlPointsOpen] = useState(false);
  const [isAnimalHabitatOpen, setIsAnimalHabitatOpen] = useState(false);
  const [isNaturalHazardsOpen, setIsNaturalHazardsOpen] = useState(false);
  const {setHoveredFeatureId, setGlobalActiveTab, setIsFilterTriggered, layerOrder, setLayerOrder } = useMapContext();
  const navigate = useNavigate();

  // State to manage legend visibility for each layer
  const [isLegendOpen, setIsLegendOpen] = useState({});

  const calculateFeatureArea = (feature) => {
    if (!feature || !feature.geometry) return 'N/A';

    try {
        // Convert feature geometry into a Turf.js polygon/multi-polygon
        const featurePolygon = turf.feature(feature.geometry);

        // Calculate area in square meters
        const areaSqMeters = turf.area(featurePolygon);

        // Convert to acres (1 square meter = 0.000247105 acres)
        const areaAcres = (areaSqMeters * 0.000247105).toFixed(2);

        return `${areaAcres} acres`;
    } catch (error) {
        console.error("Error calculating area:", error);
        return 'N/A';
    }
};

  const handleLayerSelection = (layerName) => {
    // Toggle the layer visibility using setLayerStatus
    setLayerStatus(layerName);
    console.log("Oh Noooo!")
    // Update the layer order based on the new status of the layer
    setLayerOrder((prevOrder) => {
      // Determine if the layer is being toggled on or off
      const isLayerCurrentlyOn = layerStatus[layerName];

      let newOrder;

      if (!isLayerCurrentlyOn) {
        // If the layer is being toggled on, add it to the end of the order
        newOrder = [...prevOrder.filter((name) => name !== layerName), layerName];
      } else {
        // If the layer is being toggled off, remove it from the order
        newOrder = prevOrder.filter((name) => name !== layerName);
      }

      //console.log('Updated layerOrder:', newOrder);
      return newOrder;
    });
  };

  const toggleSection = (section) => {
    switch (section) {
      case 'Planning':
        setIsPlanningOpen(!isPlanningOpen);
        break;
      case 'Ownership':
        setIsOwnershipOpen(!isOwnershipOpen);
        break;
      case 'PublicLand':
        setIsPublicLandOpen(!isPublicLandOpen);
        break;
      case 'PLSS':
        setIsPLSSOpen(!isPLSSOpen);
        break;
      case 'Roads':
        setIsRoadsOpen(!isRoadsOpen);
        break;
      case 'Precincts':
        setIsPrecinctsOpen(!isPrecinctsOpen);
        break;
      case 'ControlPoints':
        setIsControlPointsOpen(!isControlPointsOpen);
        break;
      case 'CriticalAnimalHabitat':
        setIsAnimalHabitatOpen(!isAnimalHabitatOpen);
        break;
      case 'NaturalHazards':
        setIsNaturalHazardsOpen(!isNaturalHazardsOpen);
        break;
      default:
        break;
    }
  };
  const parseDescription = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const rows = doc.querySelectorAll('tr');
  
    const properties = {};
    rows.forEach((row) => {
      const cells = row.querySelectorAll('th, td');
      if (cells.length === 2) {
        const key = cells[0].textContent.trim().toLowerCase().replace(/ /g, '_');
        const value = cells[1].textContent.trim();
        properties[key] = value;
      }
    });
  
    return properties;
  };
  
  const renderFeatureDetails = (feature, index) => {
    // Parse the description HTML if it exists to extract the attributes
    const parsedDescription = feature.properties.description ? parseDescription(feature.properties.description) : {};
  
    // Determine feature type based on available properties
    
    const isOwnershipFeature = feature.properties.global_parcel_uid && feature.properties.owner_name;
    const isOwnershipAddress = parsedDescription.msag_zip || parsedDescription.st_name;
    const isPublicLandFeature = feature.properties.SURFACE || parsedDescription.holdagency || parsedDescription.sma_id;
    const isPrecinct = feature.properties.objectid || feature.pollingpla
    const isFEMA = feature.properties.FLD_AR_ID || feature.properties.FLD_ZONE
    const featureId = parsedDescription.pidn || feature.properties.pidn; // Use the unique ID from the feature
    console.log(isPublicLandFeature)
    console.log(feature.properties)
    return (
      <div key={index} className="feature-details" onMouseEnter={() => setHoveredFeatureId(featureId)} onMouseLeave={() => setHoveredFeatureId(null)}>
        <h3>Feature {index + 1}</h3>
        {isOwnershipAddress ? (
          <>
            <div><strong>Street Address:</strong> {parsedDescription.st_address || 'N/A'}</div>
            <div><strong>City:</strong> {parsedDescription.msag_city || 'N/A'}</div>
            <div><strong>State:</strong> {parsedDescription.state || 'N/A'}</div>
            <div><strong>ZIP Code:</strong> {parsedDescription.msag_zip || 'N/A'}</div>
            <div><strong>PIDN:</strong> {parsedDescription.pidn || 'N/A'}</div>
          </>
        ) : isOwnershipFeature ? (
          <>
            <div><strong>County:</strong> {feature.properties.county || 'N/A'}</div>
            <div><strong>State:</strong> {feature.properties.state || 'N/A'}</div>
            <div><strong>Parcel ID:</strong> {feature.properties.county_parcel_id_num || 'N/A'}</div>
            <div><strong>Owner Name:</strong> {feature.properties.owner_name || 'N/A'}</div>
            <div><strong>Physical Address:</strong> {feature.properties.physical_address || 'N/A'}</div>
            <div><strong>Mailing Address:</strong> {feature.properties.mailing_address || 'N/A'}</div>
            <div><strong>Acreage:</strong> {feature.properties.acreage || 'N/A'}</div>
            <div><strong>Property Value:</strong> {feature.properties.property_value || 'N/A'}</div>
            {feature.properties.property_details_link && (
              <div>
                <strong>Property Details:</strong>
                <a href={feature.properties.property_details_link} target="_blank" rel="noopener noreferrer" className="link-button">
                  View Property Details
                </a>
              </div>
            )}
            {feature.properties.tax_details_link && (
              <div>
                <strong>Tax Details:</strong>
                <a href={feature.properties.tax_details_link} target="_blank" rel="noopener noreferrer" className="link-button">
                  View Tax Details
                </a>
              </div>
            )}
            {feature.properties.clerk_records_link && (
              <div>
                <strong>Clerk Records:</strong>
                <a href={feature.properties.clerk_records_link} target="_blank" rel="noopener noreferrer" className="link-button">
                  View Clerk Records
                </a>
              </div>
            )}
          </>
        ) : isPublicLandFeature ? (
          <>
            <div><strong>Managing Agency:</strong> {feature.properties.SURFACE || 'N/A'}</div>
            <div><strong>Area:</strong> {feature ? calculateFeatureArea(feature) : 'N/A'}</div>
            
  
            {/* Description */}
            {parsedDescription.descript && (
              <div>
                <strong>Description:</strong> {parsedDescription.descript}
              </div>
            )}
          </>
        ) : isPrecinct ? (
          <>
            <div><strong>House:</strong> {feature.properties.house || 'N/A'}</div>
            <div><strong>Polling Place:</strong> {feature.properties.pollingpla || 'N/A'}</div>
            <div><strong>Precinct:</strong> {feature.properties.precinct || 'N/A'}</div>
            <div><strong>Senate</strong> {feature.properties.senate || 'N/A'}</div>

  
            {/* Description */}
            {parsedDescription.descript && (
              <div>
                <strong>Description:</strong> {parsedDescription.descript}
              </div>
            )}
          </>
        ) : isFEMA ? (
          <>
            <div><strong>Flood Zone Code:</strong> {feature.properties.FLD_ZONE || 'N/A'}</div>
            {/* Description */}
            {parsedDescription.descript && (
              <div>
                <strong>Description:</strong> {parsedDescription.descript}
              </div>
            )}
          </>
        ): (
          <>
            {/* Render generic attributes if the feature does not match a known type */}
            {Object.keys(parsedDescription).length > 0 ? (
              Object.entries(parsedDescription).slice(0, 5).map(([key, value]) => (
                <div key={key}>
                  <strong>{key.replace(/_/g, ' ')}:</strong> {value || 'N/A'}
                </div>
              ))
            ) : (
              <p>No detailed information available.</p>
            )}
          </>
        )}
        <hr />
      </div>
    );
  };
  
  const onReportBuilderClick = () => {
    console.log("Clicked")
    setIsFilterTriggered(true)
    setActiveTab('report');
    navigate('/report');
  }
  
  const toggleLegend = (layerName) => {
    setIsLegendOpen((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  const getLayerType = (layerName) => {
    const lineLayers = ['roads', "roads_easements", 'rivers', 'railways', "zoning_toj_corp_limit"]; // Example line layers
    const pointLayers = ['precincts_polling_centers', 'control_points_controls']; // Example point layers
    const adressLayer = []
    console.log("Layer Name is ", layerName, " and bool is ", layerName == 'ownership_address')
    if (lineLayers.includes(layerName)) return 'line';
    if (pointLayers.includes(layerName)) return 'point';
    if (layerName == 'ownership_address') return 'symbol'
    return 'fill'; // Default to polygons
  };
  

  const renderLegend = (layerName, layerType) => {
    const legendItems = legends[layerName];
    const legendStyle = {
      display: 'inline-block',
      marginLeft: '8px',
      border: '1px solid #000', // Black outline for visibility
    };
    
    if (layerType === 'symbol') {
      // **Symbol Layer (Ownership Address) → Pin Icon**
      return (
        <img
          src="/pin_better.png"  // Path to your custom pin icon
          alt="Pin Symbol"
          style={{
            width: '16px',  // Adjust for small size
            height: '16px',
          }}
        />
      );
    }
    if ((!legendItems || legendItems.length === 0)) {
      console.warn(`No legend found for layer: ${layerName}`);
      return null; // Don't render anything if there's no legend
    }
    
    if (legendItems.length === 1) {
      const item = legendItems[0];
  
      if (layerType === 'fill') {
        // **Polygon Layer → Colored Square**
        return (
          <span
            style={{
              ...legendStyle,
              width: '14px',
              height: '14px',
              backgroundColor: item.color,
              opacity: item.opacity !== undefined ? item.opacity : 1,
            }}
          />
        );
      } else if (layerType === 'line') {
        // **Line Layer → Horizontal Line**
        return (
          <span
            style={{
              ...legendStyle,
              width: '24px',
              height: '3px',
              backgroundColor: item.color,
              display: 'inline-block',
            }}
          />
        );
      } else if (layerType === 'point') {
        // **Point Layer → Circle (or Icon if available)**
        return (
          <span
            style={{
              ...legendStyle,
              width: '10px',
              height: '10px',
              backgroundColor: item.color,
              borderRadius: '50%',
              display: 'inline-block',
            }}
          />
        );
      } 
    }
  
    return (
      <div className="legend-container">
        <button onClick={() => toggleLegend(layerName)} className="legend-toggle">
          {isLegendOpen[layerName] ? '-' : '+'} Legend
        </button>
        {isLegendOpen[layerName] && (
          <ul className="legend">
            {legendItems.map((item, index) => (
              <li key={index} className="legend-item">
                <span
                  className="legend-color"
                  style={{
                    backgroundColor: item.color,
                    opacity: item.opacity !== undefined ? item.opacity : 1,
                  }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const getTopLayer = () => {
    //console.log("Top Layer called and is:")
    //console.log(layerOrder.length > 0 ? layerOrder[layerOrder.length - 1] : null)

    return layerOrder.length > 0 ? layerOrder[layerOrder.length - 1] : null;
  };

  const topLayer = getTopLayer();



  return (
    <div className={`side-panel ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-btn" onClick={togglePanel}>
        {isOpen ? '<<' : '>>'}
      </button>
      {isOpen && (
        <div className="content">
          <div className="tab-buttons">
            <button
              className={activeSidePanelTab === 'layers' ? 'active' : ''}
              onClick={() => setActiveSidePanelTab('layers')}
            >
              Layers
            </button>
            <button
              className={activeSidePanelTab === 'info' ? 'active' : ''}
              onClick={() => setActiveSidePanelTab('info')}
            >
              Info
            </button>
          </div>
          <div className="tab-content">
            {activeSidePanelTab === 'layers' && (
              <div className="layers-tab">
                <h2>Layers</h2>

                {/* Planning Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('Planning')}>
                    {isPlanningOpen ? '-' : '+'} Planning
                  </button>
                  {isPlanningOpen && (
                    <ul>
                      {[
                        'zoning',
                        'zoning_toj_zoning',
                        'zoning_toj_zoning_overlay',
                        'zoning_zoverlay',
                        'zoning_toj_corp_limit',
                      ].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Ownership Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('Ownership')}>
                    {isOwnershipOpen ? '-' : '+'} Ownership
                  </button>
                  {isOwnershipOpen && (
                    <ul>
                      {['ownership', 'parcels','lincoln_county_ownership', 'sublette_county_ownership', 'ownership_address'].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Public Land Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('PublicLand')}>
                    {isPublicLandOpen ? '-' : '+'} Public Land
                  </button>
                  {isPublicLandOpen && (
                    <ul>
                      {[
                        'conservation_easements',
                        'public_land'
                      
                      ].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* PLSS Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('PLSS')}>
                    {isPLSSOpen ? '-' : '+'} PLSS
                  </button>
                  {isPLSSOpen && (
                    <ul>
                      {[
                        'plss_plss_intersected',
                        'plss_plss_sections',
                        'plss_plss_townships',
                      ].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Road Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('Roads')}>
                    {isRoadsOpen ? '-' : '+'} Roads
                  </button>
                  {isRoadsOpen && (
                    <ul>
                      {['roads', 'roads_easements'].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Precincts Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('Precincts')}>
                    {isPrecinctsOpen ? '-' : '+'} Precincts
                  </button>
                  {isPrecinctsOpen && (
                    <ul>
                      {['precincts_polling_centers', 'precincts' ].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Control Points Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('ControlPoints')}>
                    {isControlPointsOpen ? '-' : '+'} Control Points
                  </button>
                  {isControlPointsOpen && (
                    <ul>
                      {['control_points_controls'].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="layer-category">
                  <button onClick={() => toggleSection('CriticalAnimalHabitat')}>
                    {isAnimalHabitatOpen ? '-' : '+'} Critical Animal Habitat
                  </button>
                  {isAnimalHabitatOpen && (
                    <ul>
                      {['mooose_reprojected', 'reporjected_elk', 'bigHorn_reporjected', 'mule_deer_reporjected'].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Natural Hazards Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('NaturalHazards')}>
                    {isNaturalHazardsOpen ? '-' : '+'} Natural Hazards
                  </button>
                  {isNaturalHazardsOpen && (
                    <ul>
                      {['FEMA_updated'].map((layerName) => (
                        <li key={layerName}>
                          <label>
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            <span
                              style={{
                                textDecoration: topLayer === layerName ? 'underline' : 'none',
                              }}
                            >
                              {layerNameMappings[layerName] || layerName}
                            </span>
                          </label>
                          {renderLegend(layerName, getLayerType(layerName))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>


              </div>
            )}

            {activeSidePanelTab === 'info' && (
              <div className="info-tab">
              {/* Fixed header for Information and button */}
              <div className="info-header">
                <h2>Information</h2>
                <div className="report-builder-container">
                  <button
                    className="report-builder-button"
                    onClick={() => onReportBuilderClick(selectedFeature)}
                  >
                    See Features in Report Builder
                  </button>
                </div>
              </div>
              {/* Scrollable content */}
              <div className="info-content">
                {selectedFeature.length > 0 ? (
                  selectedFeature.map(renderFeatureDetails) // Render details for all selected features
                ) : (
                  <p>No features selected. Click on features to see their details.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
});

export default SidePanel;
