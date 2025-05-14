
import React from 'react';
import './Updates.css';
import { useNavigate } from 'react-router-dom'; // For navigation

const Updates = () => {
    const navigate = useNavigate(); // For navigation back to previous page

  return (
    <div className="updates-page">
        <button className="back-button" onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      <h1>Latest Teton County GIS Features & Updates</h1>
      <h2> Contact Me With Questions and Ideas </h2>
      <div className="updates-scroll-box">
        <div className="update-item">
          <h3>Feature Features</h3>
          <h4>Before End of November</h4>
          <p>Future work will mostly improve the layers and add features:</p>
          <ul>
            <li>
              <strong>Report Builder</strong>: This is the feature I'm most excited for. It will allow users to sort and download reports based on the ownership data with the tax and detail data added. It will allow users to sort owners by square foot development, sort developments by year built, and square footage. Anything that is publicly available about properties can be used to sort and can be downloaded. Hoping to finish by the end of November, but there's a lot of work with this.

              <br></br>
              <br></br>
              With the amount I'm pouring time into this I think it might be done before start of Novemeber
              <br></br>
              <br></br>
            </li>
            <li>
              <strong>Print</strong>: Probably Done by end of November
            </li>
            <li>
              <strong>Map</strong>: I think I need to switch to tiles for the map visuals serving. For those who don't know what this means, It basically means that insted of reatriving all the cordinateds to draw the layers, the map will retrive images or image esk data files which is way less data. It wil make the map load faster and operate faster. I think this will be most essential for getting mobile working.           </li>

          </ul>
        </div>
        <hr className="update-divider" />
          <div className="update-item">
          <h3>Teton County GIS 2.0.0 Release</h3>
          <h4>October 12th, 2024</h4>
          <p>Third Release: Massive Update               <br></br>
          Fundamentally changed the way spatial data is visualized to increase speed and enable mobile compatibility. The app is now using vector tiles to efficiently display all layers and enable selection. On top of this, report builder has been added and integrated into the selection of parcels allowing users to select ownership parcels of interest and immediately open their property, tax, and clerk details in a report and even download the report. At the moment the backend report building is not 100% accurate but will improve through community input and time. Most of it is an outcome of the massive computation and time overhead to scrape every parcel’s county pages. The report builder has massive potential and will continue to improve. In this update multi select has also been added allowing users to select multiple parcels at once. New layers have been added, and their styles have been updated. Search got a massive overhaul with a complete user interface redesign and the ability to select multiple search results and map all selected results. The entire account management and payment portals were also added during this time.   </p>          
          <ul>
            <li>
              <strong>Map</strong>: Added road layer styling. I tried to match that which was conventional and matched the Wyoming state road map and the WYDOT. Legend added too. 
           </li>
            <li>
              <strong>Search</strong>: No Change from 1.0
            </li>
            <li>
            <strong>Report Builder</strong>: Been putting a ton of hours to get this feature up. I believe it will certainly establish this GIS platform as an overall better service.  The report builder will, in my ideal implementation, allow users to build reports of all the information the county has on parcels besides the clerk data. This means you could build a report of all the properties in the Rafter J, what their property value is, how much have they paid in tax, what type of structures are there. It would allow you to know the average square footage of homes in different neighborhoods, or the change in building square footage over time. I’ve built the scraper but there will be many more scrips to process the raw data so that it is in it's most valuable form. 
            </li>
            <li>
            <strong>Print</strong>: Not so inspiring of a goal right now so no updates. Please tell me if this has valuable. Right now pouring time into report builder.            
            </li>
          
          </ul>
        </div>
        <hr className="update-divider" />
          <div className="update-item">
          <h3>Teton County GIS 1.0.1 Release</h3>
          <h4>October 12th, 2024</h4>
          <p>Second Release: Added styling for different roads and the corresponding ledged. Completely redid the landing page, tutorial, and this updates page. Lots of work on backend for the report builder. but nothing that is visible here. Scraping all the detailed plat data and plat tax data is slow so it may be a weekly update because one scape of all plots is </p>
          <ul>
            <li>
              <strong>Map</strong>: Added road layer styling. I tried to match that which was conventional and matched the Wyoming state road map and the WYDOT. Legend added too. 
           </li>
            <li>
              <strong>Search</strong>: No Change from 1.0
            </li>
            <li>
            <strong>Report Builder</strong>: Been putting a ton of hours to get this feature up. I believe it will certainly establish this GIS platform as an overall better service.  The report builder will, in my ideal implementation, allow users to build reports of all the information the county has on parcels besides the clerk data. This means you could build a report of all the properties in the Rafter J, what their property value is, how much have they paid in tax, what type of structures are there. It would allow you to know the average square footage of homes in different neighborhoods, or the change in building square footage over time. I’ve built the scraper but there will be many more scrips to process the raw data so that it is in it's most valuable form. 
            </li>
            <li>
            <strong>Print</strong>: Not so inspiring of a goal right now so no updates. Please tell me if this has valuable. Right now pouring time into report builder.            
            </li>
          
          </ul>
        </div>
        <hr className="update-divider" />
        <div className="update-item">
          <h3>Teton County GIS 1.0.0 Release</h3>
          <h4>October 6th, 2024</h4>
          <p>First Release: Includes map and search features. Print and advanced search yet to be implemented.</p>
          <ul>
            <li>
              <strong>Map</strong>: Single feature selection. Contact if multiple feature selection is valuable to you. Some layers are missing, particularly those connected to state-level bureaucracy.
            </li>
            <li>
              <strong>Search</strong>: Regular Search is working well. There may be some improvements to the matching for more general searches. Advanced Search is not implemented yet, and I'm not sure how valuable it is for the users. Contact me if you have comments.
            </li>
            <li>
              Implemented with 3 base maps. I think these will remain. It may be valuable for users to define their initial load-up settings, for example which layers are enabled from the start and the starting base map. Pretty tricky but it could be nice.
            </li>
            <li>
              <strong>Print</strong>: I've heard print is important, but I'm not sure how to do it and how difficult it is to add. Likely coming out in the next big release.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Updates;


