import React, { createContext, useState, useEffect } from 'react';
import L from 'leaflet';

// Create the context
export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [geojsonData, setGeojsonData] = useState({});
  const [rawOwnershipData, setRawOwnershipData] = useState([]);  // For search functionality
  const [loadingOwnership, setLoadingOwnership] = useState(true);  // Track ownership loading separately
  const [loadingOtherLayers, setLoadingOtherLayers] = useState(true);  // Track other layers loading
  const [loadingReport, setLoadingReport] = useState(true); // Track report data loading
  const [isTransformed, setIsTransformed] = useState(false); // Track if transformation has been completed  // Define colors for different SURFACE types in Public Land layer
  const [transformedOwnershipData, setTransformedOwnershipData] = useState([]);
  const [mapFocusFeature, setMapFocusFeature] = useState(null);
  const [reportData, setReportData] = useState(''); // State to store the report data
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


  const fetchOwnershipLayer1 = async () => {
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

  const fetchOwnershipLayer = async () => {
    try {
      const ownershipUrl = 'https://storage.googleapis.com/first_bucket_store/test/stripeed_file';
      const response = await fetch(ownershipUrl);
  
      if (!response.ok) {
        throw new Error(`Failed to fetch stripped ownership GeoJSON: ${response.status}`);
      }
  
      const ownershipData = await response.json();
  
      setGeojsonData(prevData => ({ ...prevData, ownership: ownershipData }));
      setRawOwnershipData(ownershipData.features || []); // Store the raw ownership data for search
    } catch (error) {
      console.error('Error fetching stripped ownership GeoJSON file:', error);
    } finally {
      setLoadingOwnership(false); // Ownership data is loaded
    }
  };

    // Fetch report data
    const fetchReportData = async () => {
      try {
        const reportUrl = 'https://storage.googleapis.com/first_bucket_store/report/updated_report_2.txt';
        const response = await fetch(reportUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch report data: ${response.status}`);
        }
        const text = await response.text();
        setReportData(text);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setReportData('Error loading report data.');
      } finally {
        setLoadingReport(false); // Report data is loaded
      }
    };
  
  const transformOwnershipData = () => {
    if (rawOwnershipData.length > 0) {
      const transformedData = rawOwnershipData.map((feature) => {
        const properties = feature.properties || {};
        const descriptionHTML = properties.description || '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = descriptionHTML;
        const rows = tempDiv.querySelectorAll('tr');
        rows.forEach((row) => {
          const th = row.querySelector('th')?.textContent?.trim().toLowerCase();
          const td = row.querySelector('td')?.textContent?.trim();
  
          if (th && td) {
            if (th === 'owner') properties.owner = td;
            if (th === 'address') properties.address = td;
            if (th === 'address2') properties.mailing_address = td; // Mailing address
            if (th === 'pidn') properties.pidn = td;
            if (th === 'accountno') properties.accountno = td;
            if (th === 'tax_id') properties.tax_id = td;
          }
        });
  
        return { ...feature, properties };
      });
  
      // Store transformed data for search functionality
      setTransformedOwnershipData(transformedData);
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
    // Step 1: Load ownership layer
    if (loadingOwnership) {
      fetchOwnershipLayer();
    }
    
    // Step 3: Transform ownership data after all layers are loaded
    if (!loadingOwnership && !isTransformed) {
      transformOwnershipData(); // Transform the data
      setIsTransformed(true); // Mark as transformed to prevent repeated transformations
    }

    if (loadingReport) {
      fetchReportData();
    }
  
  }, [loadingOwnership, isTransformed, loadingReport]);

  return (
    <DataContext.Provider value={{ geojsonData, rawOwnershipData, transformedOwnershipData, loadingOwnership, reportData, loadingOtherLayers, mapFocusFeature, setMapFocusFeature }}>
      {children}
    </DataContext.Provider>
  );
};
