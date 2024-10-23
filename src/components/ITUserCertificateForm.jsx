import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from "react-bootstrap"; // Assuming you're using react-bootstrap for modal
import { toast } from "react-toastify"; // For toast notifications
import BPOLOGO from '../assets/bpo-logo.png'; // Ensure the path is correct
import { db, auth } from "../firebase"; // Ensure Firebase is properly configured
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

// ITUserCertificateForm Component
function ITUserCertificateForm({
  showModal,
  setShowModal,
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
        <h1>Hello IT user!</h1>

        {selectedSection === 'cert' && (
          <div id="certificates-list" className="user-list-super-section">
            <h2>CERTIFICATES HERE: DIRI KA MAG BUTANG SA IMONG FUNCTION BOSS THIRDS!</h2>

        
          </div>
        )}

      </div>
    </div>
  );
}

export default ITUserCertificateForm;
