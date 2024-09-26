import React, { useState } from 'react';
import './css/AdminForm.css';
import BPOLOGO from '../assets/bpo-logo.png';

// Grayed Icons (for inactive nav items)
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';

// Black Icons (for active nav items)
import UserPick from '../assets/userpick.png';
import CoursePick from '../assets/coursepick.png';
import LogoutPick from '../assets/logoutpick.png';

function AdminForm() {
  const [selectedNav, setSelectedNav] = useState('dashboard'); // default selected nav item

  const handleNavClick = (navItem) => {
    setSelectedNav(navItem); // Update selected nav item
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
                src={selectedNav === 'userlist' ? UserPick : UserDefault} // Conditionally render icons
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
                src={selectedNav === 'courses' ? CoursePick : CourseDefault} // Conditionally render icons
              />
            </div>
            Courses
          </div>
        </nav>
        <div
          className={`nav-logout ${selectedNav === 'logout' ? 'active' : ''}`}
          role="button"
          tabIndex="3"
          onClick={() => handleNavClick('logout')}
        >
          <div className="icon-container">
            <img
              className="icon4"
              alt="Logout Icon"
              src={selectedNav === 'logout' ? LogoutPick : LogoutDefault} // Conditionally render icons
            />
          </div>
          Logout
        </div>
        <table class="table-fixed">
        <thead>
              <tr>
              <th>Song</th>
            <th>Artist</th>
              <th>Year</th>
                </tr>
             </thead>
          <tbody>
              <tr>
              <td>The Sliding Mr. Bones (Next Stop, Pottersville)</td>
              <td>Malcolm Lockyer</td>
              <td>1961</td>
          </tr>
         <tr>
              <td>Witchy Woman</td>
              <td>The Eagles</td>
              <td>1972</td>
        </tr>
          <tr>
              <td>Shining Star</td>
              <td>Earth, Wind, and Fire</td>
              <td>1975</td>
          </tr>
          </tbody>
          </table>
    </div>
    </div>
  );
}

export default AdminForm;
