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
import { useMapContext } from './MapContext'; // Adjust path as needed
import { useUser } from "../contexts/UserContext";
import useMapboxDraw from "../hooks/useMapboxDraw";
// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1Ijoibm9haC1nYW5zIiwiYSI6ImNsb255ajJteDB5Z2gya3BpdXU5M29oY3YifQ.VbPKEHZ91PNoSAH-raskhw';

// URLs for vector tile layers in GCS
const tileLayerUrls = {
  ownership: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/ownership/{z}/{x}/{y}.pbf',
  zoning: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/zoning/{z}/{x}/{y}.pbf',
  conservation_easements: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/conservation_easements/{z}/{x}/{y}.pbf',
  control_points_controls: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/control_points_controls/{z}/{x}/{y}.pbf',
  ownership_address: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/ownership_address/{z}/{x}/{y}.pbf',
  plss_plss_intersected: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/plss_plss_intersected/{z}/{x}/{y}.pbf',
  plss_plss_labels: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/plss_plss_labels/{z}/{x}/{y}.pbf',
  plss_plss_sections: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/plss_plss_sections/{z}/{x}/{y}.pbf',
  plss_plss_townships: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/plss_plss_townships/{z}/{x}/{y}.pbf',
  precincts_polling_centers: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/precincts_polling_centers/{z}/{x}/{y}.pbf',
  roads_easements: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/roads_easements/{z}/{x}/{y}.pbf',
  roads: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/roads/{z}/{x}/{y}.pbf',
  zoning_toj_corp_limit: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/zoning_toj_corp_limit/{z}/{x}/{y}.pbf',
  zoning_toj_zoning_overlay: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/zoning_toj_zoning_overlay/{z}/{x}/{y}.pbf',
  zoning_toj_zoning: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/zoning_toj_zoning/{z}/{x}/{y}.pbf',
  zoning_zoverlay: 'https://storage.googleapis.com/first_bucket_store/daily_tiles/zoning_zoverlay/{z}/{x}/{y}.pbf',
  public_land : 'https://storage.googleapis.com/first_bucket_store/tiles_v2/public_land/{z}/{x}/{y}.pbf',
  mooose_reprojected: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/mooose_reprojected/{z}/{x}/{y}.pbf',
  reporjected_elk: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/reporjected_elk/{z}/{x}/{y}.pbf',
  bigHorn_reporjected: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/bigHorn_reporjected/{z}/{x}/{y}.pbf',
  mule_deer_reporjected: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/mule_deer_reporjected/{z}/{x}/{y}.pbf',
  precincts: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/precincts/precincts_tiles/{z}/{x}/{y}.pbf',
  FEMA_updated: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/FEMA_updated/{z}/{x}/{y}.pbf',

  
};



const Map = () => {


  // =============== Constants and Component Def ===============

  const {
    selectedFeature,
    setSelectedFeatures,
    layerStatus,
    setLayerStatus,
    GlobalActiveTab,
    setGlobalActiveTab,
    mapRef,
    setMapRef,
    isGeoFilterActiveRef,
    isGeoFilterActive,
    setIsGeoFilterActive,
    isMapTriggeredFromSearch,
    setIsMapTriggeredFromSearch,
    focusFeatures,
    hoveredFeatureId,
    layerOrder,
    setLayerOrder,
    isDrawingRef,
    drawRef
  } = useMapContext();
  const [isPanelOpen, setIsPanelOpen] = useState(true); // State for toggling the side panel
  const [activeSidePanelTab, setActiveSidePanelTab] = useState('layers'); // Manage active tab state
  const navigate = useNavigate(); // Define navigate here
  const { subscriptionStatus } = useUser(); // or subscriptionStatus & user
  const [topLayer, setTopLayer] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true); // Map loading state
  const highlightLayerId = 'highlight-layer'; // ID for the highlight layer
  const [selectedFilterPolygon, setSelectedFilterPolygon] = useState(null);
  console.log("Destructured isGeoFilterActive in Map:", isGeoFilterActive);
  const baseMapRef = useRef("streets-v11"); // Default basemap

  /**
   *  =============== Map Initialization ===============
   *
   * Creates Mapbox map and and then after it's done loading sets loading bool
   * to false, setsMapRef in parent. Calls updateLayers which adds ownership becase
   * of it's hard coded True in parent layerStatus
   * @param {number} a - The first number.
   * @param {number} b - The second number.
   * @returns {number} The result of adding `a` and `b`.
   */
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

    mapRef.current.on('load', () => {
      console.log('Map loaded successfully.');
      if (!mapRef.current.hasImage('custom-pin')) {
        mapRef.current.loadImage('/pin_better.png', (error, image) => {
          if (error) {
            console.error("Error loading pin image:", error);
            return;
          }
          mapRef.current.addImage('custom-pin', image);
          console.log('Custom pin added to map.');
        });

      }
      setIsMapLoading(false);
      setMapRef(mapRef.current);
      updateLayers();
      console.log("Loaded Images: ", mapRef.current.listImages());
    });
    
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up map and draw control...');
        mapRef.current.remove();
      }
    };
  }, []);
  

  /**
   * =============== Draw Hook ===============
   * Integrates with custom hook `useMapboxDraw` to enable polygon/line drawing.
   * The hook internally handles draw events like `draw.create`, mode changes, etc.
   */
  const { drawPolygon, drawLine, selectParcelsWithPolygon, clearAllDrawings, deleteSelectedFeature} = useMapboxDraw({
    mapRef,
    onPolygonCreated: (polyFeature) => {
      console.log("Polygon created:", polyFeature);
      // Possibly do area calc or passPolygonToReportBuilder
      // e.g. passPolygonToReportBuilder(polyFeature);
    },

    onPolygonFinalized: (finalPolyFeature) => {
      console.log("🚀🚀🚀🚀🚀🚀🚀🚀 Finalized Polygon for Parcel Selection:", finalPolyFeature);
    
      // Store the polygon for future reference
      setSelectedFilterPolygon(finalPolyFeature);
    
      // Zoom to polygon
      zoomToPolygon(finalPolyFeature);
    
      // Select parcels inside the polygon
      mapRef.current.once("moveend", () => {
        console.log("📌 Move complete, now selecting parcels.");
        selectParcelsInsidePolygon(finalPolyFeature);
      });
    },
    
  });


  function getBoundingBox(polygon) {
    const coords = polygon.coordinates[0]; // Outer ring
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    coords.forEach(([lng, lat]) => {
      if (lng < minX) minX = lng;
      if (lat < minY) minY = lat;
      if (lng > maxX) maxX = lng;
      if (lat > maxY) maxY = lat;
    });

    return [[minX, minY], [maxX, maxY]]; // [Southwest, Northeast]
  }

  function zoomToPolygon(polygon) {
    const bounds = getBoundingBox(polygon);
    mapRef.current.fitBounds(bounds, {
      padding: 100, // Adjust padding for better visualization
      duration: 800, // Smooth animation
    });
  
    console.log("📍 Map zoomed to polygon bounds:", bounds);
  }

  function selectParcelsInsidePolygon(polygon) {
    console.log("🔍 Querying features within selection polygon...");
  
    // Get all visible ownership features
    const queriedFeatures = mapRef.current.queryRenderedFeatures({
      layers: ["ownership-layer"], // Adjust to match your ownership layer ID
    });
  
    if (!queriedFeatures.length) {
      console.warn("❌ No features found in ownership layer.");
      return;
    }
  
    console.log(`🗺️ Queried ${queriedFeatures.length} features from ownership layer.`);
  
    // Convert the drawn polygon to a Turf.js Polygon
    const selectionPolygon = turf.polygon(polygon.coordinates);
  
    // Filter features that fall inside the drawn polygon
    const selectedFeatures = queriedFeatures.filter((feature) => {
      if (!feature.geometry) return false;
      
      // Convert feature to a Turf.js Point (using centroid for better accuracy)
      const featurePoint = turf.centroid(turf.feature(feature.geometry));
  
      // Check if the centroid is inside the polygon
      return turf.booleanPointInPolygon(featurePoint, selectionPolygon);
    });
  
    console.log(`✅ ${selectedFeatures.length} features selected inside the polygon.`);
  
    // Highlight & Store Selected Features
    setSelectedFeatures(selectedFeatures);
    highlightFeature(selectedFeatures);
  }
  



 
  /**=============== Adds layers to the map depending on layer status ===============
   * Dynamically adds or removes map layers based on `layerStatus`.
   * For each visible layer, we add a vector source and the corresponding map layer.
   * We also move it "on top" if toggled last.
   */
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
          let style = getLayerStyle(layerName, null, baseMapRef);
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
                style = getLayerStyle(layerName, features, baseMapRef);
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
        // ✅ ADD BORDER WHEN OWNERSHIP IS TOGGLED ON
        if (layerName === "ownership") {
          console.log("Adding ownership boundary layers...");
        
          if (!mapRef.current.getLayer("ownership_outer_borders")) {
            let outerBorderStyle = getLayerStyle("ownership_outer_borders", null, baseMapRef);
            if (outerBorderStyle) {
              try {
                mapRef.current.addLayer(outerBorderStyle);
                console.log("Added outer ownership boundary layer.");
              } catch (error) {
                console.error("Error adding outer ownership boundary layer:", error);
              }
            }
          }
        
          if (!mapRef.current.getLayer("ownership_inner_borders")) {
            let innerBorderStyle = getLayerStyle("ownership_inner_borders", null, baseMapRef);
            if (innerBorderStyle) {
              try {
                mapRef.current.addLayer(innerBorderStyle);
                console.log("Added inner ownership boundary layer.");
              } catch (error) {
                console.error("Error adding inner ownership boundary layer:", error);
              }
            }
          }
        
          
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
        // ✅ REMOVE BORDER WHEN OWNERSHIP IS TOGGLED OFF
        if (layerName === "ownership") {
          if (mapRef.current.getLayer("ownership-inner-borders")) {
              console.log("Removing ownership boundary layer.");
              mapRef.current.removeLayer("ownership-inner-borders");
          }
          if (mapRef.current.getLayer("ownership-outer-borders")) {
            console.log("Removing ownership boundary layer.");
            mapRef.current.removeLayer("ownership-outer-borders");
        }
       }
      }
      console.log("Trying to add ownership border")
      

    });

    // Reorder layers based on the `layerOrder`
    layerOrder.forEach((layerName) => {
      if (mapRef.current.getLayer(`${layerName}-layer`)) {
        mapRef.current.moveLayer(`${layerName}-layer`);
      }
    });
    console.log("Layer Order:")
    console.log(layerOrder)

    
    const styleLayers = mapRef.current.getStyle().layers || [];
    styleLayers.forEach((layer) => {
      if (layer.type === 'symbol') {
        mapRef.current.moveLayer(layer.id);
      }
    });
    console.log(mapRef.current.getLayer("settlement-label"));
    mapRef.current.setPaintProperty("settlement-label", "text-color", "#000000");
    mapRef.current.setPaintProperty("settlement-label", "text-halo-color", "#FFFFFF");
    mapRef.current.setPaintProperty("settlement-label", "text-halo-width", 15);
    mapRef.current.setPaintProperty("settlement-label", "text-halo-blur", 20);




    const allLayers = mapRef.current.getStyle().layers; // array of { id: <string>, ... }
    console.log(
      "Final mapbox layer stack (bottom -> top):", 
      allLayers.map((layer) => layer.id)
    );
    
    
  };

  /**=============== Handle Feature Click  ===============
   * useEffect: Sets up a global click handler on the map for feature selection.
   * If a user shift-clicks, we multi-select; otherwise we reset selection.
   */
  useEffect(() => {
    if (!mapRef.current) return;

    const handleClick = (e) => {
      console.log("Feature Click Activated");
      
      // ✅ Ignore clicks if the user is drawing
      console.log(isDrawingRef.current)
      if (isDrawingRef.current == true) {
        console.log("🎨 User is drawing, ignoring feature click.");
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
          const clickedPidn = clickedFeature.properties.Name || clickedFeature.properties.pidn || clickedFeature.properties.OBJECTID || clickedFeature.properties.precinct || clickedFeature.properties.FLD_AR_ID;
    
          setSelectedFeatures((prevFeatures) => {
            const isAlreadySelected = prevFeatures.some(
              (f) => (f.properties.Name || f.properties.pidn || f.properties.OBJECTID || f.properties.precinct || f.properties.FLD_AR_ID) === clickedPidn
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
    
    mapRef.current.on('click', handleClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleClick); // Clean up the click event listener on unmount
      }
    };
  }, [layerStatus]);

  /**=============== Side Panel Higlight ===============
   * useEffect: Monitors hover changes (hoveredFeatureId). If a feature is hovered,
   * we add a distinct highlight. If not hovered, we remove the highlight.
   */
  useEffect(() => {

    /**
     * Adds or removes a hover highlight for the specified feature ID in "ownership-layer".
     * 
     * @param {string|null} hoveredId - The ID of the hovered feature's pidn or null if no hover.
     */
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
  
  /**
   * Utility function to add tile boundaries to the map.
   * 
   * @param {string} description - The HTML description from a vector tile property
   * @returns {string|null} The extracted PIDN value or null if not found
   */
  const addTileBoundaries = () => {
    console.log('Adding tile boundaries layer for debugging...');
    mapRef.current.showTileBoundaries = true;
  };

  /**
   * =============== Parse PIDN ===============
   * Utility function to parse the `pidn` out of an HTML-based `description` property.
   * 
   * @param {string} description - The HTML description from a vector tile property
   * @returns {string|null} The extracted PIDN value or null if not found
   */
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
  
   /** =============== Add Layers After Basemap Change ===============
   * useEffect: If the map style reloads (due to changing base layers),
   * we re-run `updateLayers` to ensure our data layers are re-added/visible.
   */
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

  /**=============== Basemap Change ===============
   * Switches the Mapbox style to one of (Streets, Light, Satellite).
   * Once the style is changed, we re-run `updateLayers` to preserve
   * our custom data layers and re-apply any highlights.
   * 
   * @param {string} styleId - The mapbox style ID (e.g., 'streets-v11')
   */
  const handleBasemapChange = (styleId) => {
    console.log(`Switching basemap to: ${styleId}`);
    baseMapRef.current = styleId; // Track the selected basemap
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

    /** =============== Zooms and Higlights when map it from search ===============
   * useEffect: Watches for changes in `isMapTriggeredFromSearch` plus `focusFeatures`.
   * If triggered, we zoom and highlight the search results via `handleFeatureZoomAndHighlight`.
   */
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
    

  /**=============== Zooms and Higligts Features ===============
   * Zooms and highlights a group of features—commonly used for search results.
   * 1) Removes old highlight
   * 2) Fits bounds to the combined bounding box
   * 3) Once zoomed, queries the map to find matching features and calls `highlightFeature`.
   * 
   * @param {Array} features - The array of GeoJSON features with optional `bbox` property.
   */
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

    /**=============== Re Higlight Selected when map Change ===============
   * Provides incremental re-highlighting whenever the selected feature changes
   * (due to map movement or user toggles).
   */
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

    /**=============== Highlight Feature ===============
   * Consolidates an array of features into a single "highlight" layer on the map.
   * - Removes any existing highlight
   * - Groups them by `pidn`, merges geometry if multi-part
   * - Adds them back as a single fill + outline layer
   * 
   * @param {Array} inputFeatures - Array of Mapbox features to highlight
   */
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
      const featurePidn = feature.properties.Name || feature.properties.pidn || feature.properties.OBJECTID || feature.properties.precinct || feature.properties.FLD_AR_ID;
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
        const visiblePidn = visibleFeature.properties.Name || visibleFeature.properties.pidn || visibleFeature.properties.OBJECTID || visibleFeature.properties.precinct || visibleFeature.properties.FLD_AR_ID;
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
    
  /**=============== Remove Highlight ===============
   * Removes the highlight fill + outline layers, along with their data source.
   * @param {Array} [featuresToRemove=[]] Optional array of features if needed
   */
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
        onDrawLine={drawLine}
        
        onDrawPolygon={drawPolygon}
        onSelectParcels={selectParcelsWithPolygon} // New function
        onDeleteSelectedFeature={deleteSelectedFeature}
        onClear={clearAllDrawings}
        
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
