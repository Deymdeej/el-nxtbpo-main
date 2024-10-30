import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './css/ITadminForm.css';
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

import './css/AdminFormSuper.css';

// Import assets
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import TrainingDefault from '../assets/trainingdefault.png';
import CertDefault from '../assets/certdefault.png';

const ITAdminDashboardForm = ({ selectedNav }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768); // Initialize based on screen size
  const [selectedSection, setSelectedSection] = useState('overview');
  const [fullName, setFullName] = useState(''); // Initialize fullName with an empty string
  const [courses, setCourses] = useState([]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Monitor screen resize to show/hide sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth > 768); // Show sidebar if screen is larger than 768px
    };

    // Attach the event listener
    window.addEventListener('resize', handleResize);

    // Clean up the event listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesCollection = collection(db, "Courses");
        const coursesSnapshot = await getDocs(coursesCollection);
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
  
    fetchCourses();
  }, []);

  return (
    <div className="admin-super-container">
      <nav className={`sidebar-super ${isOpen ? 'open-super' : 'closed-super'}`}>
        <div className="logo-super">
          <img src={BPOLOGO} alt="Company Logo" />
        </div>
        <ul className="nav-links-super">
          <li>
            <button
              onClick={() => handleSectionChange('overview')}
              className={`nav-button-super ${selectedSection === 'overview' ? 'active-super' : ''}`}
            >
              <img src={UserDefault} alt="Overview" className="nav-icon-super" />
              <span>Overview</span>
            </button> 
          </li>
          <li>
            <button
              onClick={() => navigate('/it-admin-courses')}
              className={`nav-button-super ${selectedSection === 'course' ? 'active-super' : ''}`}
            >
              <img src={CourseDefault} alt="Course" className="nav-icon-super" />
              <span>Course</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/it-admin-training')}
              className={`nav-button-super ${selectedSection === 'training' ? 'active-super' : ''}`}
            >
              <img src={TrainingDefault} alt="Training" className="nav-icon-super" />
              <span>Training</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/it-admin-certificates')}
              className={`nav-button-super ${selectedSection === 'certificate' ? 'active-super' : ''}`}
            >
              <img src={CertDefault} alt="Certificate" className="nav-icon-super" />
              <span>Certificate</span>
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
        <h1>Hello, {fullName || 'IT ADMIN'}!</h1>
        <h11>OVERVIEW HERE: TBD! </h11>
        {/* Main content */}
        {selectedSection === 'overview' && (
          <div className="IT-user-course-my-courses-section">
            
          </div>
        )}
      </div>

      
    </div>
  );
};

export default ITAdminDashboardForm;
