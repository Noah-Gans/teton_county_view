import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./MainHeader.css";
import ContactForm from "../components/ContactForm";
import { useMapContext } from "./MapContext";
import { useUser } from "../contexts/UserContext";

const MainHeader = () => {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const { activeTab, setActiveTab } = useMapContext();
  const { user, logout } = useUser(); // Access user state and logout function from UserContext

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleContactClick = () => {
    setIsContactFormOpen(true);
  };

  const handleCloseContactForm = () => {
    setIsContactFormOpen(false);
  };

  return (
    <div className="main-header">
      {/* Navigation Tabs */}
      <Link
        className={`header-tab ${activeTab === "map" ? "active" : ""}`}
        onClick={() => handleTabChange("map")}
        to="/map"
      >
        Map
      </Link>
      <Link
        className={`header-tab ${activeTab === "search" ? "active" : ""}`}
        onClick={() => handleTabChange("search")}
        to="/search"
      >
        Search
      </Link>
      <Link
        className={`header-tab ${activeTab === "print" ? "active" : ""}`}
        onClick={() => handleTabChange("print")}
        to="/print"
      >
        Print
      </Link>
      <Link
        className={`header-tab ${activeTab === "home" ? "active" : ""}`}
        onClick={() => handleTabChange("home")}
        to="/"
      >
        Home
      </Link>

      

      
    </div>
  );
};

export default MainHeader;
