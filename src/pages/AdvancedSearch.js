// src/pages/AdvancedSearch.js
import React, { useState } from 'react';
import './AdvancedSearch.css';

const AdvancedSearch = () => {
  const [streetNumber, setStreetNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [legalDescription, setLegalDescription] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pidn, setPidn] = useState('');

  const handleNotImplemented = () => {
    alert("Not Yet Implemented");
  };

  return (
    
    <div className="advanced-search-container">
      <h2>Not Yet Implemented</h2>
    </div>
  
  
    /* 
    <div className="advanced-search-container">
      <div className="search-section">
        <h3>Search by Street Address</h3>
        <input
          type="text"
          value={streetNumber}
          onChange={(e) => setStreetNumber(e.target.value)}
          placeholder="Number"
        />
        <input
          type="text"
          value={streetName}
          onChange={(e) => setStreetName(e.target.value)}
          placeholder="Street Name"
        />
        <button onClick={handleNotImplemented}>Address Search</button>
      </div>

      <div className="search-section">
        <h3>Search by Subdivision or Legal Description</h3>
        <input
          type="text"
          value={lotNumber}
          onChange={(e) => setLotNumber(e.target.value)}
          placeholder="Lot #"
        />
        <input
          type="text"
          value={legalDescription}
          onChange={(e) => setLegalDescription(e.target.value)}
          placeholder="Legal Description"
        />
        <button onClick={handleNotImplemented}>Legal Search</button>
      </div>

      <div className="search-section">
        <h3>Search by Owner</h3>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name (optional)"
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
        />
        <button onClick={handleNotImplemented}>Owner Search</button>
      </div>

      <div className="search-section">
        <h3>Search by PIDN, Account Number, or Tax ID</h3>
        <input
          type="text"
          value={pidn}
          onChange={(e) => setPidn(e.target.value)}
          placeholder="Number (PIDN can be partial)"
        />
        <button onClick={handleNotImplemented}>Number Search</button>
      </div>
    </div>
    */
  );
};

export default AdvancedSearch;
