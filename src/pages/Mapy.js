import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import area from '@turf/area';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ Import useLocation
import SidePanel from '../components/SidePanel';
import Spinner from '../components/spinner'; // Import spinner
import ToolPanel from '../components/ToolPanel'; // Import ToolPanel
import { featureCollection } from '@turf/turf';
import { countyZoningColors, getLayerStyle } from '../components/mapStyles';
import { useMapContext } from './MapContext'; // Adjust path as needed
import { useUser } from "../contexts/UserContext";
import useMapboxDraw from "../hooks/useMapboxDraw";
import queryString from 'query-string';
import DraggableLegend from '../components/printShapes/DraggableLegend';
import DraggableNote from '../components/printShapes/DraggableNote';
import ArrowShape from '../components/printShapes/ArrowShape';
import CompassElement from '../components/printShapes/CompassElement';
import PinElement from '../components/printShapes/PinElement';
import RectangleElement from '../components/printShapes/RectangleElement';
import DiamondElement from '../components/printShapes/Diamond';
import TriangleElement from '../components/printShapes/Triangle';
import ShapeElement from '../components/printShapes/ShapeElement'
import { legends } from '../assets/legends';
import { layerNameMappings } from '../components/layerMappings';
import { useCallback } from "react";
// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1Ijoibm9haC1nYW5zIiwiYSI6ImNsb255ajJteDB5Z2gya3BpdXU5M29oY3YifQ.VbPKEHZ91PNoSAH-raskhw';

// URLs for vector tile layers in GCS
const tileLayerUrls = {
  ownership: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/ownership/{z}/{x}/{y}.pbf',
  zoning: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/zoning/{z}/{x}/{y}.pbf',
  conservation_easements: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/conservation_easements/{z}/{x}/{y}.pbf',
  control_points_controls: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/control_points_controls/{z}/{x}/{y}.pbf',
  ownership_address: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/ownership_address/{z}/{x}/{y}.pbf',
  plss_plss_intersected: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/plss_plss_intersected/{z}/{x}/{y}.pbf',
  plss_plss_labels: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/plss_plss_labels/{z}/{x}/{y}.pbf',
  plss_plss_sections: 'https://storage.googleapis.com/first_bucket_store/test_tiles/plss_plss_sections/{z}/{x}/{y}.pbf',
  plss_plss_townships: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/plss_plss_townships/{z}/{x}/{y}.pbf',
  precincts_polling_centers: 'https://storage.googleapis.com/first_bucket_store/tiles_v2/precincts_polling_centers/{z}/{x}/{y}.pbf',
  roads_easements: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/roads_easements/{z}/{x}/{y}.pbf',
  roads: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/roads/{z}/{x}/{y}.pbf',
  zoning_toj_corp_limit: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/zoning_toj_corp_limit/{z}/{x}/{y}.pbf',
  zoning_toj_zoning_overlay: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/zoning_toj_zoning_overlay/{z}/{x}/{y}.pbf',
  zoning_toj_zoning: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/zoning_toj_zoning/{z}/{x}/{y}.pbf',
  zoning_zoverlay: 'https://storage.googleapis.com/first_bucket_store/test_tiles_v3/zoning_zoverlay/{z}/{x}/{y}.pbf',
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
    drawRef,
    paperSize,
    isPrinting,
    showLegend,
    setShowLegend,
    updateNote,
    notes,
    deleteNote,
    activeTab,
    shapes,
    updateShape,
    deleteShape,
    printElements,
    updatePrintElement,
    deletePrintElement,
    selectedPrintElement,
    setSelectedPrintElement
    
  } = useMapContext();
  const [isPanelOpen, setIsPanelOpen] = useState(true); // State for toggling the side panel
  const [activeSidePanelTab, setActiveSidePanelTab] = useState('layers'); // Manage active tab state
  const navigate = useNavigate(); // Define navigate here
  const { subscriptionStatus, role, highlightSettings } = useUser(); // or subscriptionStatus & user
  const [topLayer, setTopLayer] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true); // Map loading state
  const highlightLayerId = 'highlight-layer'; // ID for the highlight layer
  const [selectedFilterPolygon, setSelectedFilterPolygon] = useState(null);
  const baseMapRef = useRef("streets-v11"); // Default basemap
  const [basemap, setBasemap] = useState('streets-v11');
  const [initialHighlightIds, setInitialHighlightIds] = useState(null);
  const [mapIsReady, setMapIsReady] = useState(false);
  const routerLocation = useLocation();  // <--- rename
  const activeLayers = Object.keys(layerStatus).filter((layer) => layerStatus[layer]);
  const legendItems = activeLayers
  .map((layerName) => {
    const items = legends[layerName];
    if (!items) return null;
    const displayName = layerNameMappings[layerName] || layerName;
    return (
      <div key={layerName}>
        <strong>{displayName}</strong>
        <ul style={{ paddingLeft: '1em' }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  marginRight: '6px',
                  border: '1px solid #000',
                  backgroundColor: item.color,
                  opacity: item.opacity ?? 1,
                }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    );
  })
  .filter(Boolean);

  useEffect(() => {
    console.log("📍 Map sees new highlight settings:", highlightSettings);
  }, [highlightSettings]);
  /**
   *  =============== Map Initialization ===============
   *
   * Creates Mapbox map and and then after it's done loading sets loading bool
   * to false, setsMapRef in parent. Calls updateLayers which adds ownership becase
   * of it's hard coded True in parent layerStatus
   * @param {number} a - The first number.
   * @param {number} b - The second number.
   * @returns {number} The result of adding a and b.
   */
  useEffect(() => {
    console.log('Initializing Mapbox map...');
    const params = queryString.parse(routerLocation.search);
    console.log("Parsed URL Params:", params);
    if (params.basemap) {
      console.log("Setting basemap from URL:", params.basemap);
      setBasemap(params.basemap);
      baseMapRef.current = params.basemap; // Track the selected basemap


    }
    const enable3D = params.basemap?.includes('3d');
    const initialStyle = (params.basemap || 'streets-v11').replace('-3d', '');
    // Initialize the Mapbox map
    mapRef.current = new mapboxgl.Map({
      container: 'map',
      style: `mapbox://styles/mapbox/${initialStyle}`,
      center: params.lat && params.lng ? [parseFloat(params.lng), parseFloat(params.lat)] : [-110.76, 43.48],
      zoom: params.zoom ? parseFloat(params.zoom) : 10,
      minZoom: 6,
      maxZoom: 19,
      preserveDrawingBuffer: true
    });
  
    mapRef.current.on('load', () => {
      console.log('✅ Map loaded successfully.');
  
      if (!mapRef.current.hasImage('custom-pin')) {
        mapRef.current.loadImage('/pin_better.png', (error, image) => {
          if (error) {
            console.error("Error loading pin image:", error);
            return;
          }
          mapRef.current.addImage('custom-pin', image);
          console.log('✅ Custom pin added to map.');
        });
      }

        // ✅ ADD THIS BLOCK HERE for 3D terrain
      if (enable3D) {
        mapRef.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.terrain-rgb',
          tileSize: 512,
          maxzoom: 14
        });

        mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        mapRef.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });
      }
  
      setIsMapLoading(false);
      setMapRef(mapRef.current);
  
      let newLayerStatus = {}; 
      let layerList = [];
      
      mapRef.current.on('load', () => {
        mapRef.current.addSource('parcels', {
          type: 'vector',
          tiles: ['http://localhost:8080/maps/parcels_map/{z}/{x}/{y}.pbf'],
          minzoom: 6,
          maxzoom: 18
        });
      
        mapRef.current.addLayer({
          id: 'parcels-layer',
          type: 'fill',
          source: 'parcels',
          'source-layer': 'parcels', // must match the layer name from Tegola config
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.5
          }
        });
      });
      
      // ✅ Step 2: Ensure Layers Are Loaded Before Querying Features
      const params = queryString.parse(routerLocation.search);
      if (params.highlights) {
        console.log("Set inital Higlights")
        setInitialHighlightIds(params.highlights.split(","));
      }
    });
  
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up map and draw control...');
        mapRef.current.remove();
      }
    };
  }, []);

let containerStyle = {};
let computedWidth = '';
let computedHeight = '';

if (paperSize === 'portrait') {
  computedWidth = 'calc(8.1in - 10px)';   // subtract border width (2×5px)
  computedHeight = 'calc(10.6in - 10px)';
  containerStyle = {
    boxSizing: 'border-box', // include border in total dimensions
    width: computedWidth,
    height: computedHeight,
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
    overflow: '',
  };
} else if (paperSize === 'landscape') {
  computedWidth = 'calc(10.6in - 10px)';   // for landscape, swap dimensions
  computedHeight = 'calc(8.1in - 10px)';
  containerStyle = {
    boxSizing: 'border-box',
    width: computedWidth,
    height: computedHeight,
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
    overflow: '',
  };
} else {
  console.log("Coming here to the else")
  console.log(paperSize)

  containerStyle = { width: '100vw', height: '100vh', position: 'absolute' };
}

useEffect(() => {
  console.log("notes updated", notes);
}, [notes]);

useEffect(() => {
  console.log("isPrinting updated", isPrinting);
}, [isPrinting]);

  
  useEffect(() => {  
    const updateUrl = () => {
      console.log("Updating URL");
      if (!mapRef.current) return; // Prevent errors if mapRef is not set
  
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      const highlights = selectedFeature
      .map((feature) => {
        return (
          feature.properties.Name || // Preferred (if exists)
          feature.properties.pidn || // Fallback for ownership
          feature.properties.OBJECTID || // Fallback for public land & other datasets
          feature.properties.precinct || // Another possible identifier
          feature.properties.FLD_AR_ID || // Another possible fallback
          null // If no valid identifier is found, return null
        );
      })
    .filter(Boolean) // Removes null/undefined values (fixes empty %2C%2C)
    .join(',');
      const newParams = queryString.stringify({
        lat: center.lat.toFixed(5),
        lng: center.lng.toFixed(5),
        zoom: zoom,
        highlights,
        layers: layerOrder.join(','), // ✅ Track layer order
        basemap: baseMapRef.current
      });
  
      navigate(`?${newParams}`, { replace: true });
    };
  
    // Attach updateUrl to map movement
    mapRef.current.on('moveend', updateUrl);
  
    // ✅ Also call `updateUrl` immediately when `selectedFeature` or `layerOrder` changes
    updateUrl();
  
    return () => {
      mapRef.current.off('moveend', updateUrl);
    };
  }, [ layerOrder, basemap, selectedFeature, navigate]);
  


useEffect(() => {
  if (!mapRef.current) return;
  
  // If the style is *already* loaded
  if (mapRef.current.isStyleLoaded()) {
    setMapIsReady(true);
    return;
  }

  // Otherwise, wait for style.load or idle
  const handleStyle = () => {
    setMapIsReady(true);
  };

  mapRef.current.once('styledata', handleStyle);
  mapRef.current.once('idle', handleStyle);

  return () => {
    mapRef.current.off('styledata', handleStyle);
    mapRef.current.off('idle', handleStyle);
  };
}, []);

  // (B) Once map + layers are ready, do the highlight
  useEffect(() => {
    console.log("Cat Cat")
    console.log(initialHighlightIds)
    console.log(mapRef.current)
    if (!mapIsReady) return; // Now we rely on mapIsReady state
    //     if (!initialHighlightIds) return;            // No highlights requested
    
    // You might also confirm that your layers are added, e.g. if you track that in your code

    console.log("Restoring highlight IDs:", initialHighlightIds);
    console.log("Current layerStatus is:", layerStatus);

    const existingLayers = Object.keys(layerStatus).filter(
      (layerName) => layerStatus[layerName] && mapRef.current.getLayer(`${layerName}-layer`)
    );
    console.log("Active layers to query:", existingLayers);
    if (!existingLayers.length) return;

    // Query features from those layers
    let allQueriedFeatures = [];
    existingLayers.forEach((layerName) => {
      const queriedFeatures = mapRef.current.queryRenderedFeatures({
        layers: [`${layerName}-layer`],
      });
      // Filter by highlight IDs
      const matchedFeatures = queriedFeatures.filter((feature) => {
        const featureId = feature.properties.Name ||
          feature.properties.pidn ||
          feature.properties.OBJECTID ||
          feature.properties.precinct ||
          feature.properties.FLD_AR_ID;
        return initialHighlightIds.includes(featureId);
      });
      allQueriedFeatures.push(...matchedFeatures);
    });

    if (allQueriedFeatures.length) {
      setSelectedFeatures(allQueriedFeatures);
      highlightFeature(allQueriedFeatures); // Now highlightFeature sees the real layerStatus via context or fresh closure
    } else {
      console.warn("No matched features found in any layer.");
    }
  // re-run if mapRef, layerStatus, or initialHighlightIds changes
  }, [mapRef, mapIsReady, initialHighlightIds, mapIsReady]);


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
  
    // Filter features that are **fully enclosed** by the selection polygon
    const selectedFeatures = queriedFeatures.filter((feature) => {
        if (!feature.geometry) return false;

        // Convert feature to Turf.js feature
        let featureGeometry = turf.feature(feature.geometry);

        // 🛑 Handle MultiPolygons
        if (feature.geometry.type === "MultiPolygon") {
            return feature.geometry.coordinates.every((polyCoords) => {
                let individualPolygon = turf.polygon(polyCoords);
                return turf.booleanContains(selectionPolygon, individualPolygon);
            });
        }

        // ✅ For regular Polygons, apply normal check
        return turf.booleanContains(selectionPolygon, featureGeometry);
    });

    console.log(`✅ ${selectedFeatures.length} features fully enclosed inside the polygon.`);

    // Highlight & Store Selected Features
    setSelectedFeatures(selectedFeatures);
    highlightFeature(selectedFeatures, { ownership: true });
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
      console.log(!mapRef.current.getSource(layerName))
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
              if (layerName === "ownership") {
                console.log(`⏭️ Skipping sourcedata logic for "${layerName}"`);
                return;
              }
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
          if (layerName === "ownership") {
            console.log("🔄 Ensuring correct ownership style after basemap change.");
            if (!mapRef.current.getLayer("ownership-layer")) {
              console.warn("⚠️ Ownership layer is missing when trying to style it.");
              return;
            }
            let updatedStyle = getLayerStyle(layerName, null, baseMapRef);
            console.log("Updated Style: ",updatedStyle )
            if (updatedStyle) {
              try {
                const updatedStyle = getLayerStyle("ownership", null, baseMapRef);
              
                // ✅ Ensure style exists before updating
                if (!updatedStyle) {
                  console.error(`🚨 Ownership layer style is undefined! Skipping update.`);
                  return;
                }
              
                const paint = updatedStyle.paint;
                if (paint) {
                  if (mapRef.current.getLayer("ownership-layer")) {
                    if (paint["fill-color"]) {
                      mapRef.current.setPaintProperty("ownership-layer", "fill-color", paint["fill-color"]);
                    }
                    if (paint["fill-opacity"]) {
                      mapRef.current.setPaintProperty("ownership-layer", "fill-opacity", paint["fill-opacity"]);
                    }
                    if (paint["fill-outline-color"]) {
                      mapRef.current.setPaintProperty("ownership-layer", "fill-outline-color", paint["fill-outline-color"]);
                    }
                  } else {
                    console.warn(`⚠️ Ownership layer not found when applying styles.`);
                  }
                }
              } catch (error) {
                console.error(`🚨 Error updating ownership layer style:`, error);
              }
            } else {
                console.warn("⚠️ No updated style found for ownership.");
            }
        }
        }
        // ✅ ADD BORDER WHEN OWNERSHIP IS TOGGLED ON
        // Update ownership borders when the basemap changes
        if (layerName === "ownership") {
          console.log("🔄 Updating ownership boundary styles...");
          
          let outerBorderStyle = getLayerStyle("ownership_outer_borders", null, baseMapRef);
          let innerBorderStyle = getLayerStyle("ownership_inner_borders", null, baseMapRef);

          if (mapRef.current.getLayer("ownership_outer_borders")) {
            console.log("🎨 Updating outer ownership boundary...");
            Object.entries(outerBorderStyle.paint || {}).forEach(([prop, val]) => {
              mapRef.current.setPaintProperty("ownership_outer_borders", prop, val);
            });
            Object.entries(outerBorderStyle.layout || {}).forEach(([prop, val]) => {
              mapRef.current.setLayoutProperty("ownership_outer_borders", prop, val);
            });
          } else {
            console.log("🆕 Adding outer ownership boundary for the first time.");
            mapRef.current.addLayer(outerBorderStyle);
          }

          if (mapRef.current.getLayer("ownership_inner_borders")) {
            console.log("🎨 Updating inner ownership boundary...");
            Object.entries(innerBorderStyle.paint || {}).forEach(([prop, val]) => {
              mapRef.current.setPaintProperty("ownership_inner_borders", prop, val);
            });
            Object.entries(innerBorderStyle.layout || {}).forEach(([prop, val]) => {
              mapRef.current.setLayoutProperty("ownership_inner_borders", prop, val);
            });
          } else {
            console.log("🆕 Adding inner ownership boundary for the first time.");
            mapRef.current.addLayer(innerBorderStyle);
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
    console.log(layerStatus)

    
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

  /**=============== Handles On Click ===============
   * 
   */
  useEffect(() => {
    console.log("CA")
    console.log(layerStatus)
    if (!mapRef.current) return;
  
    let isDragging = false; // Track if user is dragging
  
    /** 🟢 Detects dragging start */
    const handleTouchStart = () => {
      isDragging = false; // Reset dragging state
    };
  
    /** 🔴 Detects dragging movement */
    const handleTouchMove = () => {
      isDragging = true; // User is dragging, don't trigger click
    };
  
    /** ✅ Handles tap/clicks */
    const handleClick = (e) => {
      console.log("Feature Click Activated");
      console.log(layerStatus)
  
      if (isDragging) {
        console.log("🚫 Ignoring click - user was dragging");
        return;
      }
  
      if (isDrawingRef.current === true) {
        console.log("🎨 User is drawing, ignoring feature click.");
        return;
      }
      console.log(layerStatus)
      const existingLayers = Object.keys(layerStatus).filter(
        (layerName) => layerStatus[layerName] && mapRef.current.getLayer(`${layerName}-layer`)
      );
  
      if (existingLayers.length > 0) {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: existingLayers.map((layerName) => `${layerName}-layer`),
        });
  
        console.log("Queried features at click:", features);
  
        if (features.length > 0) {
          mapRef.current.dragPan.disable(); // Temporarily disable dragPan
  
          const clickedFeature = features[0];
          const clickedPidn = clickedFeature.properties.Name || clickedFeature.properties.pidn || clickedFeature.properties.OBJECTID || clickedFeature.properties.precinct || clickedFeature.properties.FLD_AR_ID;
  
          setSelectedFeatures((prevFeatures) => {
            const isAlreadySelected = prevFeatures.some(
              (f) => (f.properties.Name || f.properties.pidn || f.properties.OBJECTID || f.properties.precinct || f.properties.FLD_AR_ID) === clickedPidn
            );
  
            if (e.originalEvent.shiftKey) {
              console.log("Shift key is held down.");
              if (isAlreadySelected) {
                console.log("Feature is already selected. Removing it from selection.");
                const updatedSelection = prevFeatures.filter(
                  (f) => (f.properties.Name || f.properties.pidn) !== clickedPidn
                );
                highlightFeature(updatedSelection);
                return updatedSelection;
              } else {
                console.log("Adding feature to selection.");
                const updatedSelection = [...prevFeatures, clickedFeature];
                highlightFeature(updatedSelection);
                return updatedSelection;
              }
            } else {
              console.log("Shift key not held. Resetting selection.");
              if (isAlreadySelected && prevFeatures.length === 1) {
                console.log("Clicked feature is the only one selected. Clearing selection.");
                removeHighlight();
                return [];
              } else {
                console.log("Selecting only the clicked feature.");
                highlightFeature([clickedFeature]);
                return [clickedFeature];
              }
            }
          });
  
          setActiveSidePanelTab('info'); 
        } else {
          console.log("No features clicked. Clearing selection.");
          setSelectedFeatures([]);
          removeHighlight();
        }
      }
  
      setTimeout(() => {
        mapRef.current.dragPan.enable(); // Re-enable dragging after a short delay
      }, 100);
    };
  
    // ✅ Attach event listeners
    mapRef.current.on('touchstart', handleTouchStart);
    mapRef.current.on('touchmove', handleTouchMove);
    mapRef.current.on('click', handleClick);
    mapRef.current.on('touchend', handleClick);
    console.log("========== ", selectedFeature)
    return () => {
      // ✅ Cleanup event listeners
      if (mapRef.current) {
        mapRef.current.off('touchstart', handleTouchStart);
        mapRef.current.off('touchmove', handleTouchMove);
        mapRef.current.off('click', handleClick);
        mapRef.current.off('touchend', handleClick);
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
    console.log("Updating Layers becase layerStatus was updated.")
    console.log("=========", layerStatus, "=========")
    if (!mapRef.current.isStyleLoaded()) {
      mapRef.current.on('style.load', () => {
        console.log('Map style loaded. Updating layers...');
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
  const handleBasemapChange = (styleId, enable3D = false) => {
    if (!mapRef.current) return;
  
    baseMapRef.current = styleId;
    setBasemap(styleId);
  
    // ✅ Always reload the style
    mapRef.current.setStyle(`mapbox://styles/mapbox/${styleId}`);
  
    // ✅ Wait for full idle, not just style.load
    mapRef.current.once('idle', () => {
      console.log('✅ Map is idle and fully ready for new layers and terrain');
  
      // ✅ Re-add toggleable layers
      updateLayers();
      console.log("3D")
      console.log(enable3D)
      if (enable3D) {
        try {
          if (!mapRef.current.getSource('mapbox-dem')) {
            mapRef.current.addSource('mapbox-dem', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.terrain-rgb',
              tileSize: 512,
              maxzoom: 14,
            });
          }
  
          mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  
          if (!mapRef.current.getLayer('sky')) {
            mapRef.current.addLayer({
              id: 'sky',
              type: 'sky',
              paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 0.0],
                'sky-atmosphere-sun-intensity': 15,
              },
            });
          }
  
          mapRef.current.setPitch(60);
          mapRef.current.setBearing(-60);
        } catch (err) {
          console.error("🔥 Error enabling 3D terrain:", err);
        }
      } else {
        // 🧼 Flatten view
        mapRef.current.setTerrain(null);
        mapRef.current.setPitch(0);
        mapRef.current.setBearing(0);
      }
  
      // ✅ Restore highlights
      if (selectedFeature?.length > 0) {
        highlightFeature(selectedFeature);
      }
    });
  };
  
  
  
  

    /** =============== Zooms and Higlights when map it from search ===============
   * useEffect: Watches for changes in `isMapTriggeredFromSearch` plus `focusFeatures`.
   * If triggered, we zoom and highlight the search results via `handleFeatureZoomAndHighlight`.
   */
    useEffect(() => {
      console.log("🔄 useEffect triggered!");
      console.log("isMapTriggeredFromSearch:", isMapTriggeredFromSearch);
      console.log("focusFeatures:", focusFeatures);
  
      if (isMapTriggeredFromSearch && focusFeatures.length > 0) {
          console.log('✅ Valid focusFeatures detected. Zooming to and highlighting features...');
          handleFeatureZoomAndHighlight(focusFeatures);
          
          setIsMapTriggeredFromSearch(false); // Reset trigger after execution
      } else {
          console.warn("⛔ Effect skipped: No map trigger or empty focusFeatures list.");
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
    console.log("caty\n\n\n\n\n\n\n")
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
  
    const paddingValue = window.innerWidth < 768 ? 10 : 200; // 10px on mobile, 200px on desktop
    if (bounds && bounds.length === 4) {
      mapRef.current.fitBounds(bounds, {
        padding: paddingValue,
        duration: 1000, // Add smooth animation duration
      });
      console.log('Map zoomed to feature bounds:', bounds);
    } else {
      console.warn('Invalid feature bounds:', bounds);
      return;
    }
  
    // Step 3: After zooming, highlight all features
    mapRef.current.once('idle', () => {
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
    console.log(layerStatus)
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
  const highlightFeature = useCallback((inputFeatures, overrideLayerStatus) => {
    const effectiveLayerStatus = overrideLayerStatus ?? layerStatus;
    console.log("Removing existing highlights...");
    removeHighlight();
  
    if (!inputFeatures || inputFeatures.length === 0) {
      console.warn("No input features provided for highlighting.");
      return;
    }
  
    console.log("Input features for highlighting:", inputFeatures);
  
    const featureDict = {};
    inputFeatures.forEach((feature) => {
      const featurePidn = feature.properties.Name || feature.properties.pidn || feature.properties.OBJECTID || feature.properties.precinct || feature.properties.FLD_AR_ID;
      if (featurePidn) {
        featureDict[featurePidn] = [];
      } else {
        console.warn("Feature has no valid PIDN:", feature);
      }
    });
  
    const visibleLayers = Object.keys(effectiveLayerStatus).filter((layerName) => effectiveLayerStatus[layerName]);
    visibleLayers.forEach((layerName) => {
      const queriedFeatures = mapRef.current.queryRenderedFeatures({ layers: [`${layerName}-layer`] });
      queriedFeatures.forEach((visibleFeature) => {
        const visiblePidn = visibleFeature.properties.Name || visibleFeature.properties.pidn || visibleFeature.properties.OBJECTID || visibleFeature.properties.precinct || visibleFeature.properties.FLD_AR_ID;
        if (featureDict[visiblePidn]) {
          featureDict[visiblePidn].push(turf.feature(visibleFeature.geometry, visibleFeature.properties));
        }
      });
    });
  
    const unifiedFeatures = [];
    Object.keys(featureDict).forEach((pidn) => {
      const matchingParts = featureDict[pidn];
      if (matchingParts.length === 1) {
        unifiedFeatures.push(matchingParts[0]);
      } else if (matchingParts.length > 1) {
        try {
          const featureCollection = turf.featureCollection(matchingParts);
          const unifiedFeature = turf.union(featureCollection);
          unifiedFeatures.push(unifiedFeature);
        } catch (error) {
          console.error(`Error during union for PIDN: ${pidn}`, error);
        }
      }
    });
  
    if (unifiedFeatures.length > 0) {
      try {
        const featureCollection = JSON.parse(JSON.stringify(turf.featureCollection(unifiedFeatures)));
        const dynamicHighlightId = `${highlightLayerId}-${Date.now()}`;
  
        // Clean up all previous highlight layers and sources
        const existingLayers = mapRef.current.getStyle().layers || [];
        existingLayers.forEach((layer) => {
          if (layer.id.startsWith(highlightLayerId)) {
            mapRef.current.removeLayer(layer.id);
          }
        });
        Object.keys(mapRef.current.style.sourceCaches || {}).forEach((sourceId) => {
          if (sourceId.startsWith(highlightLayerId)) {
            mapRef.current.removeSource(sourceId);
          }
        });
  
        mapRef.current.addSource(dynamicHighlightId, {
          type: "geojson",
          data: featureCollection,
        });
  
        setTimeout(() => {
          mapRef.current.addLayer({
            id: dynamicHighlightId,
            type: "fill",
            source: dynamicHighlightId,
            paint: {
              "fill-color": highlightSettings.fillColor,
              "fill-outline-color": highlightSettings.fillOutlineColor,
              "fill-opacity": highlightSettings.fillOpacity ?? 1,
            },
          });
  
          mapRef.current.addLayer({
            id: `${dynamicHighlightId}-outline`,
            type: "line",
            source: dynamicHighlightId,
            paint: {
              "line-color": highlightSettings.lineColor,
              "line-width": highlightSettings.lineWidth ?? 3,
            },
          });
        }, 10);
  
      } catch (error) {
        console.error("Error during map layer creation for highlighted features:", error);
      }
    } else {
      console.warn("No features to highlight.");
    }
  }, [layerStatus, highlightSettings]);
  
    
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
  

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible. Forcing map resize...');
        if (mapRef.current) mapRef.current.resize();
      }
    };
  
    const handleWindowFocus = () => {
      console.log('Window focused. Forcing map resize...');
      if (mapRef.current) mapRef.current.resize();
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'map') {
      console.log('Active tab is "map", resizing...');
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 50); // Slight delay ensures layout is fully applied
    }
  }, [activeTab]);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      console.log('Forcing map resize due to paperSize change:', paperSize);
      setTimeout(() => {
        mapRef.current.resize();
      }, 100); // Allow slight delay for DOM to apply new dimensions
    }
  }, [paperSize]);
  
  return (
    
    <div className="map-container">
      {isMapLoading && <Spinner />}
      <div className="layer-selector-container">
      <button className="layer-selector-button">
        <img
          src="/basemap.png" // Replace with an icon of your choice
          alt="Layers"
          className="layer-icon"
        />
      </button>
      <div className="layer-selector-popup">
        <button onClick={() => handleBasemapChange('streets-v11')}>Streets</button>
        <button onClick={() => handleBasemapChange('light-v10')}>Light</button>
        <button onClick={() => handleBasemapChange('satellite-streets-v12')}>Satellite</button>
        <button onClick={() => handleBasemapChange('streets-v11', true)}>3D Terrain</button>
        <button onClick={() => handleBasemapChange('satellite-streets-v12', true)}>3D Satellite</button>
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
      <div className="print-center-wrapper">
      
        <div className="print-scroll-wrapper"
        style={{
              position: 'relative',
              width: computedWidth,
              height: computedHeight,
            }}>
        

          <div
            className="print-map-wrapper"
            style={{
              position: 'relative',
              width: computedWidth,
              height: computedHeight,
            }}
          >
            
            <div
              id="map"
              className={`map ${isPanelOpen ? 'with-panel' : ''}`}
              style={{
                ...containerStyle,
                position: 'absolute', // still needed
                top: 0,
                left: 0,
              }}
            ></div>

            <div
              id="notes-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: computedWidth,
                height: computedHeight,
                display: 'block',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              
             
            {isPrinting &&
              printElements.map((element) => {
                switch (element.type) {
                  case 'note':
                    return (
                      
                      <DraggableNote
                        key={`${element.id}-${selectedPrintElement?.id ?? 'none'}`}
                        note={element}
                        onNoteChange={updatePrintElement}
                        onDelete={deletePrintElement}
                        bounds="#notes-overlay"
                      />
                    );
                  case 'arrow':
                    console.log("Passed shape ID:", element.id);
                    return (
                      <ArrowShape
                        key={`${element.id}-${selectedPrintElement?.id ?? 'none'}`}
                        shape={element} // Always latest
                        onChange={updatePrintElement}
                        onDelete={deletePrintElement}
                        isPrinting={isPrinting}
                      />
                    );
                  case 'legend':
                    return (
                      <DraggableLegend
                        key={element.id}
                        onDelete={() => deletePrintElement(element.id)}
                      >
                        <h4 style={{ color: 'black' }}>Legend</h4>
                        {legendItems}
                      </DraggableLegend>
                    );
                    case 'compass':
                      return (
                        <CompassElement
                          key={element.id}
                          element={element}
                          onDelete={deletePrintElement}
                        />
                      );
                    case 'shape':
                      return (
                        <ShapeElement
                          key={element.id}
                          shape={element}
                          onDelete={deletePrintElement}
                          onChange={updatePrintElement}
                        />
                      );
                      
                    case 'rectangle':
                      return (
                        <RectangleElement
                          key={element.id}
                          shape={element}
                          onChange={updatePrintElement}
                          onDelete={deletePrintElement}
                        />
                      );
                    case 'diamond':
                      return (
                        <DiamondElement
                          key={`${element.id}-${selectedPrintElement?.id ?? 'none'}`}
                          shape={element}
                          onChange={updatePrintElement}
                          onDelete={deletePrintElement}
                        />
                      );
                    case 'triangle':
                      return (
                        <TriangleElement
                        key={element.id}
                        shape={element}
                        onChange={updatePrintElement}
                        onDelete={deletePrintElement}
                      />

                      );
                    default:
                      return null;
                }
              })}

              
            </div>
          </div>
        </div>
      </div>


      {subscriptionStatus !== "active" && role !== "demo" && (
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
