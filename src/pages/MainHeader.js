import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './MainHeader.css';

const MainHeader = ({ activeTab, onTabChange }) => {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab);
  const [updateTime, setUpdateTime] = useState(''); // State to hold the update time
  useEffect(() => {
    setLocalActiveTab(activeTab); // Sync local tab state with parent prop
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setLocalActiveTab(tab);
    onTabChange(tab);
  };

  useEffect(() => {
    const fetchUpdateTime = async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/Noah-Gans/teton_gis_database/main/files/update_time.txt'
        );
        const text = await response.text();
        setUpdateTime(text.trim()); // Set the fetched time in the state
      } catch (error) {
        console.error('Error fetching update time:', error);
      }
    };

    fetchUpdateTime(); // Fetch the update time on component mount
  }, []);

  return (
    <div className="main-header">
      <Link
        className={`header-tab ${localActiveTab === 'map' ? 'active' : ''}`}
        onClick={() => handleTabChange('map')}
        to="/map"
      >
        Map
      </Link>
      <Link
        className={`header-tab ${localActiveTab === 'search' ? 'active' : ''}`}
        onClick={() => handleTabChange('search')}
        to="/search"
      >
        Search
      </Link>
      <Link
        className={`header-tab ${localActiveTab === 'print' ? 'active' : ''}`}
        onClick={() => handleTabChange('print')}
        to="/print"
      >
        Print
      </Link>
      
      <div className="update-time">
        <span>{updateTime ? updateTime : 'Fetching...'}</span>
      </div>
    </div>
  );
};

export default MainHeader;
