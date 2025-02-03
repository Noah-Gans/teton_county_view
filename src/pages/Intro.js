import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';
import tutorialImage from '../assets/images/tutorial.png';
import staticImage from '../assets/images/static image.jpg'; // Import the static image for Safari
import Tutorial from '../components/Tutorial';
import ContactForm from '../components/ContactForm';
import SharePopup from '../components/SharePopup';  // Import the new SharePopup
import { useMapContext } from '../pages/MapContext';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app"; // or initializeApp(...) if not done yet


const Intro = ({ onStartClick }) => {
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useMapContext();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isBookmarkGuideOpen, setIsBookmarkGuideOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);  // New state for the share popup
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Check if the browser is Safari
    const userAgent = navigator.userAgent.toLowerCase();
    const safari = userAgent.includes('safari') && !userAgent.includes('chrome');
    setIsSafari(safari);
  }, []);

  

  const handleTutorialClick = () => {
    setIsTutorialOpen(true); // Open the tutorial popup
  };

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false); // Close the tutorial popup
  };


  const handleOpenContact = () => {
    setIsContactOpen(true); // Open the contact form
  };

  const handleCloseContact = () => {
    setIsContactOpen(false); // Close the contact form
  };

  const handleOpenBookmarkGuide = () => {
    setIsBookmarkGuideOpen(true);
  };

  const handleCloseBookmarkGuide = () => {
    setIsBookmarkGuideOpen(false);
  };

  const handleOpenShare = () => {
    setIsShareOpen(true);
  };

  // Close the share popup
  const handleCloseShare = () => {
    setIsShareOpen(false);
  };

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Teton County GIS',
        text: 'Check out this amazing spatial data platform: Teton County GIS!',
        url: 'https://www.tetoncountygis.com',
      })
      .then(() => console.log('Share successful!'))
      .catch((error) => console.log('Sharing failed:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      alert('Your browser does not support sharing. Please copy and share the link manually.');
    }
  };
  

const removeSuccess = () => {
  const button = document.querySelector('.button');
  if (button) {
    button.classList.remove('success');
    setTimeout(removeSuccess, 3000); // Remove success state after 3 seconds
  }
};

// Function that handles button click
const handleStartClick = (e) => {
  e.preventDefault(); // Prevent the anchor's default action

  const button = document.querySelector('.button');
  if (button) {
    button.classList.add('success');

    // Set a timeout to remove the 'success' class after 3 seconds
    setTimeout(removeSuccess, 3000);

    // Navigate to the map page after a short delay for animation
    setTimeout(() => {
      navigate('/map');
    }, 300); // Adjust the timing as necessary
  }
};
const createCheckoutSession = httpsCallable(
  getFunctions(getApp()), 
  "createCheckoutSession"
);

const handleStripeCheckout = async () => {
  setLoading(true);
  try {
    // Call the function with the needed data
    const result = await createCheckoutSession({
      email: "user@example.com",
      userId: "USER_ID",
    });
    // result.data should contain { url: session.url }
    const { url } = result.data;
    window.location.href = url;
  } catch (error) {
    console.error("Error calling onCall function:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};




document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.button').addEventListener('click', function() {
    this.classList.add('success');
    setTimeout(removeSuccess, 3000); // Remove success state after 3 seconds
  });
});
  
  useEffect(() => {
    if (!isSafari) {
      // Animate SVG paths if not Safari
      const paths = document.querySelectorAll('.animated-svg path');
      paths.forEach((path) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        path.style.animation = 'draw 4s ease-in-out forwards';
      });
    }
  }, [isSafari]);

  return (
    <div className="intro">
      <h1 className="intro-title">The Better Teton County, Wyoming GIS Hub</h1>
      <h2>Contact Us for Teton County GIS Support</h2>

      
      <div className="svg-container">
        {isSafari ? (
          // Render as a static image if Safari
          <div className="static-image-container">
            <img src={staticImage} alt="Mountain View" className="static-image" />
          </div>
        ) : (
          // Otherwise render the animated SVG
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 300 193"
            preserveAspectRatio="xMidYMid meet"
            className="intro-svg animated-svg"
          >
            <g
              transform="translate(0.000000,193.000000) scale(0.100000,-0.100000)"
              fill="currentColor"
              stroke="none"
            >
            <path d="M1578 1167 c-14 -7 -61 -40 -103 -75 -54 -45 -77 -71 -82 -93 -5 -28 -23 -51 -23 -30 0 24 -30 9 -51 -25 -19 -31 -26 -35 -51 -30 -23 4 -34 0 -52 -19 -15 -16 -34 -25 -53 -25 -39 0 -109 47 -124 82 -13 33 -55 58 -95 58 -20 0 -41 -15 -80 -57 -30 -32 -57 -62 -62 -66 -18 -19 -149 -97 -163 -97 -63 -1 -151 60 -207 142 -19 27 -40 48 -51 48 -9 0 -49 -25 -87 -55 -73 -57 -130 -88 -185 -100 -41 -9 -56 -20 -75 -57 -20 -38 -4 -35 21 4 15 24 32 34 73 44 65 17 89 30 176 99 38 30 73 55 78 55 5 0 22 -21 38 -46 56 -89 156 -152 224 -141 18 3 61 23 97 46 74 47 71 44 128 109 24 28 54 53 67 56 34 9 80 -18 92 -53 14 -41 105 -94 147 -86 17 3 37 15 46 27 12 16 23 19 42 14 21 -5 31 1 61 36 20 23 36 36 36 30 0 -27 29 -9 43 26 18 45 150 159 194 168 26 5 31 2 45 -33 9 -21 21 -51 26 -68 6 -20 20 -36 45 -47 20 -10 44 -32 53 -50 17 -32 17 -32 27 -10 6 13 19 22 32 22 12 0 39 14 60 30 21 17 46 30 55 30 10 0 20 7 24 15 5 13 10 13 41 -2 l35 -17 -37 -30 c-21 -17 -56 -36 -78 -41 -41 -11 -88 -41 -159 -103 -21 -19 -57 -42 -80 -53 -29 -13 -35 -19 -20 -19 22 0 58 23 174 112 34 25 78 49 98 53 20 4 55 23 80 46 25 21 50 39 57 39 7 0 25 10 40 21 21 17 29 19 35 9 6 -10 13 -9 31 4 36 25 47 20 60 -26 7 -24 17 -49 22 -55 12 -16 63 -17 73 -2 4 7 12 -1 20 -19 17 -42 47 -55 131 -58 59 -3 80 -8 110 -29 21 -14 47 -25 58 -25 11 0 43 -12 70 -25 28 -14 54 -25 59 -25 5 0 36 -19 69 -41 80 -55 160 -88 142 -59 -3 6 -13 10 -20 10 -8 0 -40 16 -71 36 -78 50 -178 99 -242 117 -29 9 -64 25 -79 37 -20 15 -41 20 -92 20 -94 0 -107 6 -126 52 -15 39 -17 40 -35 23 -31 -28 -53 -15 -74 43 -16 46 -22 52 -47 52 -16 0 -32 -7 -38 -17 -6 -10 -11 -12 -11 -5 0 15 -36 16 -45 2 -4 -6 -21 -17 -38 -24 -29 -12 -36 -11 -69 8 -34 19 -38 20 -50 5 -7 -9 -26 -20 -41 -23 -15 -4 -35 -15 -45 -26 -9 -11 -26 -20 -38 -20 -12 0 -27 -7 -34 -15 -11 -14 -16 -12 -39 14 -14 16 -35 31 -46 33 -14 2 -25 17 -35 48 -36 105 -52 120 -102 97z" />            </g>
          </svg>
        )}
      </div>
      
      <div className="chevron-button-container">
      <a
        className="button explore-button"
        onClick={() => {
          onStartClick();
          setActiveTab("map");
          navigate("/map");
        }}
        role="button"
      >
          <span>Explore</span>
          <div className="icon">
            <i className="icon-caret">🗺️</i>
            
          </div>
        </a>

        <div className="row narrow-row">
          <a className="button updates-button" onClick={() => navigate('/updates')} role="button">
            <span>Updates</span>
            <div className="icon">
              <i className="icon-caret">📨</i>
              
            </div>
          </a>
          <a className="button contact-button" onClick={handleOpenContact} role="button">
            <span>Contact</span>
            <div className="icon">
              <i className="icon-caret">📞</i>
              
            </div>
          </a>
        </div>

        <div className="row wide-row">
          <a className="button tutorial-button" onClick={() => navigate('/tutorial')} role="button">
            <span>Tutorial</span>
            <div className="icon">
              <i className="icon-caret">🤔</i>
             
            </div>
          </a>
          <a className="button share-button" onClick={handleOpenShare} role="button">
            <span>Share</span>
            <div className="icon">
              <i className="icon-caret">🗣️</i>
            </div>
          </a>
        </div>
      </div>

      
      
      {isBookmarkGuideOpen && (
        <div className="bookmark-guide-overlay">
          <div className="bookmark-guide-container">
            <button className="close-button" onClick={handleCloseBookmarkGuide}>
              X
            </button>
            <h2>How to Bookmark this Page</h2>
            <div className="bookmark-instructions">
            <p><strong>How to bookmark webpages in Chrome</strong></p>
            <p><u>On Laptop</u></p>
            <p>Step 1. Open the Chrome browser on your Windows or MAC laptop.</p>
            <p>Step 2. Visit your favorite website you wish to bookmark.</p>
            <p>Step 3. Beside the address bar on top, click the “Bookmark this tab” (star icon) option.</p>
            <p>Step 4. Now enter a name for the bookmark and choose a folder to save it.</p>
            <p>Step 5. Click “Done“.</p>
            <p>That’s it. Your bookmark will now be added to the Chrome browser on your laptop.</p>
            
            <p><strong>How to bookmark your webpage in Edge</strong></p>
            <p><u>On Computer/Laptop</u></p>
            <p>Step 1. Launch the Microsoft Edge browser on your computer.</p>
            <p>Step 2. Go to the webpage you want to create the bookmark for.</p>
            <p>Step 3. Once the website is loaded, click on the “Add this page to favorites” option (star icon) or press “Ctrl + D” on your keyboard.</p>
            <p>Step 4. Now, enter a bookmark name and choose a folder to save it. Once finished, click the “Done” button.</p>
            <p>This will add the webpage to the favorites tab, also known as the bookmark section, in your Microsoft Edge browser.</p>

            <p><strong>How to bookmark a website in Safari</strong></p>
            <p><u>On Computer/Laptop</u></p>
            <p>Step 1. Open the Safari browser on your laptop or computer.</p>
            <p>Step 2. Go to the webpage you want to bookmark.</p>
            <p>Step 3. Select the “Share” button in the gray toolbar.</p>
            <p>Step 4. Select the “Add Bookmark” option.</p>
            <p>Step 5. Choose where to add the bookmark and rename it if you’d like.</p>
            <p>Step 6. Click “Add” to save the bookmark.</p>
            <p><strong>How to create a bookmark in Firefox</strong></p>
            <p><u>On Desktop/Laptop</u></p>
            <p>Step 1. Open the Firefox on your desktop or laptop.</p>
            <p>Step 2. Go to the webpage you want to bookmark.</p>
            <p>Step 3. Click the “Star icon” on the address bar.</p>
            <p>Step 4. From the menu that drops down, enter a name for your bookmark, then click “Done“.</p>

              {/* Add more instructions for other browsers as needed */}
            </div>
          </div>
        </div>
      )}
      
      {isTutorialOpen && <Tutorial onClose={handleCloseTutorial} />}
      {isContactOpen && <ContactForm onClose={handleCloseContact} />}
      {isShareOpen && <SharePopup onClose={handleCloseShare} />}  {/* Add the share popup */}
    </div>
  );
};

export default Intro;
