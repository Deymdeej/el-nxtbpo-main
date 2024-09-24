// components/HRUserDashboard.js
import React from 'react';
import { auth } from "../firebase"; // Firebase authentication
import { useNavigate } from 'react-router-dom'; // For navigation

const HRUserDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login"); // Redirect to the login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div>
      <h1>HR User Dashboard</h1>
      <p>Welcome, HR User. View your HR-related tasks here.</p>
      
      {/* Add Logout button */}
      <div style={{ textAlign: 'right', marginTop: '20px' }}>
        <button 
          onClick={handleLogout} 
          style={{
            padding: '10px 20px', 
            backgroundColor: '#d9534f', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default HRUserDashboard;
