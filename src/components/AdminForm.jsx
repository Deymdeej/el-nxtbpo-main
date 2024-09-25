import React from 'react';
import "./css/AdminForm.css"
import BPOLOGO from "../assets/bpo-logo.png";


function AdminForm({ handleLogout, totalCourses, date, onChange, courses, users, handleRoleChange }) {
  return (
    <div>
      <div className="sidebar">
        <div className="header">
        <img className="logo" alt="Group" src={BPOLOGO} />
        </div>
        <nav className="nav">
          <div className="nav-item" role="button" tabindex="0">
            <div className="icon-container">
            </div>Dashboard
          </div>
          <div className="nav-item" role="button" tabindex="0">
            <div className="icon-container">
            </div>UserList
          </div>
          <div className="nav-item" role="button" tabindex="0">
            <div className="icon-container">
            </div>Courses
            </div>
          </nav>
      </div>
      <button type="submit" className="logout">Log Out</button>
    </div>
  );
}

export default AdminForm;
