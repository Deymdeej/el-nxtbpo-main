import React, { useState } from 'react';
import BPOLOGO from '../assets/bpo-logo.png';
import CoursePick from '../assets/coursepick.png';
import LogoutPick from '../assets/logoutpick.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import CertDefault from '../assets/certdefault.png';
import CertPick from '../assets/certpick.png';
import TrainingPick from '../assets/trainingpick.png';
import TrainingDefault from '../assets/trainingdefault.png';
import SortFilter from '../assets/sort.png'; // Import filter icon
import './css/EmployeeForm.css';

const HRUser = ({
  handleLogout,
  courses,
  enrolledCourses,
  fullName,
  userType // Added userType to determine whether the user is HR or IT
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedNav, setSelectedNav] = useState('courses'); // Set default navigation to "courses"
  const [selectedCourse, setSelectedCourse] = useState(null); // For handling selected course
  const [isModalOpen, setIsModalOpen] = useState(false); // For handling modal visibility

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Filter available courses based on the search query and selected filter
  const filteredAvailableCourses = (courses || []).filter(course =>
    !enrolledCourses.includes(course.id) &&
    course.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedFilter === 'All' || course.category === selectedFilter) &&
    (course.category === 'HR' || course.category === 'General') // Exclude IT courses
  );

  const handleFilterSelect = (category) => {
    setSelectedFilter(category);
    setDropdownOpen(false); // Close dropdown after selection
  };

  const handleNavClick = (navItem) => {
    setSelectedNav(navItem); // Update selectedNav when clicking a nav item
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  return (
    <div className="hr-dashboard">
      <div className="sidebar-user">
        <div className="header-user">
          <img className="logo" alt="Group" src={BPOLOGO} />
        </div>
        <nav className="nav">
          <div
            className={`nav-item ${selectedNav === 'courses' ? 'active' : ''}`}
            role="button"
            tabIndex="1"
            onClick={() => handleNavClick('courses')}
          >
            <div className="icon-container">
              <img
                className="icon2"
                alt="Courses Icon"
                src={selectedNav === 'courses' ? CoursePick : CourseDefault}
              />
            </div>
            Courses
          </div>

          <div
            className={`nav-item ${selectedNav === 'training' ? 'active' : ''}`}
            role="button"
            tabIndex="2"
            onClick={() => handleNavClick('training')}
          >
            <div className="icon-container">
              <img
                className="icon3"
                alt="Training Icon"
                src={selectedNav === 'training' ? TrainingPick : TrainingDefault}
              />
            </div>
            Training
          </div>

          <div
            className={`nav-item ${selectedNav === 'certificates' ? 'active' : ''}`}
            role="button"
            tabIndex="3"
            onClick={() => handleNavClick('certificates')}
          >
            <div className="icon-container">
              <img
                className="icon4"
                alt="Certificates Icon"
                src={selectedNav === 'certificates' ? CertPick : CertDefault}
              />
            </div>
            Certificates
          </div>
        </nav>
        <div
          className={`nav-logout ${selectedNav === 'logout' ? 'active' : ''}`}
          role="button"
          tabIndex="4"
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
        <h1>Hi, {fullName}</h1>

        {selectedNav === 'courses' && (
          <>
            <div className="search-filter-container">
              <input 
                type="text" 
                placeholder="Search courses title" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-bar"
              />
              <div className="filter-dropdown">
                <button onClick={toggleDropdown} className="filter-button">
                  {selectedFilter === '' ? (
                    <>
                      Filter by:
                      <img src={SortFilter} alt="Sort/Filter Icon" className="filter-icon" />
                    </>
                  ) : (
                    `Filter by: ${selectedFilter}`
                  )}
                </button>
                {dropdownOpen && (
                  <div className="dropdown-content">
                    <div onClick={() => handleFilterSelect('All')}>All</div>
                    <div onClick={() => handleFilterSelect('General')}>General</div>
                    <div onClick={() => handleFilterSelect('HR')}>HR</div>
                  </div>
                )}
              </div>
            </div>
            <div className="course-section">
              <h2>Available Courses</h2>
              <div className="course-container">
                {filteredAvailableCourses.length > 0 ? (
                  filteredAvailableCourses.map((course) => (
                    <div className="course-card" key={course.id} onClick={() => handleCourseClick(course)}>
                      <h3>{course.courseTitle}</h3>
                      <p className="course-description">{course.courseDescription}</p>
                      <div className="category-text">Category</div>
                      <div className="category-label">{course.category}</div>
                    </div>
                  ))
                ) : (
                  <p>No available courses found.</p>
                )}
              </div>
            </div>
          </>
        )}

        {isModalOpen && selectedCourse && (
          <div className="course-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{selectedCourse.courseTitle}</h2>
                <button className="close-button" onClick={() => setIsModalOpen(false)}>X</button>
              </div>

              <div className="modal-body">
                <img src="your-image-url-here" alt="Course visual" className="modal-image" />
                <p>{selectedCourse.courseDescription}</p>
                <div className="course-details">
                  <h4>Prerequisite: <span className="prerequisite">None</span></h4>
                  <h5>Category: <span className="category">{selectedCourse.category}</span></h5>
                </div>
              </div>

              <div className="modal-footer">
                <button className="enroll-button">Enroll Course</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRUser;
