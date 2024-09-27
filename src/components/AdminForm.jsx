import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore'; // Use onSnapshot for real-time updates
import './css/AdminForm.css';
import BPOLOGO from '../assets/bpo-logo.png';

import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';

import UserPick from '../assets/userpick.png';
import CoursePick from '../assets/coursepick.png';
import LogoutPick from '../assets/logoutpick.png';

function AdminForm() {
  const [selectedNav, setSelectedNav] = useState('dashboard'); // Default selected nav item
  const [courses, setCourses] = useState([]); // State for storing fetched courses
  const navigate = useNavigate();

  // Fetch courses from Firestore with real-time updates
  useEffect(() => {
    const unsubscribeGeneralCourses = onSnapshot(collection(db, 'GeneralCourses'), (snapshot) => {
      const generalCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: 'General',
        ...doc.data(),
      }));
      setCourses((prevCourses) => {
        const otherCourses = prevCourses.filter((course) => course.category !== 'General');
        return [...otherCourses, ...generalCourses];
      });
    });

    const unsubscribeITCourses = onSnapshot(collection(db, 'ITCourses'), (snapshot) => {
      const itCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: 'IT',
        ...doc.data(),
      }));
      setCourses((prevCourses) => {
        const otherCourses = prevCourses.filter((course) => course.category !== 'IT');
        return [...otherCourses, ...itCourses];
      });
    });

    const unsubscribeHRCourses = onSnapshot(collection(db, 'HRCourses'), (snapshot) => {
      const hrCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: 'HR',
        ...doc.data(),
      }));
      setCourses((prevCourses) => {
        const otherCourses = prevCourses.filter((course) => course.category !== 'HR');
        return [...otherCourses, ...hrCourses];
      });
    });

    // Clean up Firestore listeners when the component is unmounted
    return () => {
      unsubscribeGeneralCourses();
      unsubscribeITCourses();
      unsubscribeHRCourses();
    };
  }, []);

  const handleNavClick = (navItem) => {
    setSelectedNav(navItem);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div>
      <div className="sidebar">
        <div className="header">
          <img className="logo" alt="Group" src={BPOLOGO} />
        </div>
        <nav className="nav">
          <div
            className={`nav-item ${selectedNav === 'userlist' ? 'active' : ''}`}
            role="button"
            tabIndex="1"
            onClick={() => handleNavClick('userlist')}
          >
            <div className="icon-container">
              <img
                className="icon2"
                alt="User List Icon"
                src={selectedNav === 'userlist' ? UserPick : UserDefault}
              />
            </div>
            UserList
          </div>
          <div
            className={`nav-item ${selectedNav === 'courses' ? 'active' : ''}`}
            role="button"
            tabIndex="2"
            onClick={() => handleNavClick('courses')}
          >
            <div className="icon-container">
              <img
                className="icon3"
                alt="Courses Icon"
                src={selectedNav === 'courses' ? CoursePick : CourseDefault}
              />
            </div>
            Courses
          </div>
        </nav>
        <div
          className={`nav-logout ${selectedNav === 'logout' ? 'active' : ''}`}
          role="button"
          tabIndex="3"
          onClick={handleLogout}
        >
          <div className="icon-container">
            <img
              className="icon4"
              alt="Logout Icon"
              src={selectedNav === 'logout' ? LogoutPick : LogoutDefault}
            />
          </div>
          Logout
        </div>
      </div>

      <div className="content">
        {selectedNav === 'courses' && (
          <div className="courses-container">
            {courses.length === 0 ? (
              <p>No courses available</p>
            ) : (
              courses.map((course, index) => (
                <div key={index} className="course-box">
                  <h3>{course.courseTitle} ({course.category})</h3>
                  <p>{course.courseDescription}</p>
                </div>
              ))
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}

export default AdminForm;
