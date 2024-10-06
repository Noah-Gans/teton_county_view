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
  const [layerStatus, setLayerStatus] = useState(() => {
    const savedLayerStatus = JSON.parse(localStorage.getItem('layerStatus')) || {};
    
    // Set ownership layer to visible by default if it wasn't saved before
    if (savedLayerStatus.ownership === undefined) {
      savedLayerStatus.ownership = true;
    }

    return savedLayerStatus;
  });
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [measurement, setMeasurement] = useState('');
  const [isDrawing, setIsDrawing] = useState(false); // New state to handle drawing mode
  const mapRef = useRef(null);
  const highlightLayerRef = useRef([]);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const baseLayerControlRef = useRef(null); // Define baseLayerControlRef
  const drawControlRef = useRef(null);
  const [isOwnershipLoading, setIsOwnershipLoading] = useState(true);
  const editControlRef = useRef(null);
  const isMapInitialized = useRef(false);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false); // Add this state for dropdown
  const [isShiftHeld, setIsShiftHeld] = useState(false);  // Track whether Shift is held down
  // Store the added layers for each key to toggle properly
  const addedLayersRef = useRef({});
  const tooltipRef = useRef(null);
  const ownershipLayerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);  // Add loading state
  const markerClusterRef = useRef(null);
  // Bring in layers from DataContext
  const { geojsonData, loadingOwnership, loadingOtherLayers } = useContext(DataContext);


  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on(L.Draw.Event.CREATED, (event) => {
        const layer = event.layer;
  
        // Add the layer to drawnItemsRef to keep track of all drawings
        drawnItemsRef.current.addLayer(layer);
  
        // Add the newly drawn layer to the map
        layer.addTo(mapRef.current);
  
        // Calculate and show distance for polylines or area for polygons
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          const distance = calculateDistance(layer);
          layer.bindTooltip(`Distance: ${distance.toFixed(2)} meters`, {
            permanent: true,
            direction: 'center',
          }).openTooltip();
        } else if (layer instanceof L.Polygon) {
          const area = calculateArea(layer);
          layer.bindTooltip(`Area: ${area.toFixed(2)} m²`, {
            permanent: true,
            direction: 'center',
          }).openTooltip();
        }
  
        // Disable drawing mode to remove the tooltip from the cursor
        setIsDrawing(false);
  
        // Save drawn items to localStorage for persistence
        const drawnItemsGeoJSON = drawnItemsRef.current.toGeoJSON();
        localStorage.setItem('drawnItems', JSON.stringify(drawnItemsGeoJSON));
      });
    }
  }, [mapRef.current]);
  
  // Handle draw actions via the ToolPanel buttons
  const handleDrawLine = () => {
    const drawPolyline = new L.Draw.Polyline(mapRef.current);
    drawPolyline.enable();
    setIsDrawing(true); // Set drawing mode
  };

  const handleDrawPolygon = () => {
    const drawPolygon = new L.Draw.Polygon(mapRef.current, {
    shapeOptions: {
      color: 'green',  // Set the polygon color to green
    },
  });
    drawPolygon.enable();
    setIsDrawing(true); // Set drawing mode
  };

  const handleClearDrawings = () => {
    drawnItemsRef.current.clearLayers();
    localStorage.removeItem('drawnItems');
  };
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on(L.Draw.Event.CREATED, (event) => {
        const layer = event.layer;
  
        // Add the layer to drawnItemsRef to keep track of all drawings
        drawnItemsRef.current.addLayer(layer);
  
        // Add the newly drawn layer to the map
        layer.addTo(mapRef.current);
  
        // Calculate and show distance for polylines or area for polygons
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          const distance = calculateDistance(layer);
          layer.bindTooltip(`Distance: ${distance.toFixed(2)} meters`, {
            permanent: true,
            direction: 'center',
          }).openTooltip();
        } else if (layer instanceof L.Polygon) {
          const area = calculateArea(layer);
          layer.bindTooltip(`Area: ${area.toFixed(2)} m²`, {
            permanent: true,
            direction: 'center',
          }).openTooltip();
        }
  
        // Save drawn items to localStorage for persistence
        const drawnItemsGeoJSON = drawnItemsRef.current.toGeoJSON();
        localStorage.setItem('drawnItems', JSON.stringify(drawnItemsGeoJSON));
      });
    }
  }, [mapRef.current]);
  
  
  useEffect(() => {
    // Check if a feature is selected from the search
    if (selectedFeature && selectedFeature.geometry) {
      //console.log('Selected feature from search:', selectedFeature); // Debugging log
      handleFeatureClick(selectedFeature, selectedFeature.properties.layerName, true); // Pass true for fromSearch // Highlight and zoom to the feature
      setSelectedFeature(null); // Reset the selected feature to prevent retriggering
    }
  }, [selectedFeature]);
  
  useEffect(() => {
    initializeMapAndLayers();
  }, []);
  
  useEffect(() => {
    if (isMapInitialized.current && !loadingOwnership && !addedLayersRef.current['ownership']) {
      renderOwnershipLayer();
    }
  
    if (isMapInitialized.current && !loadingOtherLayers) {
      renderOtherLayers();
    }
  }, [loadingOwnership, loadingOtherLayers]);
  


  useEffect(() => {
    if (isMapInitialized.current && !loadingOtherLayers) {
      //console.log('Loading other layers data but not adding to the map initially.');
      renderOtherLayers(); // Prepare layers but do not add them unless toggled on
    }
  }, [loadingOtherLayers]);
  
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
  
  useEffect(() => {
    //console.log('Layer Status on initialization or change:', layerStatus);
  }, [layerStatus]);
  
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
  const handleFeatureClick = (feature, layerName, fromSearch = false) => {
    const featureId = feature.properties?.id || feature.id || feature.properties?.ID;

    // Check if the feature is already highlighted by matching the featureId
    let isAlreadyHighlighted = false;

    // Filter out highlighted features that match the current feature being clicked
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

    // Determine how to highlight the feature based on its geometry type
    let newHighlightLayer;
    if (feature.geometry.type === 'Point') {
        // Handle point geometry with a marker
        const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
        newHighlightLayer = L.circleMarker(latlng, {
            color: 'red',
            radius: 8,
            weight: 3,
            fillOpacity: 0.5,
            interactive: false,
        }).addTo(mapRef.current);
    } else {
        // Handle polygon or other geometries
        newHighlightLayer = L.geoJSON(feature.geometry, {
            style: { color: 'red', weight: 3, fillOpacity: 0.5 },
            interactive: false, // Make the highlight non-interactive
        }).addTo(mapRef.current);
    }

    // Set the feature to the new highlighted layer
    newHighlightLayer.feature = feature;
    newHighlightLayer.feature.properties.layerName = layerName; // Track which layer the feature belongs to

    // Log layer name to debug if it's set correctly
    if (!layerName) {
        console.warn("Layer name is undefined. Make sure to pass the correct layer name when calling handleFeatureClick.");
    } else {
        console.log("Set layer name in feature properties:", newHighlightLayer.feature.properties.layerName);
    }

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
    if (newHighlightLayer.getBounds) {
        const bounds = newHighlightLayer.getBounds();
        const currentZoom = mapRef.current.getZoom();

        // Access the parcel area properties from parsedProperties and parse them to float
        const area = parseFloat(parsedProperties?.area_calc) || parseFloat(parsedProperties?.area_tax);
        console.log("Parcel Area:", area); // Debugging line to check if area is accessed correctly

        // Determine the target zoom level based on parcel size
        let targetZoom = 15;
        
        if (area && area < 2) {
          console.log("Parcel size below 2 acres, setting zoom to 16"); // Debugging line
          targetZoom = 18; // If the parcel size is below 2 acres, set zoom to 16
        }

        // Adjust the bounds based on whether the click originated from a search
        if (fromSearch) {
          // If the feature is selected from search, always fit bounds without zoom restriction
          mapRef.current.fitBounds(bounds, { maxZoom: targetZoom, padding: [50, 50] });
        } else {
          // For non-search interactions, use the conditional zoom logic
          if (currentZoom < targetZoom) {
            mapRef.current.fitBounds(bounds, { maxZoom: targetZoom, padding: [50, 50] });
          } else {
            mapRef.current.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: mapRef.current.getZoom(), // Limit the maximum zoom to the current zoom level
            });
            console.log("Current zoom level is higher, no zoom adjustment needed."); // Debugging line
          }
        }
    } else if (newHighlightLayer.getLatLng) {
        const currentZoom = mapRef.current.getZoom();

        // Access the parcel area properties from parsedProperties and parse them to float
        const area = parseFloat(parsedProperties?.area_calc) || parseFloat(parsedProperties?.area_tax);
        console.log("Parcel Area:", area); // Debugging line to check if area is accessed correctly

        // Determine the target zoom level based on parcel size
        let targetZoom = 14;
        if (area && area < 2) {
            console.log("Parcel size below 2 acres, setting zoom to 17"); // Debugging line
            targetZoom = 17; // If the parcel size is below 2 acres, set zoom to 17
        }

        // Only set the view if the current zoom is less than the target zoom level
        if (currentZoom < targetZoom) {
            mapRef.current.setView(newHighlightLayer.getLatLng(), targetZoom, { animate: true });
        } else {
            console.log("Current zoom level is higher, no zoom adjustment needed."); // Debugging line
        }
    }
};







  

  // Initialize base map and layers
  const initializeMapAndLayers = () => {
    if (!isMapInitialized.current) {
      console.log('Initializing base map only.');
  
      // Initialize the map
      mapRef.current = L.map('map', {
        center: [43.48, -110.7560870], // Example coordinates
        zoom: 12,
        zoomControl: false, // Customize zoom control if needed
      });
  
      // Load the base map tiles
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      });
      
  
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
      });

      const blankLayer = L.tileLayer('', {
        attribution: '',
        maxZoom: 19,
      });
  
      // Add the default base layer to the map
      osmLayer.addTo(mapRef.current);
  
      // Add the base layer switcher control
      const baseMaps = {
        'OpenStreetMap': osmLayer,
        'Satellite': satelliteLayer,
        'Blank': blankLayer
      };
      baseLayerControlRef.current = L.control.layers(baseMaps, null, { position: 'bottomleft' }).addTo(mapRef.current);
  
      // Set map state and add move event
      restoreMapState();
      mapRef.current.on('moveend', saveMapState);
      const savedDrawnItems = localStorage.getItem('drawnItems');
      // Use a flag to prevent multiple "Base map has loaded" logs
      let baseMapLoaded = false;
  
      osmLayer.on('load', () => {
        if (!baseMapLoaded) {
          console.log('Base map has loaded.');
          setIsLoading(false); // Set loading to false once the base map is loaded
          baseMapLoaded = true;
        }
      });
      mapRef.current.addLayer(drawnItemsRef.current);

      // Restore previous drawings from localStorage
      if (savedDrawnItems) {
        const parsedDrawnItems = JSON.parse(savedDrawnItems);
        L.geoJSON(parsedDrawnItems).eachLayer((layer) => {
          drawnItemsRef.current.addLayer(layer);
        });
      }

      const emptyIcon = L.divIcon({
        className: 'empty-icon', // Custom class for styling if needed
        html: '', // No HTML content for the icon
        iconSize: [0, 0], // Zero size to ensure no visual representation
      });
      
      const jacksonMarker = L.marker([43.47976156612463, -110.76246023448672], { icon: emptyIcon })
            .bindTooltip('Town of Jackson', {
                permanent: true,
                direction: 'top',
                className: 'custom-label',
            })
            .addTo(mapRef.current);

        const wilsonMarker = L.marker([43.500638339442, -110.87525644977481], { icon: emptyIcon })
            .bindTooltip('Wilson', {
                permanent: true,
                direction: 'top',
                className: 'custom-label',
            })
            .addTo(mapRef.current);

        const tetonVillageMarker = L.marker([43.58754282267649, -110.82759415505991], { icon: emptyIcon })
            .bindTooltip('Teton Village', {
                permanent: true,
                direction: 'top',
                className: 'custom-label',
            })
            .addTo(mapRef.current);
        // Function to handle visibility of the markers based on zoom level
        const handleZoomEnd = () => {
            const currentZoom = mapRef.current.getZoom();
            if (currentZoom < 15) {
                jacksonMarker.addTo(mapRef.current);
                wilsonMarker.addTo(mapRef.current);
                tetonVillageMarker.addTo(mapRef.current);
            } else {
                mapRef.current.removeLayer(jacksonMarker);
                mapRef.current.removeLayer(wilsonMarker);
                tetonVillageMarker.addTo(mapRef.current);
            }
        };

        // Attach zoomend event handler
        mapRef.current.on('zoomend', handleZoomEnd);


      isMapInitialized.current = true;
      const debouncedZoomEnd = debounce(() => {
        console.log('Zoom level stabilized, performing re-rendering operations.');
        renderOtherLayers(); // Re-render layers or do any heavy computation
      }, 5000); // 5-second debounce delay
  
      mapRef.current.on('zoomend', debouncedZoomEnd);
    }
  };
  
  
  

  
  // Add ownership layer rendering based on layerStatus
  const renderOwnershipLayer = () => {
    console.log("Render Ownership Layer called.");
  
    if (geojsonData.ownership && mapRef.current && layerStatus.ownership) {
      // Check if ownership layer hasn't already been added
      if (!addedLayersRef.current['ownership']) {
        ownershipLayerRef.current = L.geoJSON(geojsonData.ownership, {
          style: (feature) => getLayerStyle('ownership', feature),
          onEachFeature: (feature, layer) => {
            layer.on('click', () => {
              console.log('Feature clicked:', feature);
              handleFeatureClick(feature, 'ownership'); // Call feature click handler for highlighting
            });
          },
        }).addTo(mapRef.current);
  
        // Store ownership layer in addedLayersRef to track it
        addedLayersRef.current['ownership'] = ownershipLayerRef.current;
        console.log("Ownership layer added to addedLayersRef.");
  
        // Update state to indicate the ownership layer has been loaded
        setIsOwnershipLoading(false);
      } else {
        console.log("Ownership layer already exists in addedLayersRef.");
      }
    } else if (!layerStatus.ownership) {
      // If the ownership layer exists but needs to be hidden
      if (addedLayersRef.current['ownership']) {
        console.log("Removing ownership layer from map.");
        mapRef.current.removeLayer(addedLayersRef.current['ownership']);
        delete addedLayersRef.current['ownership'];
      }
    } else {
      console.log("Ownership layer data is not available yet.");
    }
  };
  
  
  
  
  const renderOtherLayers = () => {
    if (!loadingOtherLayers && mapRef.current) {
      console.log('Rendering other layers...');
  
      // Initialize marker cluster if not already initialized
      if (!markerClusterRef.current) {
        markerClusterRef.current = L.markerClusterGroup();
      }
  
      // Iterate through all layers and add them if they haven't been added already
      Object.keys(geojsonData).forEach((layerName) => {
        // Skip the ownership layer since it's handled separately
        if (layerName === 'ownership') return;
  
        if (!addedLayersRef.current[layerName]) {
          const layer = L.geoJSON(geojsonData[layerName], {
            pointToLayer: (feature, latlng) => {
              // Use markers for point layers, such as ownershipAddress
              return L.marker(latlng);
            },
            style: (feature) => {
              const style = getLayerStyle(layerName, feature);
              //console.log(`Applying style for ${layerName}:`, style);
              return style;
            },
            onEachFeature: (feature, layer) => {
              layer.on('click', () => {
                console.log(`${layerName} feature clicked:`, feature);
                handleFeatureClick(feature, layerName); // Call feature click handler for highlighting
              });
            },
          });
  
          if (layerName === 'ownershipAddress') {
            // Add ownershipAddress to marker cluster
            markerClusterRef.current.addLayer(layer);
            addedLayersRef.current[layerName] = markerClusterRef.current;
          } else {
            addedLayersRef.current[layerName] = layer;
          }
  
          // Add to map if marked as visible in layerStatus
          if (layerStatus[layerName]) {
            if (layerName === 'ownershipAddress' && markerClusterRef.current) {
              // Add the marker cluster for ownershipAddress
              mapRef.current.addLayer(markerClusterRef.current);
              console.log("Added marker cluster group to the map for ownershipAddress.");
            } else {
              // Add the non-clustered layer to the map
              mapRef.current.addLayer(addedLayersRef.current[layerName]);
            }
          }
        } else {
          console.log(`${layerName} layer already added.`);
        }
      });
    }
  };
  
  
  
  
  useEffect(() => {
    console.log("Layer Status on initialization or change: ", layerStatus);
    Object.keys(layerStatus).forEach((layerName) => {
      // Ensure that layerName exists in addedLayersRef and layerStatus
      const layer = addedLayersRef.current[layerName];
      if (layer) {
        if (layerStatus[layerName]) {
          // If the layer should be visible but isn't already on the map
          if (!mapRef.current.hasLayer(layer)) {
            console.log(`Adding layer ${layerName} to the map.`);
            mapRef.current.addLayer(layer);
          }
        } else {
          // If the layer should not be visible but is on the map
          if (mapRef.current.hasLayer(layer)) {
            console.log(`Removing layer ${layerName} from the map.`);
            mapRef.current.removeLayer(layer);
          }
        }
      } else {
        console.log(`Layer ${layerName} not found in addedLayersRef.`);
      }
    });
  }, [layerStatus]);
  
  
  const handleLayerToggle = (layerName) => {
    console.log(`Toggling layer on map: ${layerName}`);
    const isLayerAdded = layerStatus[layerName];
    const layer = addedLayersRef.current[layerName];

    if (layer && mapRef.current) {
        if (isLayerAdded) {
            console.log(`Removing layer ${layerName} from map.`);
            mapRef.current.removeLayer(layer);

            // Remove highlighted features if their corresponding layer is removed
            highlightLayerRef.current.forEach((highlightedLayer) => {
                if (highlightedLayer.feature?.properties?.layerName === layerName) {
                    console.log(`Removing highlight for layer ${layerName}`);
                    mapRef.current.removeLayer(highlightedLayer);
                }
            });

            highlightLayerRef.current = highlightLayerRef.current.filter(
                (highlightedLayer) => highlightedLayer.feature?.properties?.layerName !== layerName
            );
        } else {
            console.log(`Adding layer ${layerName} to map.`);
            mapRef.current.addLayer(layer);
        }

        setLayerStatus((prevStatus) => ({
            ...prevStatus,
            [layerName]: !isLayerAdded,
        }));
    }
};

  

  return (
    <div className="map-container">
      {(isLoading || isOwnershipLoading) && <Spinner />}  {/* Show spinner while loading */}
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
        setLayerStatus={setLayerStatus}
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