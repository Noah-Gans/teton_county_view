import React, { useCallback, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../assets/DataContext';
import './Print.css';
import { useMapContext } from './MapContext';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import ReportTable from './ReportTable'; // path depends on your file structure

const Reports = () => {
  const { setGlobalActiveTab, startPolygonDraw, polygonData, passPolygonToReportBuilder, toggleLayerVisibility, startGeoFilter, clearGeoFilter, selectedColumns, toggleColumn, selectedFeature, isFilterTriggered, setIsFilterTriggered } = useMapContext();
  const {reportData, loadingReport } = useContext(DataContext);
  const [filteredRows, setFilteredRows] = useState([]); // State for filtered rows
  const [page, setPage] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState([]); // Track visible columns
  const rowsPerPage = 50; // Number of rows per page
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null }); // Sorting state
  const [filters, setFilters] = useState({}); // Filtering state

  // Parse the file content
  const lines = reportData.split('\n');
  const headers = lines[0]?.split('|') || []; // Use the first line as headers
  const [dropdownState, setDropdownState] = useState({
    generalPropertyInfo: false,
    propertyDetails: false,
    taxInformation: false,
  });
  // Parse rows with dynamic column mapping
  const rows = lines.slice(1).map((line) => {
    const columns = line.split('|');
    const row = {
      PIDN: columns[0],
      center: columns[1]
        ? columns[1].split(',').map(coord => parseFloat(coord)) // Parse center as [longitude, latitude]
        : undefined,
    };

    // Dynamically add remaining columns
    headers.slice(2).forEach((header, index) => {
      row[header] = columns[index + 2]; // Offset by 2 to account for PIDN and center
    });

    return row;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(
    (filteredRows.length > 0 ? filteredRows.length : rows.length) / rowsPerPage
  );  
  const currentRows = (filteredRows.length > 0 ? filteredRows : rows).slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage
  );  
  // Define grouped columns
  const toggleDropdown = useCallback((group) => {
    setDropdownState((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  }, []);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  
    const sortedRows = [...filteredRows].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  
    setFilteredRows(sortedRows);
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

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  
    const filtered = rows.filter((row) => {
      return Object.entries(filters).every(([filterKey, filterValue]) => {
        return row[filterKey]?.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  
    setFilteredRows(filtered);
  };
  
  const generalPropertyInfoColumns = [
    "PIDN",
    "Account",
    "Property Owner(s)",
    "Mailing Address",
    "Tax ID",
  ];

  const propertyDetailsColumns = [
    "Actual Market Value Total",
    "Actual Market Value Land",
    "Actual Market Value Improvements",
    "Market Value Breakdown",
    "Property Class",
    "Number Of Developments",
    "Legal Description",
  ];

const taxInformationColumns = [
  
  "Tax District",
  "First Half Levied",
  "First Half Interest",
  "First Half Fees",
  "First Half Bill",
  "First Half Amount Paid",
  "First Half Amount Owed",
  "First Half Paid",
  "Second Half Levied",
  "Second Half Interest",
  "Second Half Fees",
  "Second Half Bill",
  "Second Half Amount Paid",
  "Second Half Amount Owed",
  "Second Half Paid",
  "Total Levied",
  "Total Interest",
  "Total Fees",
  "Total Bill",
  "Total Amount Paid",
  "Total Amount Owed",
  "Mill Levy",
  "Tax Payment History",
  "Has Mortgage"
];

  // Combine columns without redundancy
 
  

  // Toggle column visibility

  useEffect(() => {
    console.log("Selected Columns from MapContext:", selectedColumns);
  }, [selectedColumns]);
  useEffect(() => {
    if (polygonData) {
      console.log('Using Polygon in Reports:', polygonData);
    }
  }, [polygonData]);



const handleDownload = () => {
  console.log("Filtered Rows:", filteredRows);
  console.log("Selected Columns:", selectedColumns);
  const csvContent = generateCSV();
  if (!csvContent) return; // Stop if there's no data

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `filtered_report.csv`; // File name
  link.click();

  URL.revokeObjectURL(url); // Clean up URL object
};

useEffect(() => {
  if (isFilterTriggered && selectedFeature.length > 0) {
    console.log("Filtering rows based on selected features:", selectedFeature);

    // Extract PIDNs from selectedFeatures
    const selectedPidns = selectedFeature.map(
      (feature) => parsePidnFromDescription(feature.properties?.description)
    );

    // Filter rows based on selected PIDNs
    const filtered = rows.filter((row) => selectedPidns.includes(row.PIDN));
    setFilteredRows(filtered);
    console.log("Filtered rows:", filtered);

    // Reset the filter trigger after applying the filter
    setIsFilterTriggered(false);
  }
}, [isFilterTriggered, selectedFeature, rows]);

const generateCSV = () => {

  if (!selectedColumns.length) {
    alert('No data available to download.');
    return '';
  }


  const dataToDownload = filteredRows.length ? filteredRows : rows;

  // Helper function to safely wrap a value in double quotes and escape internal quotes
  const escapeValue = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = value.toString();
    return `"${stringValue.replace(/"/g, '""')}"`; // Escape double quotes
  };

  // Generate header row with selected columns
  const csvHeader = selectedColumns.map(escapeValue).join(',');

  // Generate rows for each filtered row
  // Generate CSV rows
  const csvRows = dataToDownload.map((row) =>
    selectedColumns.map((col) => escapeValue(row[col] || '')).join(',')
  );

  // Combine header and rows into a CSV string
  return [csvHeader, ...csvRows].join('\n');
};



  // Clear GeoFilter
  const handleClearGeoFilter = () => {
    clearGeoFilter(); // Clear GeoFilter in MapContext
    localStorage.removeItem('polygonData'); // Remove stored GeoFilter
    console.log('GeoFilter cleared');
  };

  const handleGeoFilter = () => {
    console.log('Geo Filter button clicked.');

    // Switch to the map tab
    console.log('Switching to map tab...');
    setGlobalActiveTab('map');
    navigate('/map'); // Navigate to the map route

    // Ensure the ownership layer is visible
    console.log('Ensuring ownership layer is visible...');
    toggleLayerVisibility('ownership');

    // Start polygon drawing tool
    console.log('Starting polygon drawing tool...');
    startPolygonDraw(true);
  };

  return (
    <div className="reports-background-blur">
      <div className="reports-container">
        {/* Title */}
        <div className="reports-title">
          <h1>Reports</h1>
        </div>
  
        {/* Content Area */}
        <div className="reports-content">
          {/* Side Panel */}
          <div className="report-side-panel">
            <button className="action-button" onClick={handleDownload}>
              Download
            </button>
            
            
            <div className="attribute-dropdown-reports">
              <h3>Select Attributes</h3>

              <div className="dropdown-group-reports">
                <button
                  className="dropdown-header-reports"
                  onClick={() => toggleDropdown('generalPropertyInfo')}
                >
                  General Property Info {dropdownState.generalPropertyInfo ? '▲' : '▼'}
                </button>
                {dropdownState.generalPropertyInfo && (
                  <div className="dropdown-menu-reports">
                    {generalPropertyInfoColumns.map((column, index) => (
                      <div key={index} className="dropdown-item-reports" onClick={() => toggleColumn(column)}>
                        <input type="checkbox" checked={selectedColumns.includes(column)} readOnly />
                        {column}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Details Dropdown */}
              <div className="dropdown-group-reports">
                <button
                  className="dropdown-header-reports"
                  onClick={() => toggleDropdown('propertyDetails')}
                >
                  Property Details {dropdownState.propertyDetails ? '▲' : '▼'}
                </button>
                {dropdownState.propertyDetails && (
                  <div className="dropdown-menu-reports">
                    {propertyDetailsColumns.map((column, index) => (
                      <div
                        key={index}
                        className="dropdown-item-reports"
                        onClick={() => toggleColumn(column)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(column)}
                          readOnly
                        />
                        {column}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tax Information Dropdown */}
              <div className="dropdown-group-reports">
                <button
                  className="dropdown-header-reports"
                  onClick={() => toggleDropdown('taxInformation')}
                >
                  Tax Information {dropdownState.taxInformation ? '▲' : '▼'}
                </button>
                {dropdownState.taxInformation && (
                  <div className="dropdown-menu-reports">
                    {taxInformationColumns.map((column, index) => (
                      <div
                        key={index}
                        className="dropdown-item-reports"
                        onClick={() => toggleColumn(column)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(column)}
                          readOnly
                        />
                        {column}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


            <div className="selected-attributes">
              <h3>Selected Attributes</h3>
              <ul>
                {selectedColumns.map((column, index) => (
                  <li key={index}>{column}</li>
                ))}
              </ul>
            </div>
          </div>
  
          {/* Main Panel */}
          <div className="main-panel">
            <div className="table-container">
            <ReportTable
              currentRows={currentRows}
              selectedColumns={selectedColumns}
              filters={filters}
              handleFilter={handleFilter}
              handleSort={handleSort}
            />
            </div>
            {/* Pagination component */}
            <div className="pagination">
              <span>
                Showing {currentRows.length} of{' '}
                {filteredRows.length > 0 ? filteredRows.length : rows.length} results
              </span>
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default Reports;
