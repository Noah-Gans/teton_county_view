import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import area from '@turf/area';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import { useNavigate } from 'react-router-dom';
import SidePanel from '../components/SidePanel';
import Spinner from '../components/spinner'; // Import spinner
import ToolPanel from '../components/ToolPanel'; // Import ToolPanel
import { featureCollection } from '@turf/turf';
import { countyZoningColors, getLayerStyle } from '../components/mapStyles';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';  // Import the CSS for draw tools
import { useMapContext } from './MapContext'; // Adjust path as needed
import { useUser } from "../contexts/UserContext";

// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1Ijoibm9haC1nYW5zIiwiYSI6ImNsb255ajJteDB5Z2gya3BpdXU5M29oY3YifQ.VbPKEHZ91PNoSAH-raskhw';

// URLs for vector tile layers in GCS
const tileLayerUrls = {
  ownership: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/ownership/{z}/{x}/{y}.pbf',
  zoning: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/zoning/{z}/{x}/{y}.pbf',
  conservation_easements: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/conservation_easements/{z}/{x}/{y}.pbf',
  control_points_controls: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/control_points_controls/{z}/{x}/{y}.pbf',
  ownership_address: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/ownership_address/{z}/{x}/{y}.pbf',
  plss_plss_intersected: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/plss_plss_intersected/{z}/{x}/{y}.pbf',
  plss_plss_labels: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/plss_plss_labels/{z}/{x}/{y}.pbf',
  plss_plss_sections: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/plss_plss_sections/{z}/{x}/{y}.pbf',
  plss_plss_townships: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/plss_plss_townships/{z}/{x}/{y}.pbf',
  precincts_polling_centers: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/precincts_polling_centers/{z}/{x}/{y}.pbf',
  roads_easements: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/roads_easements/{z}/{x}/{y}.pbf',
  roads: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/roads/{z}/{x}/{y}.pbf',
  zoning_toj_corp_limit: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/zoning_toj_corp_limit/{z}/{x}/{y}.pbf',
  zoning_toj_zoning_overlay: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/zoning_toj_zoning_overlay/{z}/{x}/{y}.pbf',
  zoning_toj_zoning: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/zoning_toj_zoning/{z}/{x}/{y}.pbf',
  zoning_zoverlay: 'https://storage.googleapis.com/first_bucket_store/Tiles/Test/zoning_zoverlay/{z}/{x}/{y}.pbf',
  public_land : 'https://storage.googleapis.com/first_bucket_store/tiles_v2/public_land/{z}/{x}/{y}.pbf',
  mooose_reprojected: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/mooose_reprojected/{z}/{x}/{y}.pbf',
  reporjected_elk: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/reporjected_elk/{z}/{x}/{y}.pbf',
  bigHorn_reporjected: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/bigHorn_reporjected/{z}/{x}/{y}.pbf',
  mule_deer_reporjected: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/mule_deer_reporjected/{z}/{x}/{y}.pbf',
  precincts: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/precincts/precincts_tiles/{z}/{x}/{y}.pbf',

  
};



const Map = () => {
  const {
    selectedFeature,
    setSelectedFeatures,
    layerStatus,
    setLayerStatus,
    GlobalActiveTab,
    setGlobalActiveTab,
    setIsDrawing,
    isDrawing,
    passPolygonToReportBuilder,
    isDrawingRef,
    mapRef,
    drawControl,
    setMapRef,
    isGeoFilterActiveRef,
    isGeoFilterActive,
    setIsGeoFilterActive,
    isMapTriggeredFromSearch,
    setIsMapTriggeredFromSearch,
    focusFeatures,
    hoveredFeatureId
  } = useMapContext();
  const [isPanelOpen, setIsPanelOpen] = useState(true); // State for toggling the side panel
  const [activeSidePanelTab, setActiveSidePanelTab] = useState('layers'); // Manage active tab state
  const navigate = useNavigate(); // Define navigate here
  const { subscriptionStatus } = useUser(); // or subscriptionStatus & user
  
  const [topLayer, setTopLayer] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true); // Map loading state
  const highlightLayerId = 'highlight-layer'; // ID for the highlight layer
  const [layerOrder, setLayerOrder] = useState([]); // "ownership" layer is initially in the order
  console.log("Destructured isGeoFilterActive in Map:", isGeoFilterActive);
  useEffect(() => {
    console.log('Initializing Mapbox map...');
  
    // Initialize the Mapbox map
    mapRef.current = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-110.76, 43.48],
      zoom: 10,
      minZoom: 6,
      maxZoom: 19,
    });
  

    
    drawControl.current = new MapboxDraw({
      displayControlsDefault: false,
      styles: [
        // Polygon styles (inactive and active)
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#FF0000',
            'fill-opacity': 0.2,
          },
        },
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#FF0000',
            'line-width': 3,
          },
        },
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#00FF00',
            'fill-opacity': 0.5,
          },
        },
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#00FF00',
            'line-width': 5,
          },
        },
        // LineString styles (inactive and active)
        {
          id: 'gl-draw-line-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString']],
          paint: {
            'line-color': '#FF0000', // Match polygon stroke inactive
            'line-width': 3,         // Match polygon stroke width
          },
        },
        {
          id: 'gl-draw-line-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'LineString']],
          paint: {
            'line-color': '#00FF00', // Match polygon stroke active
            'line-width': 5,         // Match polygon stroke width
          },
        },
      ],
    });
    

    if (mapRef.current && drawControl.current && !mapRef.current.hasControl(drawControl.current)) {
      mapRef.current.addControl(drawControl.current, 'top-left');
    }
    
    console.log('Draw control context before initialization:', drawControl.current._ctx);
  
    mapRef.current.on('load', () => {
      console.log('Map loaded successfully.');
      setIsMapLoading(false);
      
      // Set map reference for context
      if (mapRef.current && !mapRef.current.hasControl(drawControl.current)) {
        mapRef.current.addControl(drawControl.current, 'top-left');
      }
      setMapRef(mapRef.current);
  
      // Add the draw control to the map
      if (!mapRef.current.hasControl(drawControl.current)) {
        mapRef.current.addControl(drawControl.current, 'top-left');
      }
      console.log('Draw control context after map load:', drawControl.current._ctx);
      // Remove default draw toolbar (if needed)
      const drawControlToolbar = document.querySelector('.mapbox-gl-draw_ctrl-top-left');
      if (drawControlToolbar) {
        drawControlToolbar.parentNode.removeChild(drawControlToolbar);
      }
  
      // Add initial layers to the map
      updateLayers();
    });
    console.log('Draw control context after initialization:', drawControl.current._ctx);
  
    // Event listeners for draw actions
    mapRef.current.on('draw.create', updateDrawnFeatures);
    mapRef.current.on('draw.update', updateDrawnFeatures);
    mapRef.current.on('draw.delete', updateDrawnFeatures);
    console.log('draw.modechange')
    // Draw mode change event
    mapRef.current.on('draw.modechange', (event) => {
      const { mode } = event;
      console.log(`Draw mode changed to: ${mode}`);
      if (mode === 'draw_polygon' || mode === 'draw_line_string' || mode === 'draw_point') {
        console.log('Entering drawing mode');
        isDrawingRef.current = true;
        setIsDrawing(true);
      } else {
        console.log('Exiting drawing mode');
        //isDrawingRef.current = false;
        //setIsDrawing(false);
      }
    });
    mapRef.current.on('draw.selectionchange', (event) => {
      event.originalEvent?.stopPropagation(); // Stop propagation if it's part of a user-triggered event

      if (event.features.length > 0) {
        // A feature has been selected for editing
        console.log("Entering feature editing mode Updating to True");
        isDrawingRef.current = true; // Maintain drawing state during feature edit
        setIsDrawing(true);
      } else if (event.features.length === 0 && event.type === "draw.selectionchange") {
        // This happens when the "click to turn blue" interaction completes, and no features are actively being edited.
        setTimeout(() => {
          console.log("Exiting feature editing mode");
          isDrawingRef.current = false; // Allow normal interaction
          setIsDrawing(false);
        }, 500);
    }
    });
    mapRef.current.on('draw.selectionchange', (event) => {
      if (event.features.length > 0) {
        console.log('A feature has turned blue and is now selected:', event.features);
      } else {
        console.log('No feature is currently selected.');
      }
    });
    // Clean up function
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up map and draw control...');
        mapRef.current.removeControl(drawControl.current);
        mapRef.current.remove();
      }
    };
  }, []);
  
  const captureGeoFilterPolygon = (e, navigate) => {
    console.log("Entered Geo Filter Polygon function with isGeoFilterActiveRef as:");
    console.log(isGeoFilterActiveRef.current);
  
    if (!isGeoFilterActiveRef.current) return; // Only proceed if GeoFilter is active
  
    console.log("Capturing GeoFilter Polygon...");
  
    const drawnFeatures = e.features; // Get the drawn features
    if (drawnFeatures.length > 0 && drawnFeatures[0].geometry.type === 'Polygon') {
      const polygon = drawnFeatures[0]; // Get the first drawn feature
      console.log('Captured polygon:', polygon);
  
       // Calculate the area using Turf.js
      const polygonAreaInSqMeters = area(polygon); // Returns area in square meters
      const polygonAreaInAcres = polygonAreaInSqMeters * 0.000247105; // Convert to acres

      console.log('Polygon area in acres:', polygonAreaInAcres);

      // Pass the polygon and calculated area to the Report Builder
      const enhancedPolygon = {
        ...polygon,
        areaInAcres: polygonAreaInAcres.toFixed(2), // Round to 2 decimal places
      };

      passPolygonToReportBuilder(enhancedPolygon);

      // Remove the drawn polygon from the map
      drawControl.current.delete(drawnFeatures[0].id);
  
      // Exit drawing mode
      drawControl.current.changeMode('simple_select');
  
      // Reset GeoFilter active state
      isGeoFilterActiveRef.current = false; // Reset the ref
      console.log('GeoFilter state reset.');
  
      // Navigate back to the Reports page
      console.log("navigate: ")

      console.log(navigate)
      isDrawingRef.current = false;

      if (navigate) {
        console.log(navigate)
        navigate('/print'); // Adjust the route based on your app structure
      } else {
        setActiveSidePanelTab('print'); // Fallback to tab control if navigation is not available
      }
    }
  };
  

  useEffect(() => {
    const handleGeoFilterPolygon = (e) => captureGeoFilterPolygon(e, navigate);
  
    mapRef.current.on('draw.create', handleGeoFilterPolygon);
  
    return () => {
      mapRef.current.off('draw.create', handleGeoFilterPolygon);
    };
  }, [navigate]); // Include navigate in the dependency array


  const handleDrawLine = () => {
    drawControl.current.changeMode('draw_line_string');
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const handleDrawPolygon = () => {
    drawControl.current.changeMode('draw_polygon');
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const handleClearDrawings = () => {
    drawControl.current.deleteAll();
    setIsDrawing(false);
    console.log('Cancel button clicked. Changing to simple_select mode.');
    isDrawingRef.current = false;
    drawControl.current.changeMode('simple_select');

  };

  const handleEditDrawing = () => {
    drawControl.current.changeMode('simple_select');
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const handleSaveDrawing = () => {
    // Assuming that saving means simply stopping the drawing/editing mode
    drawControl.current.changeMode('simple_select');
    setIsDrawing(false);
  };

  const handleCancelEdit = () => {
    // Change mode to 'simple_select' to cancel the current drawing/editing
    drawControl.current.changeMode('simple_select');
    isDrawingRef.current = false;
    setIsDrawing(false);
  };
  
  
  const updateDrawnFeatures = () => {
    // Get all drawn features from the MapboxDraw control
    const drawnFeatures = drawControl.current.getAll();
    console.log('Updated Drawn Features:', drawnFeatures);
    // Here you can save the drawn features to local storage or send them to a server
  };

  useEffect(() => {
    // Only run this effect if `isMapTriggeredFromSearch` is true
    if (isMapTriggeredFromSearch && focusFeatures && focusFeatures.length > 0) {
      console.log('Valid focusFeatures list detected. Zooming to and highlighting features...');
      handleFeatureZoomAndHighlight(focusFeatures); // Pass the list to the function
  
      // Reset the trigger to avoid re-running this effect unnecessarily
      setIsMapTriggeredFromSearch(false);
    } else {
      console.warn('Effect skipped: No map trigger or empty focusFeatures list:', focusFeatures);
    }
  }, [isMapTriggeredFromSearch, focusFeatures]);
  

  // Handle feature click event
  // Handle feature click event
// Handle feature click event
useEffect(() => {
  mapRef.current.on('click', (e) => {
    const drawMode = mapRef.current?.draw?.getMode?.(); // Check the current draw mode if available
    console.log("Current draw mode:", drawMode);

    // If we're in a drawing/editing mode, update the boolean and prevent the click event
    if (drawMode === 'draw_polygon' || drawMode === 'draw_line_string' || drawMode === 'simple_select') {
      console.log("Entering drawing/edit mode; suppressing click.");
      isDrawingRef.current = true; // Ensure the boolean is set to true
      setIsDrawing(true);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    console.log("Not in drawing/edit mode; proceeding with click.");
    // Allow normal click behavior if not in drawing/edit mode
  });
}, []);


useEffect(() => {
  if (!mapRef.current) return;

  const handleClick = (e) => {
    console.log("Feature Click Activated");
    console.log("Drawing Boolean is:", isDrawingRef);
  
    if (isDrawingRef.current || isDrawing) {
      return;
    }
  
    const existingLayers = Object.keys(layerStatus).filter(
      (layerName) => layerStatus[layerName] && mapRef.current.getLayer(`${layerName}-layer`)
    );
  
    if (existingLayers.length > 0) {
      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: existingLayers.map((layerName) => `${layerName}-layer`),
      });
      console.log("Queried features at click:", features); // Log the features found
  
      if (features.length > 0) {
        const clickedFeature = features[0];
        const clickedPidn = clickedFeature.properties.Name || clickedFeature.properties.pidn;
  
        setSelectedFeatures((prevFeatures) => {
          const isAlreadySelected = prevFeatures.some(
            (f) => (f.properties.Name || f.properties.pidn) === clickedPidn
          );
  
          if (e.originalEvent.shiftKey) {
            console.log("Shift key is held down.");
            if (isAlreadySelected) {
              // Remove the feature if it is already selected
              console.log("Feature is already selected. Removing it from selection.");
              const updatedSelection = prevFeatures.filter(
                (f) => (f.properties.Name || f.properties.pidn) !== clickedPidn
              );
              highlightFeature(updatedSelection); // Update the highlights
              return updatedSelection;
            } else {
              // Add the feature to the selection
              console.log("Adding feature to selection.");
              const updatedSelection = [...prevFeatures, clickedFeature];
              highlightFeature(updatedSelection); // Update the highlights
              return updatedSelection;
            }
          } else {
            // Reset selection if Shift is not held down
            console.log("Shift key not held. Resetting selection.");
            if (isAlreadySelected && prevFeatures.length === 1) {
              console.log("Clicked feature is the only one selected. Clearing selection.");
              removeHighlight(); // Remove highlights
              return []; // Clear the selection
            } else {
              console.log("Selecting only the clicked feature.");
              highlightFeature([clickedFeature]); // Highlight the new selection
              return [clickedFeature]; // Set the clicked feature as the only selection
            }
          }
        });
  
        setActiveSidePanelTab('info'); // Switch to the info tab in the side panel
      } else {
        console.log("No features clicked. Clearing selection.");
        setSelectedFeatures([]); // Clear selection if no feature is clicked
        removeHighlight(); // Remove any existing highlight
      }
    }
  };
  
   // Depend on hoveredFeatureId and layerStatus
  

  mapRef.current.on('click', handleClick);

  return () => {
    if (mapRef.current) {
      mapRef.current.off('click', handleClick); // Clean up the click event listener on unmount
    }
  };
}, [layerStatus]);



  useEffect(() => {
    if (!mapRef.current.isStyleLoaded()) {
      mapRef.current.on('style.load', () => {
        //console.log('Map style loaded. Updating layers...');
        updateLayers();
      });
    } else {
      //console.log('Map style already loaded. Updating layers...');
      updateLayers();
    }
  }, [layerStatus]);


  useEffect(() => {
    const highlightHoverFeature = (hoveredId) => {
      if (!mapRef.current || !mapRef.current.isStyleLoaded()) {
        console.warn("Map style is not loaded yet. Cannot highlight features.");
        return;
      }
  
      // Remove any existing hover highlights
      if (mapRef.current.getLayer('hover-highlight-layer')) {
        mapRef.current.removeLayer('hover-highlight-layer');
      }
      if (mapRef.current.getLayer('hover-highlight-outline-layer')) {
        mapRef.current.removeLayer('hover-highlight-outline-layer');
      }
      if (mapRef.current.getSource('hover-highlight-source')) {
        mapRef.current.removeSource('hover-highlight-source');
      }
  
      if (!hoveredId) {
        console.log("No feature is hovered. Hover highlight cleared.");
        return; // Exit if no feature is hovered
      }
  
      // Query all rendered features in the relevant layer
      const queriedFeatures = mapRef.current.queryRenderedFeatures({
        layers: ['ownership-layer'], // Adjust layer name as needed
      });
  
      // Find the feature(s) that match the hovered ID
      const matchingFeatures = queriedFeatures.filter((f) => {
        const queriedPidn = f.properties?.pidn || parsePidnFromDescription(f.properties?.description);
        return queriedPidn === hoveredId;
      });
  
      if (matchingFeatures.length === 0) {
        console.warn('No matching features found for the hovered feature in the ownership layer.');
        return;
      }
      
      console.log('Matching feature for hovered ID:', matchingFeatures);
      // Since there will be at most one feature, use the first match directly
      let unifiedFeature; // Declare unifiedFeature outside the if-else block

      if (matchingFeatures.length > 1) {
        const featureCollection = turf.featureCollection(matchingFeatures);
        unifiedFeature = turf.union(featureCollection); // Assign the unioned feature
      } else {
        unifiedFeature = matchingFeatures[0]; // Use the single matching feature directly
      }
      

      // Add the hover highlight to the map
      try {
        mapRef.current.addSource('hover-highlight-source', {
          type: 'geojson',
          data: unifiedFeature,
        });
  
        mapRef.current.addLayer({
          id: 'hover-highlight-layer',
          type: 'fill',
          source: 'hover-highlight-source',
          paint: {
            'fill-color': 'rgba(255, 255, 0, 0.25)', // Yellow fill for hover
            'fill-outline-color': '#FFFF00', // Yellow outline for hover
            'fill-opacity': 0.5,
          },
        });
  
        mapRef.current.addLayer({
          id: 'hover-highlight-outline-layer',
          type: 'line',
          source: 'hover-highlight-source',
          paint: {
            'line-color': '#FFFF00', // Yellow outline
            'line-width': 2,
          },
        });
      } catch (error) {
        console.error("Error adding hover highlight layers:", error);
      }
    };
  
    // Call the highlightHoverFeature function when hoveredFeatureId changes
    highlightHoverFeature(hoveredFeatureId);
  
    // Cleanup on component unmount
    return () => {
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        if (mapRef.current.getLayer('hover-highlight-layer')) {
          mapRef.current.removeLayer('hover-highlight-layer');
        }
        if (mapRef.current.getLayer('hover-highlight-outline-layer')) {
          mapRef.current.removeLayer('hover-highlight-outline-layer');
        }
        if (mapRef.current.getSource('hover-highlight-source')) {
          mapRef.current.removeSource('hover-highlight-source');
        }
      }
    };
  }, [hoveredFeatureId, layerStatus]);
  
   

  const updateLayers = () => {
    console.log('Updating layers with current layerStatus:', layerStatus);
  
    // Update map layers based on layerStatus changes
    Object.keys(layerStatus).forEach((layerName) => {
      const isVisible = layerStatus[layerName];
      console.log(`Processing layer "${layerName}" - Visibility: ${isVisible}`);
  
      // Check if the source for the layer exists, if not add it
      if (!mapRef.current.getSource(layerName)) {
        console.log(`Adding source for layer "${layerName}"`);
        mapRef.current.addSource(layerName, {
          type: 'vector',
          tiles: [tileLayerUrls[layerName]],
          minzoom: 6,
          maxzoom: 14,
        });
      }
  
      // Add the layer if it is visible and not already added
      if (isVisible) {
        if (!mapRef.current.getLayer(`${layerName}-layer`)) {
          console.log(`Adding layer "${layerName}-layer" to the map`);
  
          // Get the default layer style
          let style = getLayerStyle(layerName);
          if (style) {
            try {
              mapRef.current.addLayer(style);
              console.log(`Added layer "${layerName}-layer" with default styles.`);
            } catch (error) {
              console.error(`Error adding layer: ${error}`);
            }
          } else {
            console.warn(`No style found for layer: ${layerName}`);
          }
  
          // Add a listener to wait until the source is loaded to update styles dynamically if it's a zoning layer
          mapRef.current.on('sourcedata', (e) => {
            if (e.sourceId === layerName && e.isSourceLoaded) {
              console.log(`Source loaded for layer "${layerName}"`);
  
              // Check if the layer exists before updating the style
              if (!mapRef.current.getLayer(`${layerName}-layer`)) {
                console.warn(`Layer "${layerName}-layer" does not exist when attempting to apply styles.`);
                return;
              }
  
              // Query features to use for dynamic styles
              const features = mapRef.current.querySourceFeatures(layerName, { sourceLayer: layerName });
              if (features.length === 0) {
                console.warn(`No features found in the ${layerName} layer's source.`);
              } else {
                console.log(`${layerName} features found:`, features.map((f) => f.properties));
  
                // Get the updated style based on features
                style = getLayerStyle(layerName, features);
                if (style) {
                  const paint = style.paint;
                  if (paint) {
                    try {
                      if (mapRef.current.getLayer(`${layerName}-layer`)) {
                        // Set properties based on the layer type
                        if (style.type === 'fill') {
                          // Fill type layer
                          if (paint['fill-color']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'fill-color', paint['fill-color']);
                          }
                          if (paint['fill-opacity']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'fill-opacity', paint['fill-opacity']);
                          }
                          if (paint['fill-outline-color']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'fill-outline-color', paint['fill-outline-color']);
                          }
                        } else if (style.type === 'line') {
                          // Line type layer
                          if (paint['line-color']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'line-color', paint['line-color']);
                          }
                          if (paint['line-width']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'line-width', paint['line-width']);
                          }
                        } else if (style.type === 'circle') {
                          // Circle type layer (e.g., points)
                          if (paint['circle-radius']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'circle-radius', paint['circle-radius']);
                          }
                          if (paint['circle-color']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'circle-color', paint['circle-color']);
                          }
                          if (paint['circle-stroke-width']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'circle-stroke-width', paint['circle-stroke-width']);
                          }
                          if (paint['circle-stroke-color']) {
                            mapRef.current.setPaintProperty(`${layerName}-layer`, 'circle-stroke-color', paint['circle-stroke-color']);
                          }
                        }
                      }
                    } catch (error) {
                      console.error(`Error updating layer paint properties: ${error}`);
                    }
                  }
                }
              }
            }
          });
        } else {
          // If the layer is already added, just make sure it's visible
          console.log(`Setting visibility of "${layerName}-layer" to "visible"`);
          mapRef.current.setLayoutProperty(`${layerName}-layer`, 'visibility', 'visible');
        }
  
        // Ensure the toggled layer is brought to the top
        setTopLayer(layerName);
        console.log('Top layer updated:', layerName);
      } else {
        // If the layer is supposed to be hidden, set its visibility to "none"
        if (mapRef.current.getLayer(`${layerName}-layer`)) {
          console.log(`Setting visibility of "${layerName}-layer" to "none"`);
          mapRef.current.setLayoutProperty(`${layerName}-layer`, 'visibility', 'none');
  
          // Check if the highlighted feature is in the deselected layer and remove the highlight if so
          if (selectedFeature && selectedFeature.length > 0) {
            // Subtract featuresToRemove from selectedFeatures
            const updatedSelectedFeatures = selectedFeature.filter(
              (feature) => feature.sourceLayer !== layerName
            );
            


            if (updatedSelectedFeatures.length > 0) {
              console.log(`Removing highlights for features in the hidden layer: "${layerName}"`);
              setSelectedFeatures(updatedSelectedFeatures); // Update selectedFeatures state
              highlightFeature(updatedSelectedFeatures); // Reapply highlights
            }
          }
        } else {
          console.log(`Layer "${layerName}-layer" is not present on the map, no action needed`);
        }
      }
    });
  
    // Reorder layers based on the `layerOrder`
    layerOrder.forEach((layerName) => {
      if (mapRef.current.getLayer(`${layerName}-layer`)) {
        mapRef.current.moveLayer(`${layerName}-layer`);
      }
    });
  };
  
  
  
  
  
  
  const handleFeatureZoomAndHighlight = (features) => {
    if (!features || features.length === 0) {
      console.warn('No features provided to zoom and highlight.');
      return;
    }
  
    console.log('Handling zoom and highlight for features:', features);
  
    // Remove existing highlights
    removeHighlight();
  
    // Calculate combined bounds from feature bboxes
    const bounds = features.reduce((acc, feature) => {
      if (feature.bbox && feature.bbox.length === 4) {
        const [minX, minY, maxX, maxY] = feature.bbox;
        acc = acc
          ? [
              Math.min(acc[0], minX),
              Math.min(acc[1], minY),
              Math.max(acc[2], maxX),
              Math.max(acc[3], maxY),
            ]
          : [minX, minY, maxX, maxY];
      }
      return acc;
    }, null);
  
    if (bounds && bounds.length === 4) {
      mapRef.current.fitBounds(bounds, {
        padding: 200,
        duration: 1000, // Add smooth animation duration
      });
      console.log('Map zoomed to feature bounds:', bounds);
    } else {
      console.warn('Invalid feature bounds:', bounds);
      return;
    }
  
    // Step 3: After zooming, highlight all features
    mapRef.current.once('moveend', () => {
      console.log('Map moveend event triggered. Querying matching features...');
  
      // Query all rendered features in the ownership layer
      const queriedFeatures = mapRef.current.queryRenderedFeatures({
        layers: ['ownership-layer'], // Ensure you're querying the correct layer
      });
  
      // Extract the PIDNs of the input features
      // Extract the PIDNs of the input features
      const inputPidns = features
      .map((feature, index) => {
        const pidn = feature.properties?.pidn;
        console.log(`Feature at index ${index}:`, feature); // Print the entire feature for debugging
        console.log(`Extracted PIDN for feature at index ${index}:`, pidn); // Print the extracted PIDN
        return pidn;
      })
      .filter(Boolean); // Filter out undefined or null PIDNs

      // Filter the queried features to find matches based on PIDN
      
  
      const matchingFeatures = queriedFeatures.filter((f) => {
        const queriedPidn = f.properties?.pidn || parsePidnFromDescription(f.properties?.description);
        return inputPidns.includes(queriedPidn);
      });
      
      if (matchingFeatures.length === 0) {
        console.warn('No matching features found in the ownership layer.');
        return;
      }
  
      console.log('Matching features from the ownership layer:', matchingFeatures);
  
      setIsMapTriggeredFromSearch(false);
    setSelectedFeatures(matchingFeatures)
    // Highlight the matching features
    highlightFeature(matchingFeatures);
  
    // Switch to the info tab after highlighting
    setActiveSidePanelTab('info');
    console.log('Switched to info tab.');
    });
  };
  
  
    // Reset the selected features to the matching features
 

  // Function to add tile boundaries for debugging purposes
  const addTileBoundaries = () => {
    console.log('Adding tile boundaries layer for debugging...');
    mapRef.current.showTileBoundaries = true;
  };

  const parsePidnFromDescription = (description) => {
    if (!description) {
      return null;
    }
  
    const parser = new DOMParser();
    const doc = parser.parseFromString(description, 'text/html');
    const rows = doc.querySelectorAll('tr');
  
    for (const row of rows) {
      const th = row.querySelector('th')?.textContent?.trim().toLowerCase();
      const td = row.querySelector('td')?.textContent?.trim();
      if (th === 'pidn') {
        return td;
      }
    }
  
    return null; // Return null if pidn not found
  };
  
  

  useEffect(() => {
    if (!mapRef.current) return;
  
    // Function to handle the zoom or pan events
    const handleViewChange = () => {
      if (selectedFeature) {
        //console.log('Map view changed, readjusting highlight...');
        highlightFeature(selectedFeature); // Re-call highlightFeature to update the highlighted geometry
      }
    };
  
    // Add event listeners for 'moveend' and 'zoomend'
    mapRef.current.on('moveend', handleViewChange);
    mapRef.current.on('zoomend', handleViewChange);
  
    // Clean up event listeners on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.off('moveend', handleViewChange);
        mapRef.current.off('zoomend', handleViewChange);
      }
    };
  }, [selectedFeature]);
  

  useEffect(() => {
    if (selectedFeature) {
      //console.log("Selected feature changed:", selectedFeature);
    } else {
      //console.log("No feature currently selected.");
    }
  }, [selectedFeature]);

  
  const highlightFeature = (inputFeatures) => {
    // Remove any existing highlights
    console.log("Removing existing highlights...");
    removeHighlight();
  
    if (!inputFeatures || inputFeatures.length === 0) {
      console.warn("No input features provided for highlighting.");
      return;
    }
  
    console.log("Input features for highlighting:", inputFeatures);
  
    // Step 1: Initialize a dictionary for matching features
    const featureDict = {};
    inputFeatures.forEach((feature) => {
      const featurePidn = feature.properties.Name || feature.properties.pidn;
      if (featurePidn) {
        featureDict[featurePidn] = []; // Initialize an empty array for this feature
      } else {
        console.warn("Feature has no valid PIDN:", feature);
      }
    });
  
    console.log("Initialized feature dictionary:", featureDict);
  
    // Step 2: Query all visible features and populate the dictionary
    const visibleLayers = Object.keys(layerStatus).filter((layerName) => layerStatus[layerName]);
    console.log(`Processing ${visibleLayers.length} visible layers.`);
  
    visibleLayers.forEach((layerName) => {
      const queriedFeatures = mapRef.current.queryRenderedFeatures({
        layers: [`${layerName}-layer`],
      });
  
      queriedFeatures.forEach((visibleFeature) => {
        const visiblePidn = visibleFeature.properties.Name || visibleFeature.properties.pidn;
        if (featureDict[visiblePidn]) {
          // If the visible feature matches an input feature, add it to the dictionary
          featureDict[visiblePidn].push(turf.feature(visibleFeature.geometry, visibleFeature.properties));
        }
      });
    });
  
    console.log("Populated feature dictionary:", featureDict);
  
    // Step 3: Process the dictionary to create unified features
    const unifiedFeatures = [];
    Object.keys(featureDict).forEach((pidn) => {
      const matchingParts = featureDict[pidn];
  
      if (matchingParts.length === 0) {
        console.warn(`No matching parts found for PIDN: ${pidn}.`);
        return;
      }
  
      if (matchingParts.length === 1) {
        // Use the single matching part directly
        unifiedFeatures.push(matchingParts[0]);
      } else {
        // Perform a union of all matching parts
        try {
          console.log(`Performing union for PIDN: ${pidn} with ${matchingParts.length} parts.`);
          const featureCollection = turf.featureCollection(matchingParts);
          const unifiedFeature = turf.union(featureCollection);
          unifiedFeatures.push(unifiedFeature);
        } catch (error) {
          console.error(`Error during union for PIDN: ${pidn}`, error);
        }
      }
    });
  
    // Step 4: Add unified features to the map
    if (unifiedFeatures.length > 0) {
      try {
        const featureCollection = turf.featureCollection(unifiedFeatures);
  
        // Add a GeoJSON source for highlighting
        mapRef.current.addSource(highlightLayerId, {
          type: "geojson",
          data: featureCollection,
        });
  
        // Add a fill layer for highlights
        mapRef.current.addLayer({
          id: highlightLayerId,
          type: "fill",
          source: highlightLayerId,
          paint: {
            "fill-color": "rgba(255, 0, 0, 0.25)",
            "fill-outline-color": "#FF0000",
            "fill-opacity": 1,
          },
        });
  
        // Add a line layer for feature outlines
        mapRef.current.addLayer({
          id: `${highlightLayerId}-outline`,
          type: "line",
          source: highlightLayerId,
          paint: {
            "line-color": "#FF0000",
            "line-width": 3,
          },
        });
      } catch (error) {
        console.error("Error during map layer creation for highlighted features:", error);
      }
    } else {
      console.warn("No features to highlight.");
    }
  };
  
  

  
  
  
  const handleBasemapChange = (styleId) => {
    console.log(`Switching basemap to: ${styleId}`);
    if (mapRef.current) {
      mapRef.current.setStyle(`mapbox://styles/mapbox/${styleId}`);
      mapRef.current.once('styledata', () => {
        console.log("Basemap style changed, waiting for map to finish rendering...");
        mapRef.current.once('idle', () => {
          console.log("Map finished rendering. Re-adding layers and highlights...");
          updateLayers(); // Re-add layers after basemap changes
          if (selectedFeature && selectedFeature.length > 0) {
            console.log("Re-adding highlights for selected features...");
            highlightFeature(selectedFeature); // Re-add highlights after basemap change
          }
        });
      });
    }
  };

  
  
  
  

  const removeHighlight = (featuresToRemove = []) => {
    // Remove all layers that depend on the highlight source
    if (mapRef.current.getLayer(highlightLayerId)) {
      mapRef.current.removeLayer(highlightLayerId);
    }
    if (mapRef.current.getLayer(`${highlightLayerId}-outline`)) {
      mapRef.current.removeLayer(`${highlightLayerId}-outline`);
    }
  
    // Once all layers are removed, remove the source
    if (mapRef.current.getSource(highlightLayerId)) {
      mapRef.current.removeSource(highlightLayerId);
    }
  };
  

  return (
    
    <div className="map-container">
      {isMapLoading && <Spinner />}
      <div className="layer-selector-container">
      <button className="layer-selector-button">
        <img
          src="https://cdn-icons-png.flaticon.com/512/622/622669.png" // Replace with an icon of your choice
          alt="Layers"
          className="layer-icon"
        />
      </button>
      <div className="layer-selector-popup">
        <button onClick={() => handleBasemapChange('streets-v11')}>Streets</button>
        <button onClick={() => handleBasemapChange('light-v10')}>Light</button>
        <button onClick={() => handleBasemapChange('satellite-v9')}>Satellite</button>
      </div>
    </div>
      <ToolPanel
        onZoomIn={() => mapRef.current.zoomIn()}
        onZoomOut={() => mapRef.current.zoomOut()}
        onDrawLine={handleDrawLine}
        onDrawPolygon={handleDrawPolygon}
        onClear={handleClearDrawings}
        onEdit={handleEditDrawing}
        onSaveEdit={handleSaveDrawing}
        onCancelEdit={handleCancelEdit}
      />
      <SidePanel
        isOpen={isPanelOpen}
        togglePanel={() => setIsPanelOpen(!isPanelOpen)}
        layerStatus={layerStatus}
        setLayerStatus={(layerName) =>
          setLayerStatus((prevStatus) => ({
            ...prevStatus,
            [layerName]: !prevStatus[layerName],
          }))
        }
        activeSidePanelTab={activeSidePanelTab}
        setActiveSidePanelTab={setActiveSidePanelTab}
        selectedFeature={selectedFeature} // Pass only properties for Info tab
        topLayer={topLayer} // Pass the top layer to SidePanel
        layerOrder={layerOrder}
        setLayerOrder={setLayerOrder}
      />
      
      <div id="map" className={`map ${isPanelOpen ? 'with-panel' : ''}`}></div>
      {subscriptionStatus !== "active" && (
      <div className="map-overlay">
        <h2 className="overlay-title">Login to Access the Map</h2>
        <p className="overlay-text">
          You must have an active subscription to interact with the data.
        </p>
        <button
          className="overlay-button"
          onClick={() => {
            // E.g., navigate to /signup or show your re-subscribe flow
            navigate("/login");
          }}
        >
          Subscribe Now
        </button>
      </div>
    )}
    </div>
  );
};

export default Map;
