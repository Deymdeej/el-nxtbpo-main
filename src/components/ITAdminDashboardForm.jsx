import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './css/ITadminForm.css';
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

// Import assets
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';

const ITAdminDashboardForm = ({ selectedNav }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesCollection = collection(db, "Courses");  // Ensure "Courses" is correct
        const coursesSnapshot = await getDocs(coursesCollection);
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(coursesData);  // Log to ensure data is fetched
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
  
    fetchCourses();
  }, []);
  

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="header">
          <img className="logo" alt="BPO Logo" src={BPOLOGO} />
        </div>
        <nav className="nav">
          <div
            className={`nav-item ${selectedNav === "overview" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-dashboard")}
          >
            <img src={UserDefault} alt="User" className="nav-icon" />
            Overview
          </div>
          <div
            className={`nav-item ${selectedNav === "courses" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-courses")}
          >
            <img src={CourseDefault} alt="Courses" className="nav-icon" />
            Courses
          </div>
          <div
            className={`nav-item ${selectedNav === "training" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-training")}
          >
            <img src={UserDefault} alt="Training" className="nav-icon" />
            Training
          </div>
          <div
            className={`nav-item ${selectedNav === "certificate" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-certificates")}
          >
            <img src={UserDefault} alt="Certificate" className="nav-icon" />
            Certificate
          </div>
        </nav>
        <div className="nav-logout" role="button" onClick={handleLogout}>
          <img src={LogoutDefault} alt="Logout" className="nav-icon" />
          Logout
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <h2>Course List</h2>
        <div className="course-section">
          <h3>Courses</h3>
          <div className="course-grid">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="course-card">
                  <h4>{course.title}</h4>
                  <p>Category: {course.category}</p>
                </div>
              ))
            ) : (
              <p>No courses available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITAdminDashboardForm;
