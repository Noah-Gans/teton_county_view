import React, { useState, useEffect, useContext } from 'react';
import './Search.css';
import AdvancedSearch from './AdvancedSearch';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../assets/DataContext';
import { useMapContext } from './MapContext'; // Adjust path as needed
// Add the parseDescription function
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

const Search = () => {
  const [activeSearchTab, setActiveSearchTab] = useState('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchTriggered, setIsSearchTriggered] = useState(false); // Track if search has been triggered
  const navigate = useNavigate();
  const [selectedFeatureIds, setSelectedFeatureIds] = useState([]); // Track selected features
  const { rawOwnershipData, transformedOwnershipData, loading, setMapFocusFeature } = useContext(DataContext);  // Use pre-transformed data
  const { focusFeatures, setFocusFeatures, searchResults, setSearchResults, setSelectedFeatures, isMapTriggeredFromSearch, setIsMapTriggeredFromSearch, setActiveTab} = useMapContext(); // Access selectedFeatures from MapProvider
  
  const printFeatures = () => {
    console.log('Top 5 Features in stripped GeoJSON:');
    rawOwnershipData.slice(0, 5).forEach((feature, index) => {
      console.log(`Feature ${index + 1}:`, feature);
    });
  };

  useEffect(() => {
    console.log('useEffect triggered for rawOwnershipData.');
    console.log(`rawOwnershipData length: ${rawOwnershipData.length}`);

    if (rawOwnershipData.length > 0) {
      console.log('rawOwnershipData is populated. Calling printFeatures...');
      printFeatures();
    } else {
      console.log('rawOwnershipData is empty or not yet populated.');
    }
  }, [rawOwnershipData]); // Trigger when `rawOwnershipData` updates

  const normalizeText = (text) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove dashes, punctuation, and special characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim();
};

const searchRawOwnershipData = (query, data) => {
    const lowerCaseQuery = normalizeText(query); // Normalize user query
    const queryTokens = lowerCaseQuery.split(/\s+/); // Split query into individual words
    const phraseRegex = new RegExp(`\\b${lowerCaseQuery}\\b`, "i"); // Exact phrase match
  
    return data
        .map((feature) => {
            const properties = feature.properties || {};
            const fieldsToSearch = [
                properties.owner || '',
                properties.pidn || '',
                properties.tax_id || '',
                properties.st_address || '', // ✅ Only physical address
            ].map(normalizeText); // Normalize all fields

            let score = 0;

            // ✅ Strong match: Exact phrase in any field
            if (fieldsToSearch.some((field) => phraseRegex.test(field))) {
                score += 500;
            }

            // ✅ Moderate match: All words appear as whole words
            if (queryTokens.every((token) => fieldsToSearch.some((field) => new RegExp(`\\b${token}\\b`, "i").test(field)))) {
                score += 250;
            }

            // ✅ Weak match: At least one word is an exact match
            if (queryTokens.some((token) => fieldsToSearch.some((field) => new RegExp(`\\b${token}\\b`, "i").test(field)))) {
                score += 100;
            }

            // ✅ Partial match (Low importance)
            if (queryTokens.some((token) => fieldsToSearch.some((field) => field.includes(token)))) {
                score += 10; // Lower impact to reduce irrelevant matches
            }

            // ✅ Boost owner and address relevance
            if (fieldsToSearch[0] !== '') score += 100; // Owner field (important)
            if (fieldsToSearch[3] !== '') score += 50; // Physical address field (important)

            return { feature, score };
        })
        .filter(({ score }) => score >= 300) // ✅ Filter out weak matches
        .sort((a, b) => b.score - a.score) // ✅ Rank by relevance
        .slice(0, 200) // ✅ Cap results to top 200 most relevant
        .map(({ feature }) => feature);
};

  

  // Function to search the transformed data
  const searchTransformedData = (query, transformedData) => {
    const lowerCaseQuery = query.toLowerCase().trim();

    return transformedData.filter(feature => {
      const properties = feature.properties || {};

      const owner = properties.owner?.toLowerCase().trim() || '';
      const address = properties.address?.toLowerCase().trim() || '';
      const pidn = properties.pidn?.toLowerCase().trim() || '';
      const tax_id = properties.tax_id?.toLowerCase().trim() || '';

      return (
        owner.includes(lowerCaseQuery) ||
        address.includes(lowerCaseQuery) ||
        pidn.includes(lowerCaseQuery) ||
        tax_id.includes(lowerCaseQuery)
      );
    });
  };

    // Handle feature selection toggle
    const toggleFeatureSelection = (feature) => {
      const featureId = feature.properties.pidn; // Use PIDN as unique identifier
      setSelectedFeatureIds((prevSelected) =>
        prevSelected.includes(featureId)
          ? prevSelected.filter((id) => id !== featureId)
          : [...prevSelected, featureId]
      );
    };
  
      // Handle "Select All Features" toggle
      const toggleSelectAllFeatures = () => {
        if (selectedFeatureIds.length === searchResults.length) {
          // Deselect all
          setSelectedFeatureIds([]);
        } else {
          // Select all valid features
          const allFeatureIds = searchResults.map((result) => result.properties?.pidn).filter(Boolean);
          setSelectedFeatureIds(allFeatureIds);
        }
      };
      

  const handleMapSelectedClick = () => {
    const selectedFeatures = rawOwnershipData.filter((feature) =>
      selectedFeatureIds.includes(feature.properties.pidn)
    );
    setFocusFeatures(selectedFeatures); // Set the features for focus
    setIsMapTriggeredFromSearch(true);
    setActiveTab('map'); // Switch to map tab
    navigate('/map');
  };

  
  // Handle search input
  const handleSearch = () => {
    setIsSearchTriggered(true); // Mark that search has been triggered
    const results = searchRawOwnershipData(searchQuery, rawOwnershipData);  // Use raw ownership data for search
    setSearchResults(results);
  
    console.log(`Search results for query "${searchQuery}":`);
    results.forEach((result, index) => {
      console.log(`Result ${index + 1}:`);
      console.log('Properties:', result.properties);
      console.log('BBox:', result.bbox); // Log the bbox for each result
    });
    setSelectedFeatureIds([]); // Reset selected features on new search
  };
  

  // Handle "Map It" button click
  const handleMapClick = (result) => {
    const features = Array.isArray(result) ? result.flat() : [result];

    console.log("Before setting focusFeatures:", focusFeatures);
    setFocusFeatures(features);

    setIsMapTriggeredFromSearch((prev) => {
        console.log("Previous map trigger state:", prev);
        return !prev; // Toggle value to force update
    });

    setTimeout(() => {
        console.log("Navigating to map...");
        setActiveTab('map');
        navigate('/map');
    }, 200);
};


  
  // Add event listener for the "Enter" key to trigger the search
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleSearch(); // Trigger the search when "Enter" is pressed
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    
    <div className="search-container">
      
      <div className="search-content">
        {activeSearchTab === 'standard' && (
          <div>
            {/* Search Bar and Action Buttons Container */}
              <div className="search-bar-and-actions-container">
                {/* Search Bar */}
                <div className="search-bar">
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by owner, address, PIDN..."
                  />
                  <button onClick={handleSearch}>Search</button>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button
                    className="action-button select-all-button"
                    onClick={toggleSelectAllFeatures}
                    disabled={searchResults.length === 0} // Disable if no results
                  >
                    {selectedFeatureIds.length === searchResults.length
                      ? 'Deselect All Features'
                      : 'Select All Features'}
                  </button>
                  <button
                    className="action-button map-selected-button"
                    onClick={handleMapSelectedClick}
                    disabled={selectedFeatureIds.length === 0} // Disable if no selected features
                  >
                    Map Selected Features
                  </button>
                  <button
                    className="action-button clear-selection-button"
                    onClick={() => setSelectedFeatureIds([])}
                    disabled={selectedFeatureIds.length === 0} // Disable if no selection
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
                          
            
          
            
            {isSearchTriggered && searchResults.length === 0 && (
              <div className="no-results">No results found.</div>
            )}

            <div className="search-results-container">
              <ul className="search-results-list">
                {searchResults.map((result, index) => {
                  const properties = result.properties;
                  const isSelected = selectedFeatureIds.includes(properties.pidn); // Ensure `selectedFeatureIds` is defined

                  const taxLink = `https://gis.tetoncountywy.gov/portal/apps/dashboards/5574848e46464109a14dead33e5ddace#ParcelInfo=${properties.tax_id}`;
                  const clerkLink = `https://gis.tetoncountywy.gov/portal/apps/dashboards/03ef10d8b8634909b6263e9016bcc986#statepin=${properties.pidn}`;

                  return (
                    <li key={index} className={`search-result-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                      <div className="result-content">
                        <div className="result-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFeatureSelection(result)}
                          />
                        </div>

                        {/* NEW PARENT WRAPPER */}
                        <div className="result-body">
                          <div className="result-details">
                            <strong>Owner:</strong> {properties.owner || 'N/A'}<br />
                            <strong>PIDN:</strong> {properties.pidn || 'N/A'}<br />
                            <strong>Tax ID:</strong> {properties.tax_id || 'N/A'}<br />
                            <strong>Mail Addr:</strong> {properties.address
                              ? `${properties.address}${properties.owner_city ? ', ' + properties.owner_city : ''}${properties.owner_state ? ', ' + properties.owner_state : ''}`
                              : 'N/A'}
                            <br />
                            <strong>Physical Addr</strong> {properties.st_address || 'N/A'}<br />
                          </div>

                          <div className="result-buttons">
                            <div className="result-buttons-grid">
                              <button className="map-it-button" onClick={() => handleMapClick(result)}>Map</button>
                              <button className="detail-button" onClick={() => window.open(properties.property_det)}>
                                Detail
                              </button>
                              <button className="tax-button" onClick={() => window.open(taxLink, '_blank')}>
                                Tax
                              </button>
                              <button className="clerk-button" onClick={() => window.open(clerkLink, '_blank')}>
                                Clerk
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr />
                    </li>
                  );
                })}
              </ul>
            </div>

          </div>
        )}

       
      </div>
    </div>
  );
};

export default Search;
