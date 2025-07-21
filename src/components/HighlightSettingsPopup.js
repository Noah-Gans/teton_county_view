import React, { useState } from "react";
import { useUser } from "../contexts/UserContext";
import "./HighlightSettingsPopup.css";

const HighlightSettingsPopup = ({ onClose }) => {
  const { highlightSettings, setHighlightSettings } = useUser();

  const [fillColor, setFillColor] = useState(highlightSettings.fillColor);
  const [fillOpacity, setFillOpacity] = useState(highlightSettings.fillOpacity);
  const [outlineColor, setOutlineColor] = useState(highlightSettings.fillOutlineColor);
  const [lineColor, setLineColor] = useState(highlightSettings.lineColor);
  const [lineWidth, setLineWidth] = useState(highlightSettings.lineWidth);

  const handleSave = () => {
    setHighlightSettings({
      fillColor,
      fillOpacity: parseFloat(fillOpacity),
      fillOutlineColor: outlineColor,
      lineColor,
      lineWidth: parseFloat(lineWidth),
    });
    onClose();
  
    // 🧼 Trigger full repaint so changes apply immediately
    setTimeout(() => {
      if (window.mapRef?.current) {
        window.mapRef.current.resize(); // Force layout
        window.mapRef.current.triggerRepaint?.(); // Trigger render
      }
    }, 50);
  };
  
  

  return (
    <div className="highlight-popup-overlay">
      <div className="highlight-popup">
        <h3>Highlight Settings</h3>

        <label>Fill Color</label>
        <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} />

        <label>Fill Opacity</label>
        <input type="number" min="0" max="1" step="0.05" value={fillOpacity} onChange={(e) => setFillOpacity(e.target.value)} />

        <label>Outline Color</label>
        <input type="color" value={outlineColor} onChange={(e) => setOutlineColor(e.target.value)} />

        <label>Line Color</label>
        <input type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} />

        <label>Line Width</label>
        <input type="number" min="1" max="10" step="1" value={lineWidth} onChange={(e) => setLineWidth(e.target.value)} />

        <div className="popup-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose} className="cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default HighlightSettingsPopup;
