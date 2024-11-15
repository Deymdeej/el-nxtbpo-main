import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import BPOLOGO from '../assets/bpo-logo.png';
import { auth } from "../firebase";
import CoursePick from '../assets/coursepick.png';
import CourseDefault from '../assets/coursedefault.png';
import TrainingPick from '../assets/trainingpick.png';
import TrainingDefault from '../assets/trainingdefault.png';
import CertPick from '../assets/certpick.png';
import CertDefault from '../assets/certdefault.png';
import LogoutPick from '../assets/logoutpick.png';
import LogoutDefault from '../assets/logoutdefault.png';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from "firebase/auth";
import './css/AdminFormSuper.css';
import './css/ITUserCertificate.css';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import html2canvas from 'html2canvas';

function HRUserCertificateForm({
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
  const [selectedSection, setSelectedSection] = useState('hrcert');
  const auth = getAuth();
  const [certificateResults, setCertificateResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [fullName, setFullName] = useState('');
  const currentUserId = auth.currentUser?.uid // Get current user ID



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
          const userDocRef = doc(db, "Users", userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName || 'Anonymous');
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
        localStorage.removeItem('user');
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
        const link = document.createElement('a');
        link.href = url;
        link.download = `${courseTitle}_Certificate.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
              onClick={() => navigate('/hr-user-dashboard')}
              className={`nav-button-super ${selectedSection === 'courses' ? 'active-super' : ''}`}
            >
              <img src={CourseDefault} alt="Courses" className="nav-icon-super" />
              <span>Courses</span>
            </button> 
          </li>
          <li>
            <button
              onClick={() => navigate('/hr-user-training')}
              className={`nav-button-super ${selectedSection === 'training' ? 'active-super' : ''}`}
            >
              <img src={TrainingDefault} alt="Training" className="nav-icon-super" />
              <span>Training</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSectionChange('hrcert')}
              className={`nav-button-super ${selectedSection === 'hrcert' ? 'active-super' : ''}`}
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
        <h1 style={{ fontSize: '22px', marginLeft: '25px' }}>
          <strong><span style={{ color: '#48887B' }}>Hello</span></strong>, <em>{fullName || 'HR user'}</em>!
        </h1>

        {selectedSection === 'hrcert' && (
  <div id="certificates-list" className="user-list-super-section">
    <h2>Your Certificates</h2>
    {certificateResults &&
    certificateResults.filter((result) => result.userId === currentUserId).length > 0 ? (
      <div className="certificates-container">
        {certificateResults
          .filter((result) => result.userId === currentUserId)
          .map((result) => (
            <div
              key={result.id}
              className="certificate-card"
              onClick={() => handleOpenModal(result)}
              style={{ cursor: 'pointer' }}
            >
              <div className="certificate-preview">
                <img
                  src={result.certificateUrl}
                  alt="Certificate Preview"
                  className="certificate-image"
                />
              </div>
              <div className="certificate-info">
                <h3 className="certificate-title">{result.courseTitle}</h3>
                
             
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
              {/* Modal Header */}
              <div className="modal-header">
                <h2>{selectedCertificate.courseTitle} Certificate</h2>
                <button onClick={handleCloseModal} className="close-button">&times;</button> {/* Close button */}
              </div>

              {/* Modal Body */}
              <div className="modal-body">
                <img src={selectedCertificate.certificateUrl} alt="Certificate" className="certificate-image" />
              </div>

            <div className="modal-footer modal-footer-center">
            <button type='button' className='cert-button11'
              onClick={() => handleDirectDownloadCertificate(
                selectedCertificate.certificateUrl,
                selectedCertificate.courseTitle
              )}
            >
              Download as PNG
            </button>
          </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}

export default HRUserCertificateForm;
