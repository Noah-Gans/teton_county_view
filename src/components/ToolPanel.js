import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ToolPanel.css';

const ToolPanel = ({ onZoomIn, onZoomOut, onDrawLine, onDrawPolygon, onClear, onEdit, onSaveEdit, onCancelEdit }) => {

  

  return (
    <div className="tool-panel">
      <div className="tool-container">
        <button className="tool-btn" onClick={onZoomIn}>+</button>
        <button className="tool-btn" onClick={onZoomOut}>-</button>
        <button className="tool-btn" onClick={onDrawLine}>📏</button>
        <button className="tool-btn" onClick={onDrawPolygon}>⬢</button>
        <button className="tool-btn" onClick={onClear}>❌</button>
        
      </div>
    </div>
  );
};

export default ToolPanel;
