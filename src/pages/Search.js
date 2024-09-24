import React, { useState, useEffect, useContext } from 'react';
import './Search.css';
import AdvancedSearch from './AdvancedSearch';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../assets/DataContext';

const Search = ({ setSelectedFeature, onTabChange }) => {
  const [activeSearchTab, setActiveSearchTab] = useState('standard');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { rawOwnershipData, loading } = useContext(DataContext);  // Use raw data from context

  // This function is now responsible for transforming and searching
  const transformAndSearch = (query, rawData) => {
    const lowerCaseQuery = query.toLowerCase().trim();

    return rawData.filter(feature => {
      const properties = feature.properties || {};
      
      // Only transform if needed
      const descriptionHTML = properties.description || '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = descriptionHTML;
      const rows = tempDiv.querySelectorAll('tr');
      rows.forEach(row => {
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

  // Handle search input
  const handleSearch = () => {
    const results = transformAndSearch(searchQuery, rawOwnershipData);  // Lazy transformation and search
    setSearchResults(results);
  };

  // Handle "Map It" button click
  const handleMapClick = (result) => {
    setSelectedFeature(result); // Set the selected feature
    onTabChange('map'); // Manually set the tab to 'map'
    navigate('/map'); // Navigate to the map view
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
      <div className="search-tabs">
        <button
          className={activeSearchTab === 'standard' ? 'active' : ''}
          onClick={() => setActiveSearchTab('standard')}
        >
          Standard Search
        </button>
        <button
          className={activeSearchTab === 'advanced' ? 'active' : ''}
          onClick={() => setActiveSearchTab('advanced')}
        >
          Advanced Search
        </button>
      </div>
      <div className="search-content">
        {activeSearchTab === 'standard' && (
          <div>
            <div className="search-bar-button-container">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search by owner, address, PIDN..."
              />
              <button onClick={handleSearch}>Search</button>
              </div>
            <ul className="search-results-list">
              {searchResults.map((result, index) => (
                <li key={index} className={`search-result-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                  <div className="result-content">
                    <div className="result-details">
                      <strong>Owner:</strong> {result.properties.owner}<br/>
                      <strong>Address:</strong> {result.properties.address}<br/>
                      <strong>PIDN:</strong> {result.properties.pidn}<br/>
                      <strong>Tax ID:</strong> {result.properties.tax_id}<br/>
                    </div>
                    <div className="result-buttons">
                      <button className="map-button" onClick={() => handleMapClick(result)}>Map</button>
                      <a 
                        className="detail-button" 
                        href={`https://gis.tetoncountywy.gov/portal/apps/dashboards/ca93f7b7ae3e4d51ad371121a64ee739#accountno=${result.properties.accountno}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                  <hr />
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeSearchTab === 'advanced' && (
          <AdvancedSearch />  // Render AdvancedSearch component
        )}
      </div>
    </div>
  );
};

export default Search;
