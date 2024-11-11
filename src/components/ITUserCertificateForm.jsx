import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from "react-bootstrap"; // Assuming you're using react-bootstrap for modal
import { toast } from "react-toastify"; // For toast notifications
import BPOLOGO from '../assets/bpo-logo.png'; // Ensure the path is correct
import { auth } from "../firebase"; // Ensure Firebase is properly configured
import CoursePick from '../assets/coursepick.png';
import CourseDefault from '../assets/coursedefault.png';
import TrainingPick from '../assets/trainingpick.png';
import TrainingDefault from '../assets/trainingdefault.png';
import CertPick from '../assets/certpick.png';
import CertDefault from '../assets/certdefault.png';
import LogoutPick from '../assets/logoutpick.png';
import LogoutDefault from '../assets/logoutdefault.png';
import { useNavigate } from 'react-router-dom'; // For navigation
import { getAuth, signOut } from "firebase/auth";
import './css/AdminFormSuper.css';
import './css/ITUserCertificate.css';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

import html2canvas from 'html2canvas';

// ITUserCertificateForm Component
function ITUserCertificateForm({

  certificates,
  certificateTitle,
  setCertificateTitle,
  certificateDescription,
  setCertificateDescription,
  issueDate,
  setIssueDate,
  handleSubmit
}) {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState('cert');
  const auth = getAuth();
  const [certificateResults, setCertificateResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [fullName, setFullName] = useState(''); // Define the fullName state

  // Function to handle opening the modal with selected certificate
  const handleOpenModal = (certificate) => {
    setSelectedCertificate(certificate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCertificate(null);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          const userDocRef = doc(db, "Users", userId); // Assuming 'Users' collection contains user data
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName || 'Anonymous'); // Set the fullName state
          } else {
            console.error("No such user data found.");
            setFullName('Anonymous');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);



  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Clear local storage or session
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/login';
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
  };

  useEffect(() => {
    const fetchCertificateResults = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "certificateResult"));
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCertificateResults(results);
      } catch (error) {
        console.error("Error fetching certificate results:", error);
      }
    };

    fetchCertificateResults();
  }, []);

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  const handleResize = () => {
    if (window.innerWidth > 768) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };
  const handleDirectDownloadCertificate = async (certificateUrl, courseTitle) => {
    if (certificateUrl) {
      try {
        const response = await fetch(certificateUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Create a temporary link to download the blob as PNG
        const link = document.createElement('a');
        link.href = url;
        link.download = `${courseTitle}_Certificate.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Revoke the object URL to free memory
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading certificate:", error);
        alert("Failed to download the certificate. Please try again.");
      }
    } else {
      console.error("No certificate URL available.");
      alert("Certificate URL is missing. Please try again later.");
    }
  }
  

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="admin-super-container">
      <nav className={`sidebar-super ${isOpen ? 'open-super' : ''}`}>
        <div className="logo-super">
          <img src={BPOLOGO} alt="Company Logo" />
        </div>
        <ul className="nav-links-super">
          <li>
            <button
              onClick={() => navigate('/it-user-dashboard')}
              className={`nav-button-super ${selectedSection === 'courses' ? 'active-super' : ''}`}
            >
              <img src={CourseDefault} alt="Courses" className="nav-icon-super" />
              <span>Courses</span>
            </button> 
          </li>
          <li>
            <button
              onClick={() => navigate('/it-user-training')}
              className={`nav-button-super ${selectedSection === 'training' ? 'active-super' : ''}`}
            >
              <img src={TrainingDefault} alt="Training" className="nav-icon-super" />
              <span>Training</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/it-user-certificate')}
              className={`nav-button-super ${selectedSection === 'cert' ? 'active-super' : ''}`}
            >
              <img src={CertDefault} alt="Certificates" className="nav-icon-super" />
              <span>Certificates</span>
            </button>
          </li>
        </ul>
        <div className="logout-super">
          <button className="nav-button-super" onClick={handleLogout}>
            <img src={LogoutDefault} alt="Logout Icon" className="nav-icon-super" />
            Logout
          </button>
        </div>
      </nav>

      <button className="hamburger-super" onClick={toggleSidebar}>
        ☰
      </button>

      <div className="content-super">
      <h1>Hello, {fullName || 'IT user'}!</h1>

       
        {selectedSection === 'cert' && (
          <div id="certificates-list" className="user-list-super-section">
            <h2>Your Certificates</h2>
            {certificateResults.length > 0 ? (
        <div className="certificates-container">
         {certificateResults.map((result) => (
            <div
              key={result.id}
              className="certificate-card"
              onClick={() => handleOpenModal(result)} // Open modal on click
              style={{ cursor: 'pointer' }}
            >
              <div className="certificate-preview">
                <img src={result.certificateUrl} alt="Certificate Preview" className="certificate-image" />
              </div>
              <div className="certificate-info">
                <h3 className="certificate-title">{result.courseTitle}</h3>
                <span className="certificate-category">HR Course</span>
                <p className="certificate-date">{result.date}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No certificates available.</p>
      )}
          </div>
        )}

{isModalOpen && selectedCertificate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedCertificate.courseTitle} Certificate</h2>
            <img src={selectedCertificate.certificateUrl} alt="Certificate" className="certificate-image" />
            <div className="modal-buttons">
              <button
                onClick={() => handleDirectDownloadCertificate(
                  selectedCertificate.certificateUrl,
                  selectedCertificate.courseTitle
                )}
              >
                Download as PNG
              </button>
              <button onClick={handleCloseModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default ITUserCertificateForm;
