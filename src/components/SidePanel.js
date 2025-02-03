import React, { useState } from 'react';
import './SidePanel.css';
import { legends } from '../assets/legends';
import { layerNameMappings } from './layerMappings'; // Import layer mappings
import { useMapContext } from '../pages/MapContext';
import { useNavigate } from 'react-router-dom';
import { memo } from 'react';

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

  const {setHoveredFeatureId, setGlobalActiveTab, setIsFilterTriggered, layerOrder, setLayerOrder } = useMapContext();
  const navigate = useNavigate();

  // State to manage legend visibility for each layer
  const [isLegendOpen, setIsLegendOpen] = useState({});

  const handleLayerSelection = (layerName) => {
    // Toggle the layer visibility using setLayerStatus
    setLayerStatus(layerName);
      
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
    const isOwnershipFeature = parsedDescription.pidn || parsedDescription.accountno || parsedDescription.tax_id;
    const isPublicLandFeature = parsedDescription.surface || parsedDescription.holdagency || parsedDescription.sma_id;
    const featureId = parsedDescription.pidn || feature.properties.pidn; // Use the unique ID from the feature
    return (
      <div key={index} className="feature-details" onMouseEnter={() => setHoveredFeatureId(featureId)} onMouseLeave={() => setHoveredFeatureId(null)}>
        <h3>Feature {index + 1}</h3>
  
        {isOwnershipFeature ? (
          <>
            <div><strong>Parcel:</strong> {parsedDescription.pidn || 'N/A'}</div>
            <div><strong>Account#:</strong> {parsedDescription.accountno || 'N/A'}</div>
            <div><strong>Tax ID:</strong> {parsedDescription.tax_id || 'N/A'}</div>
            <div><strong>Owner:</strong> {parsedDescription.owner || 'N/A'}</div>
            <div><strong>Mail Addr:</strong> {parsedDescription.address ? `${parsedDescription.address}, ${parsedDescription.owner_city}, ${parsedDescription.owner_state}` : 'N/A'}</div>
            <div><strong>Tax Classification:</strong> {parsedDescription.accttype || 'N/A'}</div>
            <div><strong>Area (Tax):</strong> {parsedDescription.area_tax ? `${parsedDescription.area_tax} acres` : 'N/A'}</div>
            <div><strong>Area (Calculated):</strong> {parsedDescription.area_calc || 'N/A'}</div>
            <div><strong>Reception:</strong> {parsedDescription.reception || 'N/A'}</div>
  
            {/* Clerk Record Link */}
            {parsedDescription.clerk_rec && (
              <div>
                <strong>Clerk Record:</strong>
                <a href={parsedDescription.clerk_rec} target="_blank" rel="noopener noreferrer" className="link-button">
                  View Clerk Record
                </a>
              </div>
            )}
  
            {/* Property Details Link */}
            {parsedDescription.property_det && (
              <div>
                <strong>Property Details:</strong>
                <a href={parsedDescription.property_det} target="_blank" rel="noopener noreferrer" className="link-button">
                  View Property Details
                </a>
              </div>
            )}
  
            {/* Tax Info Link */}
            {parsedDescription.tax_info && (
              <div>
                <strong>Property Taxes:</strong>
                <a href={parsedDescription.tax_info} target="_blank" rel="noopener noreferrer" className="link-button">
                  Tax Information
                </a>
              </div>
            )}
          </>
        ) : isPublicLandFeature ? (
          <>
            <div><strong>Surface:</strong> {parsedDescription.surface || 'N/A'}</div>
            <div><strong>Managing Agency:</strong> {parsedDescription.holdagency || 'N/A'}</div>
            <div><strong>SMA ID:</strong> {parsedDescription.sma_id || 'N/A'}</div>
            <div><strong>Area (Calculated):</strong> {parsedDescription.area_calc || 'N/A'}</div>
  
            {/* Description */}
            {parsedDescription.descript && (
              <div>
                <strong>Description:</strong> {parsedDescription.descript}
              </div>
            )}
          </>
        ) : (
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
    setActiveTab('print');
    navigate('/print');
  }
  
  const toggleLegend = (layerName) => {
    setIsLegendOpen((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  const renderLegend = (layerName) => {
    const legendItems = legends[layerName];

    if (!legendItems || legendItems.length === 0) return null;

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
                          {renderLegend(layerName)}
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
                      {['ownership', 'ownership_address'].map((layerName) => (
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
                          {renderLegend(layerName)}
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
                          {renderLegend(layerName)}
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
                          {renderLegend(layerName)}
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
                          {renderLegend(layerName)}
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
                          {renderLegend(layerName)}
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
                          {renderLegend(layerName)}
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
                          {renderLegend(layerName)}
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
                <button
                  className="report-builder-button"
                  onClick={() => onReportBuilderClick(selectedFeature)}
                >
                  See Selected Features in Report Builder
                </button>
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
