import React, { createContext, useState, useEffect } from 'react';
import L from 'leaflet';

// Create the context
export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [geojsonData, setGeojsonData] = useState({});
  const [rawOwnershipData, setRawOwnershipData] = useState([]);  // For search functionality
  const [loadingOwnership, setLoadingOwnership] = useState(true);  // Track ownership loading separately
  const [loadingOtherLayers, setLoadingOtherLayers] = useState(true);  // Track other layers loading

  // Define colors for different SURFACE types in Public Land layer
  const publicLandColors = {
    'Bureau of Land Management': 'yellow',
    'Fish & Wildlife Service': 'orange',
    'Forest Service': 'green',
    'Local Government': 'red',
    'National Park Service': 'purple',
    'Private': 'gray',
    'State': 'blue',
    'State (Wyoming Game & Fish)': 'darkblue',
    'Water': 'cyan',
  };

  // Function to style public land features based on the SURFACE attribute
  const stylePublicLand = (feature) => {
    return {
      color: publicLandColors[feature.properties.SURFACE] || 'gray',
      weight: 2,
      fillOpacity: 0.5
    };
  };

  const fetchOwnershipLayer = async () => {
    try {
      const ownershipUrl = 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/ownership.geojson_ownership.geojson';
      const response = await fetch(ownershipUrl);
      const ownershipData = await response.json();

      setGeojsonData(prevData => ({ ...prevData, ownership: ownershipData }));
      setRawOwnershipData(ownershipData.features || []);  // Store the raw ownership data for search
    } catch (error) {
      console.error('Error fetching ownership GeoJSON file:', error);
    } finally {
      setLoadingOwnership(false);  // Ownership data is loaded
    }
  };

  const fetchOtherGeojsonFiles = async () => {
    const files = {
      conservationEasements: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/conservation_easements.geojson_conservation_easements.geojson',
      controlPoints: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/control_points.geojson',
      ownershipAddress: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/ownership.geojson_address.geojson',
      plssIntersected: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/plss.geojson_plss_intersected.geojson',
      plssLabels: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/plss.geojson_plss_labels.geojson',
      plssSections: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/plss.geojson_plss_sections.geojson',
      plssTownships: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/plss.geojson_plss_townships.geojson',
      pollingCenters: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/precincts.geojson_polling_centers.geojson',
      precincts: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/precincts.geojson_precincts.geojson',
      roadsEasements: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/roads.geojson_easements.geojson',
      roads: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/roads.geojson_roads.geojson',
      tojCorpLimit: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_toj_corp_limit.geojson',
      tojZoning: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_toj_zoning.geojson',
      tojZoningOverlay: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_toj_zoning_overlay.geojson',
      zoning: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_zoning.geojson',
      zoningOverlay: 'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_zoverlay.geojson',
      publicLand:       'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/public land.geojson'      // Fixed space issue
    };
  
    try {
      const dataPromises = Object.entries(files).map(async ([layerName, url]) => {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to load ${layerName}:`, response.statusText);
          return null;
        }
        const geojson = await response.json();
        console.log(`Successfully loaded ${layerName}:`, geojson); // Log successful loading
        return { [layerName]: geojson };
      });
  
      const geojsonResponses = await Promise.all(dataPromises);
  
      // Filter out any null values in case any layer failed to load
      const validGeojsonResponses = geojsonResponses.filter(response => response !== null);
  
      const data = validGeojsonResponses.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  
      setGeojsonData(prevData => ({ ...prevData, ...data }));
    } catch (error) {
      console.error('Error fetching other GeoJSON files:', error);
    } finally {
      setLoadingOtherLayers(false);  // All other layers are loaded
    }
  };
  
  

 /*
  // Function to fetch all GeoJSON files
  const fetchGeojsonFiles = async () => {
    const files = [
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/conservation_easements.geojson_conservation_easements.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/control_points.geojson_controls.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/ownership.geojson_address.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/plss.geojson_plss_intersected.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/plss.geojson_plss_labels.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/plss.geojson_plss_sections.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/plss.geojson_plss_townships.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/precincts.geojson_polling_centers.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/precincts.geojson_precincts.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/roads.geojson_easements.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/roads.geojson_roads.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_toj_corp_limit.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_toj_zoning.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_toj_zoning_overlay.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_zoning.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/zoning.geojson_zoverlay.geojson',
      'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/public land.geojson'
    ];

    try {
      const dataPromises = files.map(file => fetch(file).then(res => res.json()));
      const geojsonResponses = await Promise.all(dataPromises);

      const data = {
        conservationEasements: geojsonResponses[0],
        controlPoints: geojsonResponses[1],
        ownershipAddress: geojsonResponses[2],
        ownership: geojsonResponses[3],  // Add ownership for search
        plssIntersected: geojsonResponses[4],
        plssLabels: geojsonResponses[5],
        plssSections: geojsonResponses[6],
        plssTownships: geojsonResponses[7],
        pollingCenters: geojsonResponses[8],
        precincts: geojsonResponses[9],
        roadsEasements: geojsonResponses[10],
        roads: geojsonResponses[11],
        tojCorpLimit: geojsonResponses[12],
        tojZoning: geojsonResponses[13],
        tojZoningOverlay: geojsonResponses[14],
        zoning: geojsonResponses[15],
        zoningOverlay: geojsonResponses[16],
        publicLand: geojsonResponses[17],  // Add Public Land data
      };

      setGeojsonData(data);
      setRawOwnershipData(geojsonResponses[3].features || []);  // Set the raw ownership data for search
    } catch (error) {
      console.error('Error fetching GeoJSON files:', error);
    } finally {
      setLoading(false);
    }
  };

  */

  // Fetch the data when the component mounts
  useEffect(() => {
    fetchOwnershipLayer();  // Load ownership layer first

    // Once ownership is loaded, load the other layers
    if (!loadingOwnership) {
      fetchOtherGeojsonFiles();
    }
  }, [loadingOwnership]);

  return (
    <DataContext.Provider value={{ geojsonData, rawOwnershipData, loadingOwnership, loadingOtherLayers }}>
      {children}
    </DataContext.Provider>
  );
};
