// components/ITAdminDashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Import Firebase auth

const ITAdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login"); // Redirect to login page after logging out
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', backgroundColor: '#d9534f', color: '#fff', border: 'none', borderRadius: '5px' }}>
          Logout
        </button>
      </div>

      <h1>IT Admin Dashboard</h1>
      <p>Welcome, IT Admin. Manage IT-related tasks here.</p>
      {/* Add IT-specific management functionality */}
    </div>
  );
};

export default ITAdminDashboard;
