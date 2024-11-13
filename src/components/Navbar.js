import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; // Import Firebase auth

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Home</Link>
      </div>
      <ul className="navbar-links">
        {/* Show these links only if the user is logged in */}
        {user ? (
          <>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/profile">Profile</Link>
            </li>
            <li>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
