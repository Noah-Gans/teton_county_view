import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';
import { ReactComponent as MountainSvg } from '../assets/images/test.svg';
import tutorialImage from '../assets/images/tutorial.png';
import Tutorial from '../components/Tutorial';
const Intro = ({ onStartClick }) => {
  const navigate = useNavigate();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const handleStartClick = () => {
    onStartClick(); // Trigger tab change to map
    navigate('/map'); // Navigate to the map page
  };

  const handleTutorialClick = () => {
    setIsTutorialOpen(true); // Open the tutorial popup
  };

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false); // Close the tutorial popup
  };

  useEffect(() => {
    const paths = document.querySelectorAll('.animated-svg path');
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.style.animation = 'draw 4s ease-in-out forwards';
    });
  }, []);

  return (
    <div className="intro">
      <h1 className="intro-title">Teton County, Wyoming Community View</h1>
      <div className="svg-container">
        <MountainSvg className="intro-svg animated-svg" />
      </div>
      <button onClick={handleStartClick} className="explore-button">
        Explore
      </button>
      <p className="information-updates">Information & Updates</p>
      <div className="arrow-container">
        {/* Arrow SVG as an inline SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="20"
          height=""      
          className="arrow-svg"
        >
          <path d="M50 0 L50 85 M50 85 L30 65 M50 85 L70 65" stroke="#000" stroke-width="5" fill="none" />

        </svg>
        
      </div>
      <div className="bottom-section">
        <div className="tutorial-updates-container">
          <div className="tutorial">
            <h2>Click for a Quick Tutorial</h2>
            <div className="tutorial-image">
              <img src={tutorialImage} alt="Tutorial" className="tutorial-img" />
            </div>
            <button onClick={handleTutorialClick} className="tutorial-button">
              How to Use
            </button>
          </div>
          <div className="updates">
            <h2>Updates and Future Developments</h2>
            <div className="updates-scroll-box">
              <div className="update-item">
                <h3>Teton Community View 1.0 Release</h3>
                <p>This is the very first release of a replacement GIS server for Teton County Wyoming.</p>
              </div>
              <hr className="update-divider" />
              <div className="update-item">
                <h3>Future Development: Community Feedback</h3>
                <p>We're working on adding more community features to better engage with Teton residents.</p>
              </div>
              <hr className="update-divider" />
              <div className="update-item">
                <h3>Mapping Enhancements</h3>
                <p>Upcoming improvements include better aerial imagery and additional map layers for analysis.</p>
              </div>
              <hr className="update-divider" />
              <div className="update-item">
                <h3>Mapping Enhancements</h3>
                <p>Upcoming improvements include better aerial imagery and additional map layers for analysis.</p>
              </div>
              
            </div>
          </div>


        </div>

        <div className="contact-section">
          <p>
            This is a service for the people. If you have ideas, frustrations, or notice something is not working, please contact me below!
          </p>
          <a href="mailto:tetoncountyview@gmail.com">
            <button className="contact-button">Contact</button>
          </a>
        </div>
      </div>
      {isTutorialOpen && <Tutorial onClose={handleCloseTutorial} />}
    </div>
    
    
  );
};

export default Intro;
