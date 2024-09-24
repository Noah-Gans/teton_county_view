// layerStyles.js

// Static color map for county zoning codes
const countyZoningColors = {
    'R1': '#1E90FF',        // Blue
    'R2': '#FF7F50',        // Coral
    'R3': '#32CD32',        // Lime Green
    'PUD R1': '#DAA520',    // Goldenrod
    'PUD R2': '#8A2BE2',    // Blue Violet
    'PUD R3': '#D2691E',    // Chocolate
    'PUD - NC': '#FFB6C1',  // Light Pink
    'P': '#FFD700',         // Gold
    'P/SP': '#FF4500',      // Orange Red
    'S': '#A52A2A',         // Brown
    'WC': '#00CED1',        // Dark Turquoise
    'WHB': '#9400D3',       // Dark Violet
    'NC': '#FF69B4',        // Hot Pink
    'NR-1': '#FF6347',      // Tomato
    'AR': '#ADFF2F',        // Green Yellow
    'BP': '#7FFF00',        // Chartreuse
    'PR': '#FF1493',        // Bright Pink
    'R':  '#2E8B57'         // Sea Green
  };
  
  const tojZoningColors = {
    "P/SP": "#FF69B4",
    "CR-2": "#FF8C00",
    "OR": "#8A2BE2",
    "CR-1": "#7FFF00",
    "PUD-NL-5": "#6495ED",
    "NL-5": "#FF4500",
    "PUD-NL-3": "#DC143C",
    "NL-2": "#00CED1",
    "PUD-NH-1": "#ADFF2F",
    "NH-1": "#4B0082",
    "NM-2": "#FFD700",
    "PR-SK": "#FF6347",
    "NL-3": "#40E0D0",
    "R": "#FF00FF",
    "NM-1": "#20B2AA",
    "MHP": "#8B0000",
    "NL-1": "#4682B4",
    "BP": "#FFDEAD",
    "CR-3": "#DA70D6",
    "PUD-UR": "#FF1493",
    "P": "#00BFFF",
    "CR-2": "#B22222",
    "DC-2": "#FFD700",
    "DC-1": "#228B22",
    "TS-1": "#D2691E",
    "TS-2": "#FF4500",
    "PUD-NL-3": "#2E8B57",
    "PUD-NM-2": "#9932CC",
    "PUD-NL-2": "#8B4513",
    "PR": "#00FA9A",
    "PUD-NM-2": "#C71585"
  };
  

  const townOverlayColors = {
    'LDG': '#FFA07A',     // Light Salmon
    'DDO-2': '#87CEFA',   // Light Sky Blue
    'DDO-1': '#4682B4',   // Steel Blue
    'NRO': '#3CB371',     // Medium Sea Green
    'OUP': '#FFD700',     // Gold
    'SRO': '#FF6347'      // Tomato
  };

  const countyOverlayColors = {
    'LDG 6': '#FF7F50',    // Coral
    'SRO': '#FF6347',      // Tomato
    'LDG 3': '#FFA07A',    // Light Salmon
    'LDG 2': '#FA8072',    // Salmon
    'NRO': '#3CB371',      // Medium Sea Green
    'SRO 3': '#FF4500',    // Orange Red
    'NRO 3': '#2E8B57',    // Sea Green
    'NRO 4': '#8FBC8F',    // Dark Sea Green
    'NRO 2': '#66CDAA',    // Medium Aquamarine
  };

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
    'default': 'gray',  // Default color for unknown surface type
  };
  // Function to get the style for County zoning layer
  const getCountyZoningStyle = (feature) => {
    const parsedProperties = parseDescription(feature.properties.description);
    const zoningCode = parsedProperties.zoning;
  
  
    // Use static color map and return default if zoning code is not mapped
    const color = countyZoningColors[zoningCode] || '#808080';  // Default to gray for unmapped codes
    //console.log(`Assigned Color for ${zoningCode}:`, color);
  
    return {
      color: color, 
      weight: 2, 
      fillOpacity: 0.4,
    };
  };

  const getTOJZoningOverlayStyle = (feature) => {
    const parsedProperties = parseDescription(feature.properties.description);
    const overlayValue = parsedProperties.overlay;
    
    
    // Default color if overlay is not mapped
    const color = townOverlayColors[overlayValue] || '#808080';  // Gray if no match
  
   
  
    return {
      color,
      weight: 2,
      fillOpacity: 0.4,
    };
  };
  
  // Function to get the style for TOJ zoning layer
  const getZoningStyle = (feature) => {
    const parsedProperties = parseDescription(feature.properties.description);
    const zoningCode = parsedProperties.zoning;
  
    //console.log('TOJ Zoning Code:', zoningCode);
  
    // Use static color map and return default if zoning code is not mapped
    const color = tojZoningColors[zoningCode] || '#808080';  // Default to gray for unmapped codes
    //console.log(`Assigned Color for ${zoningCode}:`, color);
  
    return {
      color: color, 
      weight: 2, 
      fillOpacity: 0.25, 
    };
  };
  
  const getCountyZoningOverlayStyle = (feature) => {
    const parsedProperties = parseDescription(feature.properties.description);
    const overlayValue = parsedProperties.overlay;
    
    
    // Default color if overlay is not mapped
    

    //console.log('County Overlay Value:', overlayValue);
    const color = countyOverlayColors[overlayValue] || '#808080';  // Gray if no match
    return {
        color,
        weight: 2,
        fillOpacity: 0.4,
      };
};


const getPublicLandStyle = (feature) => {
    const surfaceType = feature.properties.SURFACE;
    const color = publicLandColors[surfaceType] || publicLandColors['default'];
  
    // If the surface is Private, make it clear (transparent)
    const fillOpacity = surfaceType === 'Private' ? 0 : 0.25;
  
    //console.log('Public Land Surface Type:', surfaceType, '| Assigned Color:', color);
  
    return {
      color,
      weight: 2,
      fillOpacity,
    };
  };
  

  // Export function to get style based on layer
  export const getLayerStyle = (layerName, feature) => {
    if (layerName === 'ownership') {
      return { color: 'gray', weight: 1, fillOpacity: 0 };
    }
  
    if (layerName === 'tojZoning') {
      return getZoningStyle(feature);
    }
  
    if (layerName === 'zoning') {
      return getCountyZoningStyle(feature);
    }
    if (layerName === 'tojZoningOverlay') {
        return getTOJZoningOverlayStyle(feature);  // Call the function for TOJ Zoning Overlay
      }
    if (layerName === 'zoningOverlay') {
    return getCountyZoningOverlayStyle(feature);  // Call the function for TOJ Zoning Overlay
    }
    if (layerName === 'publicLand') {
        return getPublicLandStyle(feature);  // Use the mapping function for public land
    }
    if (layerName == 'tojCorpLimit'){
        return { color: 'orange', weight: 2, fillOpacity: 0 };
    }
    return { color: 'gray', weight: 1, fillOpacity: 0 };
  };
  
  // Helper function to parse description (copied from map.js)
  const parseDescription = (description) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(description, 'text/html');
    const rows = doc.querySelectorAll('tr');
  
    const properties = {};
    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      if (cells.length === 2) {
        const key = cells[0].textContent.trim().toLowerCase().replace(/ /g, '_');
        const value = cells[1].textContent.trim();
        properties[key] = value;
      }
    });
  
    return properties;
  };
  