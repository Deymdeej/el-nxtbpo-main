import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'; // Add deleteDoc and doc // Boss Kyle
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
  const [users, setUsers] = useState([]); // State for storing users
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [selectedCategory, setSelectedCategory] = useState('All'); // State for dropdown filter
  const [selectedCourse, setSelectedCourse] = useState(null); // State to store selected course
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const navigate = useNavigate();

  

  // Fetch general courses from Firestore with real-time updates
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

  // Fetch users from Firestore // Boss Kyle Userlist Code 
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'Users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  const handleDeleteUser = async (id) => {
    try {
      await deleteDoc(doc(db, 'Users', id));
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user: ', error);
    }
  };

  const handleUpdateUser = (id) => {
    // Handle update logic here (redirect to update page or open modal)
    alert('Update function for user ' + id);
  };

  // Boss Kyle Userlist Code


  const handleNavClick = (navItem) => {
    setSelectedNav(navItem);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  // **Handle course click to open the modal**
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true); // Open modal when course is clicked
  };

  // **Handle modal close**
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null); // Clear selected course data
  };

  // Helper function to truncate description to 50 words
  const truncateDescription = (description) => {
    const words = description.split(' ');
    return words.length > 50 ? words.slice(0, 50).join(' ') + '...' : description;
  };

  // Filter the courses based on search term and selected category
  const filteredCourses = courses.filter((course) => {
    return (
      (selectedCategory === 'All' || course.category === selectedCategory) &&
      course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });


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


      {/* Boss Kyle Userlist Code */}
      <div className="content">
        {selectedNav === 'userlist' && (
          <div className="userlist-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.department}</td>
                    <td>{user.role}</td>
                    <td>
                      <button className="update-btn" onClick={() => handleUpdateUser(user.id)}>Update</button>
                      <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
     {/* Boss Kyle Userlist Code */}






     <div className="content">
        {selectedNav === 'courses' && (
          <div>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="search-dropdown"
              >
                <option value="All">All</option>
                <option value="General">General</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div className="courses-container">
              {filteredCourses.length === 0 ? (
                <p>No courses available</p>
              ) : (
                filteredCourses.map((course, index) => (
                  <div
                    key={index}
                    className={`course-box ${
                      course.category === 'General'
                        ? 'general-course'
                        : course.category === 'IT'
                        ? 'it-course'
                        : course.category === 'HR'
                        ? 'hr-course'
                        : ''
                    }`}
                    onClick={() => handleCourseClick(course)}
                  >
                    <h3>{course.courseTitle}</h3>
                    <h4>({course.category})</h4>
                    <p>{truncateDescription(course.courseDescription)}</p> {/* Truncate to 50 words */}
                  </div>
                ))
              )}
            </div>
            
          </div>
        )}
      </div>

      {/* Modal Component */}
      {isModalOpen && selectedCourse && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedCourse.courseTitle}</h2>
            <h4>Category: {selectedCourse.category}</h4>
            <h5>{selectedCourse.courseDescription}</h5>
            <p>Number of Employees Enrolled: {selectedCourse.enrolledEmployees || 0}</p>

            <h3>Files:</h3>
            <ul>
              {selectedCourse.files && selectedCourse.files.length > 0 ? (
                selectedCourse.files.map((file, index) => (
                  <li key={index}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.name}
                    </a>
                  </li>
                ))
              ) : (
                <p>No files available.</p>
              )}
            </ul>

            <button className="openmodal"onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      )}
  
    </div>
    
  );
}

export default AdminForm;
