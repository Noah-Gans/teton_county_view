import React, { useState } from 'react';
import './ToolPanel.css';

const ToolPanel = ({ onZoomIn, onZoomOut, onDrawLine, onDrawPolygon, onClear, onEdit, onSaveEdit, onCancelEdit }) => {
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);

  const toggleEditDropdownAndStartEditing = () => {
    setIsEditDropdownOpen((prevState) => {
      const newState = !prevState;
      
      if (newState) {
        // Trigger editing when dropdown opens
        onEdit(); 
      }
      
      return newState;
    });
  };

  const handleSaveAndCloseDropdown = () => {
    onSaveEdit(); // Trigger the save functionality
    setIsEditDropdownOpen(false); // Close the dropdown after saving
  };

  const handleCancelAndCloseDropdown = () => {
    onCancelEdit(); // Trigger the cancel functionality
    setIsEditDropdownOpen(false); // Close the dropdown after canceling
  };

  return (
    <div className="tool-panel">
      <div className="tool-container">
        <button className="tool-btn" onClick={onZoomIn}>+</button> {/* Zoom In */}
        <button className="tool-btn" onClick={onZoomOut}>-</button> {/* Zoom Out */}
        <button className="tool-btn" onClick={onDrawLine}>📏</button> {/* Measure Tool */}
        <button className="tool-btn" onClick={onDrawPolygon}>⬢</button> {/* Polygon Tool */}
        <button className="tool-btn" onClick={onClear}>❌</button> {/* Clear Button */}
        
        {/* Edit Button with Dropdown */}
        <div className="edit-dropdown">
          <button className="tool-btn" onClick={toggleEditDropdownAndStartEditing}>✏️</button> {/* Edit Button */}
          {isEditDropdownOpen && (
            <div className="dropdown-content">
              <button onClick={handleSaveAndCloseDropdown}>💾 Save</button>
              <button onClick={handleCancelAndCloseDropdown}>❌ Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolPanel;
