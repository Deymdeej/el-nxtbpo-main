import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; // Make sure auth is imported from Firebase
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'; 
import './css/AdminForm.css';
import BPOLOGO from '../assets/bpo-logo.png';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importing icons

import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';

import UserPick from '../assets/userpick.png';
import CoursePick from '../assets/coursepick.png';
import LogoutPick from '../assets/logoutpick.png';

import { FaBars } from 'react-icons/fa'; // Import hamburger menu icon

function AdminForm() {
  const [selectedNav, setSelectedNav] = useState('dashboard'); // Default selected nav item
  const [courses, setCourses] = useState([]); // State for storing fetched courses
  const [users, setUsers] = useState([]); // State for storing users
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [selectedDepartment, setSelectedDepartment] = useState('All'); // State for department filter
  const [selectedRole, setSelectedRole] = useState('All'); // State for role filter
  const [currentUserId, setCurrentUserId] = useState(null); // State for logged-in user ID
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Manage sidebar visibility
  const navigate = useNavigate();

  // Fetch logged-in user info from Firebase Auth
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid); // Store the logged-in user's ID
      } else {
        navigate('/login'); // Redirect to login if not logged in
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // Fetch users from Firestore
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

  // Fetch courses from Firestore
  useEffect(() => {
    const unsubscribeGeneralCourses = onSnapshot(collection(db, 'GeneralCourses'), (snapshot) => {
      const generalCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: 'General',
        ...doc.data(),
      }));
      setCourses((prevCourses) => [...prevCourses, ...generalCourses]);
    });

    const unsubscribeITCourses = onSnapshot(collection(db, 'ITCourses'), (snapshot) => {
      const itCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: 'IT',
        ...doc.data(),
      }));
      setCourses((prevCourses) => [...prevCourses, ...itCourses]);
    });

    const unsubscribeHRCourses = onSnapshot(collection(db, 'HRCourses'), (snapshot) => {
      const hrCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: 'HR',
        ...doc.data(),
      }));
      setCourses((prevCourses) => [...prevCourses, ...hrCourses]);
    });

    return () => {
      unsubscribeGeneralCourses();
      unsubscribeITCourses();
      unsubscribeHRCourses();
    };
  }, []);

  // Function to delete a user
  const handleDeleteUser = async (id) => {
    try {
      await deleteDoc(doc(db, 'Users', id));
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user: ', error);
    }
  };

  // Filter the users based on search term, department, role, and exclude the logged-in user
  const filteredUsers = users
    .filter((user) => user.id !== currentUserId) // Exclude logged-in user
    .filter((user) => {
      const matchesDepartment = selectedDepartment === 'All' || user.department === selectedDepartment;
      const matchesRole = selectedRole === 'All' || user.role === selectedRole;
      const matchesSearchTerm = user.fullName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDepartment && matchesRole && matchesSearchTerm;
    });

  // Filter the courses based on search term and selected category (department)
  const filteredCourses = courses.filter((course) => {
    return (
      (selectedDepartment === 'All' || course.category === selectedDepartment) &&
      course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Toggle the sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavClick = (navItem) => {
    setSelectedNav(navItem);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div>
      {/* Hamburger menu icon for smaller screens */}
      <div className="hamburger-icon" onClick={toggleSidebar}>
        <FaBars />
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="header">
          <img className="logo" alt="Group" src={BPOLOGO} />
        </div>
        <nav className="nav">
          <div
            className={`nav-item ${selectedNav === 'userlist' ? 'active' : ''}`}
            role="button"
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

      {/* User List Section */}
      <div className="content">
        {selectedNav === 'userlist' && (
          <div className="userlist-container">
            {/* Search and Filter Section */}
            <div className="search-container">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // Update search term on input
                className="search-input"
              />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)} // Filter by department
                className="search-dropdown"
              >
                <option value="All">All Departments</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)} // Filter by role
                className="search-dropdown"
              >
                <option value="All">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            {/* User List Table */}
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
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.department}</td>
                    <td>{user.role}</td>
                    <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <FaEdit
                        className="icon update-icon"
                        style={{ cursor: 'pointer', marginRight: '10px' }}
                      />
                      <FaTrashAlt
                        className="icon delete-icon"
                        onClick={() => handleDeleteUser(user.id)}
                        style={{ cursor: 'pointer', color: 'red' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Courses Section */}
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
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)} // Filter by department (General, IT, HR)
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
                  >
                    <h3>{course.courseTitle}</h3>
                    <h4>({course.category})</h4>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminForm;
