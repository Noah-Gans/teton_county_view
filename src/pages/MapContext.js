import React, { createContext, useState, useRef, useContext } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useEffect } from 'react';
// Create the context
const MapContext = createContext();

// Provider component
export const MapProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('intro'); // Manage tab state here
  const [isDrawing, setIsDrawing] = useState(false); // Add this state
  const isDrawingRef = useRef(false); // Reference for immediate access
  const [isGeoFilterActive, setIsGeoFilterActive] = useState(false);
  const isGeoFilterActiveRef = useRef(false);
  const [selectedFeature, setSelectedFeatures] = useState([]); // State for selected feature
  const [isFilterTriggered, setIsFilterTriggered] = useState(false);
  const [polygonData, setPolygonData] = useState(null); // Store the polygon data
  const [layerOrder, setLayerOrder] = useState([]); // "ownership" layer is initially in the order
  const [searchResults, setSearchResults] = useState([]); // State for selected feature
  const [focusFeatures, setFocusFeatures] = useState([])
  const [hoveredFeatureId, setHoveredFeatureId] = useState(null); // State to track hovered feature
  const [layerStatus, setLayerStatus] = useState({
    ownership: true,
    zoning: false,
  });
  
  const [isMapTriggeredFromSearch, setIsMapTriggeredFromSearch] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(() => {
    // Load saved columns from localStorage on mount
  const savedColumns = localStorage.getItem('selectedColumns');
    return savedColumns ? JSON.parse(savedColumns) : [];
  });
  
  
  const mapRef = useRef(null);
  const drawControl = useRef(
    new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        point: true,
        trash: true,
      },
    })
  );


  const setMapRef = (mapInstance) => {
    console.log('Setting mapRef...');
    mapRef.current = mapInstance;
    console.log('MapRef set to:', mapRef.current);
  };

  let drawControlAdded = false; // Track whether drawControl is added to the map

  
  useEffect(() => {
    if (hoveredFeatureId !== null) {
      console.log("Hovered Feature ID:", hoveredFeatureId); // Log when a feature is hovered
      // Add additional logic here for handling feature hover (e.g., updating map highlights)
    } else {
      console.log("No feature hovered"); // Log when no feature is hovered
      // Add logic here for clearing highlights, if necessary
    }
  }, [hoveredFeatureId]);

  const toggleColumn = (column) => {
    console.log(column)
    setSelectedColumns((prev) => {
      const updatedColumns = prev.includes(column)
        ? prev.filter((col) => col !== column) // Remove column
        : [...prev, column]; // Add column
  
      // Save updated columns to localStorage
      localStorage.setItem('selectedColumns', JSON.stringify(updatedColumns));
      console.log(selectedColumns)
      return updatedColumns;
    });
  };

  // Function to activate GeoFilter drawing mode
  const startGeoFilter = () => {
    console.log('Starting GeoFilter mode...');
    setIsGeoFilterActive(true);
    drawControl.current.changeMode('draw_polygon');
  };

  const startPolygonDraw = (geoFilter = false) => {
    console.log('Attempting to start polygon draw...');
    console.log('Map reference:', mapRef.current);
    console.log('Draw control reference:', drawControl.current);
    console.log("Draw control context", drawControl.current._ctx)
    if (!mapRef.current) {
      console.warn('Map reference does not exist!');
      return;
    }
  
    // Ensure ctx is initialized
    if (!drawControl.current._ctx) {
      console.log('Initializing draw control context in startPolygonDraw...');
      drawControl.current._ctx = {
        map: mapRef.current,
        events: {},
        store: {},
        ui: {},
        modes: drawControl.current.options.modes || {},
        container: mapRef.current.getContainer(),
      };
    }
  
    try {
      // Check if the source for MapboxDraw is already present
      const drawSourceExists = mapRef.current.getSource('mapbox-gl-draw-cold');
      if (!drawSourceExists) {
        console.log('Draw control sources not found! Adding control...');
        mapRef.current.addControl(drawControl.current, 'top-left');
      } else {
        console.log('Draw control sources already exist. Skipping re-addition.');
      }
  
      // Switch to polygon draw mode
      console.log('Switching to polygon draw mode...');
      drawControl.current.changeMode('draw_polygon');
      if (geoFilter) {
        isGeoFilterActiveRef.current = true; // Update the ref directly
        setIsGeoFilterActive(true); // Activate GeoFilter mode
        console.log(isGeoFilterActiveRef)
        console.log('GeoFilter mode activated');
      }
      setIsDrawing(true); // Update state
      isDrawingRef.current = true;

    } catch (error) {
      console.error('Error in startPolygonDraw:', error);
    }
  };
  
  const clearGeoFilter = () => {
    console.log("Clearing GeoFilter...");
  
    // Clear the polygon data
    polygonData.current = null;
    setPolygonData(null); // Reset the state
  
    // Reset GeoFilter active state
    isGeoFilterActiveRef.current = false;
    setIsGeoFilterActive(false);
  
    // Remove any drawn polygons from the map
    if (drawControl.current && mapRef.current) {
      const allDrawnFeatures = drawControl.current.getAll();
      allDrawnFeatures.features.forEach((feature) => {
        drawControl.current.delete(feature.id);
      });
    }
  
    console.log("GeoFilter has been cleared.");
  };
  

  const passPolygonToReportBuilder = (polygon) => {
    console.log("Passing polygon to Reports:", polygon);
    setPolygonData(polygon); // Update the state
    // You can use a context or state update function here
  };
  

  const clearDrawings = () => {
    console.log('Clearing all drawings...');
    if (drawControl.current) {
      drawControl.current.deleteAll();
      console.log('All drawings cleared.');
    } else {
      console.warn('Draw control does not exist!');
    }
  };

  const toggleLayerVisibility = (layerName) => {
    console.log(`Toggling visibility for layer: ${layerName}`);
    setLayerStatus((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  const value = {
    activeTab,
    setActiveTab,
    layerStatus,
    setLayerStatus,
    mapRef,
    selectedColumns,
    toggleColumn,
    setMapRef, // Provide setMapRef here
    drawControl, // Expose the drawControl reference
    setIsDrawing, // Expose setIsDrawing here
    isDrawingRef,
    passPolygonToReportBuilder,
    clearGeoFilter,
    isGeoFilterActiveRef,
    startGeoFilter,
    startPolygonDraw,
    clearDrawings,
    toggleLayerVisibility,
    passPolygonToReportBuilder,
    polygonData,
    selectedFeature, // Add selectedFeatures here
    setSelectedFeatures, // Add setSelectedFeatures here
    isMapTriggeredFromSearch,
    setIsMapTriggeredFromSearch,
    isFilterTriggered,
    setIsFilterTriggered,
    layerOrder,
    setLayerOrder,
    searchResults, 
    setSearchResults,
    focusFeatures,
    setFocusFeatures,
    hoveredFeatureId,
    setHoveredFeatureId
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

// Custom hook for using the context
export const useMapContext = () => {
  return useContext(MapContext);
};
