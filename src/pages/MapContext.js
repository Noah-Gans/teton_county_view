import React, { createContext, useState, useRef, useContext } from 'react';
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
  });
  
  const [isMapTriggeredFromSearch, setIsMapTriggeredFromSearch] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(() => {
    // Load saved columns from localStorage on mount
  const savedColumns = localStorage.getItem('selectedColumns');
    return savedColumns ? JSON.parse(savedColumns) : [];
  });
  const mapRef = useRef(null);
  const drawRef = useRef(null); // Store MapboxDraw instance


  const setMapRef = (mapInstance) => {
    console.log('Setting mapRef...');
    mapRef.current = mapInstance;
    console.log('MapRef set to:', mapRef.current);
  };


  
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
    toggleLayerVisibility,
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
    setHoveredFeatureId,
    drawRef, // Expose drawRef to allow access in Mapy.js
    isDrawing,
    setIsDrawing,
    isDrawingRef
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

// Custom hook for using the context
export const useMapContext = () => {
  return useContext(MapContext);
};
