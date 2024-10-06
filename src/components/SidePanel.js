import React, { useState, useEffect } from 'react';
import './SidePanel.css';

const SidePanel = ({
  isOpen,
  togglePanel,
  layers,
  handleLayerToggle,
  layerStatus,       // <-- Added prop to get the layerStatus
  setLayerStatus,    // <-- Added prop to update the layerStatus
  selectedFeatures,
  activeTab,
  setActiveTab,
  mapRef,
  highlightLayerRef,
}) => {
  // States to manage expanded/collapsed sections
  const [isPlanningOpen, setIsPlanningOpen] = useState(false); // Minimized by default
  const [isOwnershipOpen, setIsOwnershipOpen] = useState(true); // Ownership expanded by default
  const [isPublicLandOpen, setIsPublicLandOpen] = useState(false);
  const [isPLSSOpen, setIsPLSSOpen] = useState(false);
  const [isRoadsOpen, setIsRoadsOpen] = useState(false);
  const [isPrecinctsOpen, setIsPrecinctsOpen] = useState(false);
  const [isControlPointsOpen, setIsControlPointsOpen] = useState(false);

  // State to manage legend visibility for each layer
  const [isLegendOpen, setIsLegendOpen] = useState({});

  // Track selected layers for underline effect
  const [selectedLayers, setSelectedLayers] = useState(['ownership']); // Ownership selected by default


  const handleLayerSelection = (layerName) => {
    console.log(`Layer selection toggled in SidePanel for: ${layerName}`);
  
    const isLayerVisible = layerStatus[layerName];
    console.log(`Layer ${layerName} is currently ${isLayerVisible ? 'visible' : 'not visible'}. Toggling visibility.`);
  
    // Toggle the layer visibility in the shared state
    setLayerStatus((prevStatus) => {
      const updatedStatus = { ...prevStatus, [layerName]: !isLayerVisible };
      console.log('Updated layerStatus:', updatedStatus);
      return updatedStatus;
    });
  
    // Update the selectedLayers stack
    setSelectedLayers((prevLayers) => {
      if (isLayerVisible) {
        // If layer is currently visible and will be toggled off, remove it from the stack
        return prevLayers.filter((layer) => layer !== layerName);
      } else {
        // If layer is being toggled on, add it to the top of the stack
        return [...prevLayers, layerName];
      }
    });
  
    // Notify the Map component to toggle the actual layer on the map
    handleLayerToggle(layerName);
  };
  

  const topLayer = selectedLayers.length > 0 ? selectedLayers[selectedLayers.length - 1] : '';


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
  // Get the most recent selected layer for the underline

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
      default:
        break;
    }
  };

  const toggleLegend = (layerName) => {
    setIsLegendOpen((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  const formatLayerName = (layerName) => {
    const layerNamesMap = {
      zoning: 'County Zoning',
      tojZoning: 'Town Of Jackson Zoning',
      tojZoningOverlay: 'Town of Jackson Zoning Overlay',
      tojCorpLimit: 'Town Corp Limit',
      zoningOverlay: 'County Zoning Overlay',
      ownership: 'Ownership Parcels',
      ownershipAddress: 'Ownership Address',
      publicLand: 'Public Land',
      conservationEasements: 'Conservation Easements',
      plssIntersected: 'PLSS Intersected',
      plssLabels: 'PLSS Labels',
      plssSections: 'PLSS Sections',
      plssTownships: 'PLSS Townships',
      roadsEasements: 'Roads Easements',
      roads: 'Roads',
      precincts: 'Precincts',
      pollingCenters: 'Polling Centers',
      controlPoints: 'Control Points',
    };
    return layerNamesMap[layerName] || layerName;
  };

  const getLegendItems = (layerName) => {
    const legends = {
      publicLand: [
        { label: 'Bureau of Land Management', color: 'yellow' },
        { label: 'Fish & Wildlife Service', color: 'orange' },
        { label: 'Forest Service', color: 'green' },
        { label: 'Local Government', color: 'red' },
        { label: 'National Park Service', color: 'purple' },
        { label: 'Private', color: 'gray', opacity: 0 },  // Clear (transparent)
        { label: 'State', color: 'blue' },
        { label: 'State (Wyoming Game & Fish)', color: 'darkblue' },
        { label: 'Water', color: 'cyan' },
      ],
      tojZoning: [
        { label: 'P/SP - Public/Semi-Public', color: '#FF69B4' },
        { label: 'CR-2 - Commercial Residential-2', color: '#FF8C00' },
        { label: 'OR - Office Residential', color: '#8A2BE2' },
        { label: 'CR-1 - Commercial Residential-1', color: '#7FFF00' },
        { label: 'NL-5 - Nbhd Low Density-5', color: '#FF4500' },
        { label: 'NL-2 - Nbhd Low Density-2', color: '#00CED1' },
        { label: 'NH-1 - Nbhd High Density-1', color: '#4B0082' },
        { label: 'NM-2 - Nbhd Med Density-2', color: '#FFD700' },
        { label: 'PR-SK - Planned Resort', color: '#FF6347' },
        { label: 'NL-3 - Nbhd Low Density-3', color: '#40E0D0' },
        { label: 'R - Rural', color: '#FF00FF' },
        { label: 'NM-1 - Nbhd Med Density-1', color: '#20B2AA' },
        { label: 'MHP - Mobile Home Park', color: '#8B0000' },
        { label: 'NL-1 - Nbhd Low Density-1', color: '#4682B4' },
        { label: 'BP - Business Park', color: '#FFDEAD' },
        { label: 'CR-3 - Commercial Residential-3', color: '#DA70D6' },
        { label: 'P - Public Park', color: '#00BFFF' },
        { label: 'DC-2 - Downtown Core 2', color: '#FFD700' },
        { label: 'DC-1 - Downtown Core 1', color: '#228B22' },
        { label: 'TS-1 - Town Square 1', color: '#D2691E' },
        { label: 'TS-2 - Town Square 2', color: '#FF4500' },
        { label: 'PUD-UR', color: '#FF1493' },
        { label: 'PUD-NH-1', color: '#ADFF2F' },
        { label: 'PUD-NL-5', color: '#6495ED' },
        { label: 'PUD-NL-3', color: '#2E8B57' },
        { label: 'PUD-NM-2', color: '#9932CC' },
        { label: 'PUD-NL-2', color: '#8B4513' },
        { label: 'PR', color: '#00FA9A' },
    ],
    
    zoning: [
      { label: 'R - Rural', color: '#2E8B57' },          // Sea Green
      { label: 'R1 - Rural 1', color: '#1E90FF' },        // Blue
      { label: 'R2 - Rural 2', color: '#FF7F50' },        // Coral
      { label: 'R3 - Rural 3', color: '#32CD32' },        // Lime Green
      { label: 'PUD R1 - Planned Unit Development Rural 1', color: '#DAA520' },    // Goldenrod
      { label: 'PUD R2 - Planned Unit Development Rural 2', color: '#8A2BE2' },    // Blue Violet
      { label: 'PUD R3 - Planned Unit Development Rural 3', color: '#D2691E' },    // Chocolate
      { label: 'PUD - NC - Planned Unit Development Neighborhood Commercial', color: '#FFB6C1' },  // Light Pink
      { label: 'P - Public Park', color: '#FFD700' },         // Gold
      { label: 'P/SP - Public/Semi-Public', color: '#FF4500' },      // Orange Red
      { label: 'S - Suburban', color: '#A52A2A' },         // Brown
      { label: 'WC - Wilson Commercial', color: '#00CED1' },        // Dark Turquoise
      { label: 'WHB - Workforce Home Business', color: '#9400D3' },       // Dark Violet
      { label: 'NC - Single Family Neighborhood', color: '#FF69B4' },        // Hot Pink
      { label: 'NR-1 - Neighborhood Residential 1', color: '#FF6347' },      // Tomato
      { label: 'AR - Auto-Urban Residential', color: '#ADFF2F' },        // Green Yellow
      { label: 'BP - Business Park', color: '#7FFF00' },        // Chartreuse
      { label: 'PR - Planned Resort', color: '#FF1493' }      // Bright Pink
  ],
  
      tojZoningOverlay: [
        { label: 'LDG', color: '#FFA07A' },      // Light Salmon
        { label: 'DDO-2', color: '#87CEFA' },    // Light Sky Blue
        { label: 'DDO-1', color: '#4682B4' },    // Steel Blue
        { label: 'NRO', color: '#3CB371' },      // Medium Sea Green
        { label: 'OUP', color: '#FFD700' },      // Gold
        { label: 'SRO', color: '#FF6347' }       // Tomato
      ],
      zoningOverlay: [
        { label: 'LDG 6', color: '#FF7F50' },    // Coral
        { label: 'SRO', color: '#FF6347' },      // Tomato
        { label: 'LDG 3', color: '#FFA07A' },    // Light Salmon
        { label: 'LDG 2', color: '#FA8072' },    // Salmon
        { label: 'NRO', color: '#3CB371' },      // Medium Sea Green
        { label: 'SRO 3', color: '#FF4500' },    // Orange Red
        { label: 'NRO 3', color: '#2E8B57' },    // Sea Green
        { label: 'NRO 4', color: '#8FBC8F' },    // Dark Sea Green
        { label: 'NRO 2', color: '#66CDAA' }     // Medium Aquamarine
      ],
      
    };

    return legends[layerName] || [];
  };
  
  const renderLegend = (layerName) => {
    const legendItems = getLegendItems(layerName);

    if (legendItems.length === 0) return null;

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

  const renderFeatureDetails = (feature, index) => {
    const isOwnershipFeature = feature.pidn || feature.accountno || feature.tax_id;
    const isPublicLandFeature = feature.SURFACE || feature.SMA_ID;
    
    // Parse the description if it's available
    const parsedDescription = feature.properties?.description 
      ? parseDescription(feature.properties.description)
      : null;
  
    return (
      <div key={index} className="feature-details">
        <h3>Feature {index + 1}</h3>
  
        {isOwnershipFeature ? (
  <>
    <div><strong>Parcel:</strong> {feature.pidn || 'N/A'}</div>
    <div><strong>Account#:</strong> {feature.accountno || 'N/A'}</div>
    <div><strong>Tax ID:</strong> {feature.tax_id || 'N/A'}</div>
    <div><strong>Owner:</strong> {feature.owner || 'N/A'}</div>
    <strong>Mail Addr:</strong> {feature.address ? `${feature.address}, ${feature.owner_city}, ${feature.owner_state}` : 'N/A'}
    <div><strong>Tax Classification:</strong> {feature.accttype || 'N/A'}</div>
    <div><strong>Deed:</strong> {feature.deed || 'N/A'}</div>
    <div><strong>Area (Tax):</strong> {feature.area_tax ? `${feature.area_tax} acres` : 'N/A'}</div>
    <div><strong>Area (Calculated):</strong> {feature.area_calc || 'N/A'}</div>
    <div><strong>Reception:</strong> {feature.reception || 'N/A'}</div>
    
    {/* Add tax info link */}
    {feature.tax_info && (
      <div>
        <strong>Property Taxes:</strong> 
        <a href={feature.tax_info} target="_blank" rel="noopener noreferrer" className="link-button"> Tax Information</a>
      </div>
    )}
    
    {/* Add link to the detailed page */}
    {feature.accountno && (
      <div>
        <strong>Property Details:</strong>
        <a 
          href={`https://gis.tetoncountywy.gov/portal/apps/dashboards/ca93f7b7ae3e4d51ad371121a64ee739#accountno=${feature.accountno}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="link-button"
        >
          View Details
        </a>
      </div>
    )}
  </>
) : isPublicLandFeature ? (
          <>
            <div><strong>Surface:</strong> {feature.SURFACE || 'N/A'}</div>
            <div><strong>Managing Agency:</strong> {feature.HOLDAGENCY || 'N/A'}</div>
            <div><strong>SMA ID:</strong> {feature.SMA_ID || 'N/A'}</div>
            {parsedDescription && Object.keys(parsedDescription).map((key) => (
              <div key={key}>
                <strong>{key.replace(/_/g, ' ')}:</strong> {parsedDescription[key] || 'N/A'}
              </div>
            ))}
          </>
        ) : (
          <>
            {Object.keys(feature).slice(0, 5).map((key) => (
              <div key={key}>
                <strong>{key}:</strong> {typeof feature[key] === 'object' ? JSON.stringify(feature[key]) : feature[key] || 'N/A'}
              </div>
            ))}
          </>
        )}
        <hr />
      </div>
    );
  };

  return (
    <div className={`side-panel ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-btn" onClick={togglePanel}>
        {isOpen ? '<<' : '>>'}
      </button>
      {isOpen && (
        <div className="content">
          <div className="tab-buttons">
            <button
              className={activeTab === 'layers' ? 'active' : ''}
              onClick={() => setActiveTab('layers')}
            >
              Layers
            </button>
            <button
              className={activeTab === 'info' ? 'active' : ''}
              onClick={() => setActiveTab('info')}
            >
              Info
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'layers' && (
              <div className="layers-tab">
                <h2>Layers</h2>

                {/* Planning Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('Planning')}>
                    {isPlanningOpen ? '-' : '+'} Planning
                  </button>
                  {isPlanningOpen && (
                    <ul>
                      {['zoning', 'tojZoning', 'tojZoningOverlay', 'zoningOverlay', 'tojCorpLimit'].map((layerName) => (
                        <li key={layerName}>
                          <label
                            style={{
                              borderBottom: topLayer === layerName && layerStatus[layerName] ? '2px solid black' : 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            {formatLayerName(layerName)}
                          </label>
                          {/* Render legend */}
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
                      {['ownership', 'ownershipAddress'].map((layerName) => (
                        <li key={layerName}>
                          <label
                            style={{
                              borderBottom: topLayer === layerName && layerStatus[layerName] ? '2px solid black' : 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            {formatLayerName(layerName)}
                          </label>
                          {/* Render legend */}
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
                      {['publicLand', 'conservationEasements'].map((layerName) => (
                        <li key={layerName}>
                          <label
                            style={{
                              borderBottom: topLayer === layerName && layerStatus[layerName] ? '2px solid black' : 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            {formatLayerName(layerName)}
                          </label>
                          {/* Render legend */}
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
                      {['plssIntersected', 'plssLabels', 'plssSections', 'plssTownships'].map((layerName) => (
                        <li key={layerName}>
                          <label
                            style={{
                              borderBottom: topLayer === layerName && layerStatus[layerName] ? '2px solid black' : 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            {formatLayerName(layerName)}
                          </label>
                          {/* Render legend */}
                          {renderLegend(layerName)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Roads Layers */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('Roads')}>
                    {isRoadsOpen ? '-' : '+'} Roads
                  </button>
                  {isRoadsOpen && (
                    <ul>
                      {['roadsEasements', 'roads'].map((layerName) => (
                        <li key={layerName}>
                          <label
                            style={{
                              borderBottom: topLayer === layerName && layerStatus[layerName] ? '2px solid black' : 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            {formatLayerName(layerName)}
                          </label>
                          {/* Render legend */}
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
                      {['precincts', 'pollingCenters'].map((layerName) => (
                        <li key={layerName}>
                          <label
                            style={{
                              borderBottom: topLayer === layerName && layerStatus[layerName] ? '2px solid black' : 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            {formatLayerName(layerName)}
                          </label>
                          {/* Render legend */}
                          {renderLegend(layerName)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Control Points */}
                <div className="layer-category">
                  <button onClick={() => toggleSection('ControlPoints')}>
                    {isControlPointsOpen ? '-' : '+'} Control Points
                  </button>
                  {isControlPointsOpen && (
                    <ul>
                      {['controlPoints'].map((layerName) => (
                        <li key={layerName}>
                          <label
                            style={{
                              borderBottom: topLayer === layerName && layerStatus[layerName] ? '2px solid black' : 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={layerStatus[layerName] || false}
                              onChange={() => handleLayerSelection(layerName)}
                            />
                            {formatLayerName(layerName)}
                          </label>
                          {/* Render legend */}
                          {renderLegend(layerName)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="info-tab">
                <h2>Information</h2>
                {selectedFeatures && selectedFeatures.length > 0 ? (
                  selectedFeatures.map((feature, index) => renderFeatureDetails(feature, index))
                ) : (
                  <p>No feature selected. Click on a feature to see its details.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default SidePanel;