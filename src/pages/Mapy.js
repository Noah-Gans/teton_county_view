import React, { useEffect, useState, useRef, useContext } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet.markercluster';
import './Map.css';
import SidePanel from '../components/SidePanel';
import ToolPanel from '../components/ToolPanel';
import Spinner from '../components/spinner';  // Import the spinner
import 'leaflet-draw';
import 'leaflet-geometryutil';
import { debounce } from '../utils/debounce';
import { DataContext } from '../assets/DataContext';
import { getLayerStyle } from '../assets/layerStyles';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const Map = ({ isMapLoading, setIsMapLoading, selectedFeature, setSelectedFeature }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('layers');
  const [layerStatus, setLayerStatus] = useState(JSON.parse(localStorage.getItem('layerStatus')) || {});
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [measurement, setMeasurement] = useState('');
  const [isDrawing, setIsDrawing] = useState(false); // New state to handle drawing mode
  const mapRef = useRef(null);
  const highlightLayerRef = useRef([]);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const baseLayerControlRef = useRef(null); // Define baseLayerControlRef
  const drawControlRef = useRef(null);
  const editControlRef = useRef(null);
  const isMapInitialized = useRef(false);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false); // Add this state for dropdown
  const [isShiftHeld, setIsShiftHeld] = useState(false);  // Track whether Shift is held down
  // Store the added layers for each key to toggle properly
  const addedLayersRef = useRef({});
  const tooltipRef = useRef(null);
  const ownershipLayerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);  // Add loading state

  // Bring in layers from DataContext
  const { geojsonData, loadingOwnership, loadingOtherLayers } = useContext(DataContext);

  // Handle draw actions via the ToolPanel buttons
  const handleDrawLine = () => {
    const drawPolyline = new L.Draw.Polyline(mapRef.current);
    drawPolyline.enable();
    setIsDrawing(true); // Set drawing mode
  };

  const handleDrawPolygon = () => {
    const drawPolygon = new L.Draw.Polygon(mapRef.current);
    drawPolygon.enable();
    setIsDrawing(true); // Set drawing mode
  };

  const handleClearDrawings = () => {
    drawnItemsRef.current.clearLayers();
    localStorage.removeItem('drawnItems');
  };

  useEffect(() => {
    // Check if a feature is selected from the search
    if (selectedFeature && selectedFeature.geometry) {
      console.log('Selected feature from search:', selectedFeature); // Debugging log
      handleFeatureClick(selectedFeature); // Highlight and zoom to the feature
      setSelectedFeature(null); // Reset the selected feature to prevent retriggering
    }
  }, [selectedFeature]);
  
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Shift') {
        setIsShiftHeld(true);  // Correctly update the state using setIsShiftHeld
      }
    };
  
    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        setIsShiftHeld(false);  // Correctly update the state using setIsShiftHeld
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  
  const handleEditDrawing = () => {
    if (drawnItemsRef.current && mapRef.current) {
      // Add the editing control (drawControlRef might not have been intended here)
      editControlRef.current = new L.EditToolbar.Edit(mapRef.current, {
        featureGroup: drawnItemsRef.current, // Edit existing drawings
      });
      editControlRef.current.enable(); // Enable editing mode
      
      setIsDrawing(true);  // Show the Save/Cancel buttons
    }
  };
  
  const handleSaveDrawing = () => {
    if (editControlRef.current) {
      editControlRef.current.save();  // Save edits
      editControlRef.current.disable();  // Disable editing mode
      editControlRef.current = null;  // Remove the edit control reference
      
      const drawnItemsGeoJSON = drawnItemsRef.current.toGeoJSON();
      localStorage.setItem('drawnItems', JSON.stringify(drawnItemsGeoJSON));
  
      setIsDrawing(false);  // Exit drawing mode after saving
    }
  };
  
  const handleCancelEdit = () => {
    if (editControlRef.current) {
      editControlRef.current.revertLayers();  // Revert changes
      editControlRef.current.disable();  // Disable editing mode
      editControlRef.current = null;  // Remove the edit control reference
  
      setIsDrawing(false);  // Exit drawing mode after canceling
    }
  };
  
  
  
  const calculateDistance = (layer) => {
    const latlngs = layer.getLatLngs();
    let distance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      distance += latlngs[i].distanceTo(latlngs[i + 1]);
    }
    return distance;
  };
  
  const calculateArea = (layer) => {
    const latlngs = layer.getLatLngs()[0];  // In case it's a multipolygon, we assume [0] index for simplicity
    return L.GeometryUtil.geodesicArea(latlngs);  // This method calculates the area of the polygon
  };
  const handleCancelDrawing = () => {
    if (editControlRef.current) {
      editControlRef.current.revertLayers(); // Revert to the previous state if editing
      editControlRef.current.disable();
    }
    setIsDrawing(false); // Exit drawing mode
  };

  // Shift key detection
  

  // Save map state on move
  const saveMapState = () => {
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    localStorage.setItem('mapCenter', JSON.stringify([center.lat, center.lng]));
    localStorage.setItem('mapZoom', zoom);
  };

  // Restore map state from localStorage
  const restoreMapState = () => {
    const savedCenter = localStorage.getItem('mapCenter');
    const savedZoom = localStorage.getItem('mapZoom');

    if (savedCenter && savedZoom) {
      const center = JSON.parse(savedCenter);
      mapRef.current.setView(center, savedZoom);
    }
  };

  // Function to update layers (debounced)
  const updateLayers = () => {
  };

  const debouncedUpdateLayers = debounce(updateLayers, 1000);

  // Helper function for parsing feature description
  const parseDescription = (description) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(description, 'text/html');
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

  // Handle feature click and highlight selected features
  const handleFeatureClick = (feature) => {
    const featureId = feature.properties?.id || feature.id || feature.properties?.ID;

    
    // Check if the feature is already highlighted by matching the featureId
    let isAlreadyHighlighted = false;
    
    // If a feature is highlighted, compare its ID with the clicked feature's ID
    highlightLayerRef.current = highlightLayerRef.current.filter((highlightedLayer) => {
        const highlightedFeatureId = highlightedLayer.feature?.properties?.id || highlightedLayer.feature?.id || highlightedLayer.feature?.properties?.ID;

        const isMatch = highlightedFeatureId === featureId;

        if (isMatch) {
            console.log('Feature is already highlighted, removing highlight:', highlightedLayer);
            isAlreadyHighlighted = true;
            mapRef.current.removeLayer(highlightedLayer); // Remove the existing highlight if already highlighted
        }
        return !isMatch; // Keep only layers that are not the current feature
    });

    // If the feature was already highlighted, unhighlight and exit
    if (isAlreadyHighlighted) {
        console.log('Feature was already highlighted, unhighlighting it.'); // Debug: Exit if already highlighted
        setSelectedFeatures([]); // Clear selected features
        return;
    }

    // Otherwise, highlight the clicked feature
    console.log('Feature is not highlighted, applying new highlight.'); // Debug: New highlight application

    // Remove any previous highlights before applying a new one
    highlightLayerRef.current.forEach((layer) => {
        mapRef.current.removeLayer(layer);
    });

    // Clear the current highlight references
    highlightLayerRef.current = [];

    // Highlight the new feature (non-interactive to prevent blocking clicks)
    const newHighlightLayer = L.geoJSON(feature.geometry, {
        style: { color: 'red', weight: 3, fillOpacity: 0.5 },
        interactive: false // Make the highlight non-interactive
    }).addTo(mapRef.current);

    // Set the feature to the new highlighted layer
    newHighlightLayer.feature = feature;

    // Add the new highlight layer to the ref
    highlightLayerRef.current.push(newHighlightLayer);

    console.log('New highlight layer added:', newHighlightLayer); // Debug: Log the new highlight layer

    // Update the selected feature and parsed properties
    const parsedProperties = feature.properties?.description 
      ? parseDescription(feature.properties.description) 
      : feature.properties;

    setSelectedFeatures([parsedProperties]);

    // Switch to the info tab
    setActiveTab('info');

    // Zoom to the bounds of the highlighted feature
    const bounds = newHighlightLayer.getBounds();
    mapRef.current.fitBounds(bounds, { maxZoom: 14, padding: [50, 50] });
};

  // Initialize base map and layers
  const initializeMapAndLayers = () => {
    if (!isMapInitialized.current && !loadingOwnership && !loadingOtherLayers) {
      mapRef.current = L.map('map', {
        center: [43.55, -110.6560870],
        zoom: 12,
        zoomControl: false,  // Customize zoom control if needed
      });
  
      restoreMapState();
      mapRef.current.on('moveend', saveMapState);
  
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      });
  
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
      });
  
      const baseMaps = {
        'OpenStreetMap': osmLayer,
        'Satellite': satelliteLayer,
      };
  
      const activeBaseLayer = baseMaps['OpenStreetMap'];
      activeBaseLayer.addTo(mapRef.current);
      baseLayerControlRef.current = L.control.layers(baseMaps, null, { position: 'bottomleft' }).addTo(mapRef.current);
  
      mapRef.current.on('baselayerchange', (event) => {
        localStorage.setItem('activeBaseLayer', event.name);
      });
  
      drawnItemsRef.current.addTo(mapRef.current);
  
      const savedDrawnItems = localStorage.getItem('drawnItems');
      if (savedDrawnItems) {
        const parsedItems = JSON.parse(savedDrawnItems);
        L.geoJSON(parsedItems).eachLayer(layer => drawnItemsRef.current.addLayer(layer));
      }
  
      // Marker cluster and layers
      const markerCluster = L.markerClusterGroup();
      
      // Process all layers, particularly ownership
      Object.keys(geojsonData).forEach((layerName) => {
        if (!addedLayersRef.current[layerName]) {
          const layer = L.geoJSON(geojsonData[layerName], {
            pointToLayer: (feature, latlng) => L.marker(latlng),
            style: (feature) => getLayerStyle(layerName, feature),
            onEachFeature: (feature, layer) => layer.on('click', () => handleFeatureClick(feature)),
          });
  
          if (layerName === 'ownership') {
            ownershipLayerRef.current = layer;  // Store ownership layer
          }
  
          if (layerName === 'ownershipAddress') {
            markerCluster.addLayer(layer);
            addedLayersRef.current[layerName] = markerCluster;
          } else {
            addedLayersRef.current[layerName] = layer;
          }
  
          // Add to map if selected in layerStatus
          if (layerStatus[layerName]) {
            mapRef.current.addLayer(addedLayersRef.current[layerName]);
          }
        }
      });
  
      // Set map initialization flag
      setIsLoading(false);
      isMapInitialized.current = true;
    }
  
    // Handle feature highlighting
    if (selectedFeature && selectedFeature.geometry) {
      handleFeatureClick(selectedFeature);
      setSelectedFeature(null);
    }
  };
  

  useEffect(() => {
    initializeMapAndLayers();

    if (!loadingOwnership) {
      renderOwnershipLayer();
    }

    // Render other layers after ownership and after they are loaded
    if (!loadingOtherLayers) {
      renderOtherLayers();
    }
  }, [loadingOwnership, loadingOtherLayers]);

  // Add ownership layer rendering based on layerStatus
  const renderOwnershipLayer = () => {
    if (geojsonData.ownership && mapRef.current && layerStatus.ownership) {
      // Check if ownership layer hasn't already been added
      if (!ownershipLayerRef.current) {
        ownershipLayerRef.current = L.geoJSON(geojsonData.ownership, {
          style: (feature) => getLayerStyle('ownership', feature),
          onEachFeature: (feature, layer) => {
            layer.on('click', () => {
              console.log('Feature clicked:', feature);
            });
          },
        }).addTo(mapRef.current);
      }
    }
  };
  
  const renderOtherLayers = () => {
    if (!loadingOtherLayers && mapRef.current) {
      Object.keys(geojsonData).forEach((layerName) => {
        if (layerName !== 'ownership' && layerStatus[layerName]) {
          if (!addedLayersRef.current[layerName]) {
            const layer = L.geoJSON(geojsonData[layerName], {
              style: (feature) => {
                const style = getLayerStyle(layerName, feature);
                console.log(`Applying style for ${layerName}:`, style);  // Log the style
                return style;
              },
              onEachFeature: (feature, layer) => {
                layer.on('click', () => {
                  console.log(`${layerName} feature clicked:`, feature);
                });
              },
            }).addTo(mapRef.current);
            addedLayersRef.current[layerName] = layer;
          }
        }
      });
    }
  };
  
  
  

  // Handle toggling of layers
  const handleLayerToggle = (layerName) => {
    const isLayerAdded = layerStatus[layerName];
    const layer = addedLayersRef.current[layerName];

    if (layer && mapRef.current) {
      if (isLayerAdded) {
        mapRef.current.removeLayer(layer);
      } else {
        mapRef.current.addLayer(layer);
      }
      setLayerStatus(prevStatus => ({ ...prevStatus, [layerName]: !isLayerAdded }));
    }
  };

  return (
    <div className="map-container">
      {isLoading && <Spinner />}  {/* Show spinner while loading */}
      <ToolPanel 
        onZoomIn={() => mapRef.current.zoomIn()} 
        onZoomOut={() => mapRef.current.zoomOut()} 
        onDrawLine={handleDrawLine}
        onDrawPolygon={handleDrawPolygon}
        onClear={handleClearDrawings}
        onEdit={handleEditDrawing}  // Bind to handleEditDrawing
        onSaveEdit={handleSaveDrawing}  // Save handler
        onCancelEdit={handleCancelEdit} // Cancel handler
      />
      <SidePanel
        isOpen={isPanelOpen}
        togglePanel={() => setIsPanelOpen(!isPanelOpen)}
        layers={geojsonData}
        layerStatus={layerStatus}
        handleLayerToggle={handleLayerToggle}
        selectedFeatures={selectedFeatures}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        highlightLayerRef={highlightLayerRef}
        mapRef={mapRef} 
      />
      
      {isDrawing && (
        <div className="drawing-tools">
          <button onClick={handleSaveDrawing} className="save-btn">Save</button>
          <button onClick={handleCancelDrawing} className="cancel-btn">Cancel</button>
        </div>
      )}
      <div className="measurement-info">{measurement}</div>
      <div id="map" className="visible-map"></div>
    </div>
  );
};

export default Map;
