import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminPage from "./components/AdminForm";
import UserPage from "./components/UserPage";
import ITAdminCoursePage1 from "./components/ITAdminCoursePage1";
import UserCoursePage from "./components/UserCoursePage";
import AdminResultsPage from "./components/AdminResultsPage";
import HRAdminDashboard from "./components/HRAdminDashboard";
import HRUserDashboard from "./components/HRUserDashboard";

import ITUserDashboard from "./components/ITUserDashboard";
import ITAdminTrainingDashboard from "./components/ITAdminTrainingDashboard";
import ITUserTraining from "./components/ITUserTraining"; // Fix the import path
import ITAdminCertificateDashboard from "./components/ITAdminCertificateDashboard"; // Import IT Admin Certificate Dashboard
import AuthContainer from "./components/AuthContainer";  
import { ToastContainer, toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Spinner from "react-bootstrap/Spinner";
import ITUserCertificate from "./components/ITUserCertificate";
import AdminSuperCourseForm1 from "./components/AdminSuperCourse";

import AdminCoursePage from "./components/AdminCoursePage"
 
function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [department, setDepartment] = useState(null); // Track user's department
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        try {
          // Fetch the user's role and department from Firestore
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
 
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setRole(userData.role); // Set the user's role (admin/user)
            setDepartment(userData.department); // Set the user's department (HR, IT)
          } else {
            toast.error("User data not found. Please contact support.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to fetch user data. Please try again.");
        }
      } else {
        setUser(null); // Ensure user is null if not authenticated
      }
      setLoading(false); // Stop loading after user and role are fetched
    });
 
    return () => unsubscribe();
  }, []);
 
  if (loading) {
    return (
<div className="loading-screen">
<Spinner animation="border" variant="primary" />
<p>Loading...</p>
</div>
    );
  }
 
  return (
<Router>
<div className="App">
<div className="auth-wrapper">
<div className="auth-inner">
<Routes>
              {/* Default route that checks user authentication */}
<Route
                path="/"
                element={
                  user ? (
                    role === "admin" ? (
                      department === "HR" ? (
<Navigate to="/hr-admin-dashboard" />
                      ) : (
<Navigate to="/it-admin-courses" />
                      )
                    ) : department === "HR" ? (
<Navigate to="/hr-user-dashboard" />
                    ) : department === "IT" ? (
<Navigate to="/it-user-dashboard" />
                    ) : (
<Navigate to="/login" />
                    )
                  ) : (
<Navigate to="/login" />  // Redirect to login if not authenticated
                  )
                }
              />
 
              {/* Use AuthContainer to handle login/signup toggling */}
<Route path="/login" element={<AuthContainer />} />
<Route path="/register" element={<AuthContainer />} />
 
              {/* HR Admin and User Routes */}
<Route
                path="/hr-admin-dashboard"
                element={user && role === "admin" && department === "HR" ? <HRAdminDashboard /> : <Navigate to="/login" />}
              />
<Route
                path="/hr-user-dashboard"
                element={user && role === "user" && department === "HR" ? <HRUserDashboard /> : <Navigate to="/login" />}
              />
 
              {/* IT Admin and User Routes */}

<Route
                path="/it-user-dashboard"
                element={user && role === "user" && department === "IT" ? <ITUserDashboard /> : <Navigate to="/login" />}
              />
 
              {/* Add ITAdminCoursePage1 Route for IT Admin */}
<Route
                path="/it-admin-courses"
                element={user && role === "admin" && department === "IT" ? <ITAdminCoursePage1 /> : <Navigate to="/login" />}
              />
 
              {/* Add ITAdminTrainingDashboard Route for IT Admin */}
<Route
                path="/it-admin-training"
                element={user && role === "admin" && department === "IT" ? <ITAdminTrainingDashboard /> : <Navigate to="/login" />}
              />
 
              {/* Add ITUserTrainingDashboard Route for IT Users */}
<Route
                path="/it-user-training"
                element={user && role === "user" && department === "IT" ? <ITUserTraining /> : <Navigate to="/login" />}
              />
              <Route
                path="/it-user-certificate"
                element={user && role === "user" && department === "IT" ? <ITUserCertificate /> : <Navigate to="/login" />}
              />
 
              {/* Add ITAdminCertificateDashboard Route for IT Admin */}
<Route
                path="/it-admin-certificates"
                element={user && role === "admin" && department === "IT" ? <ITAdminCertificateDashboard /> : <Navigate to="/login" />}
              />
 
              {/* Admin Routes */}
<Route
                path="/admin"
                element={user && role === "admin" ? <AdminPage /> : <Navigate to="/login" />}
              />
<Route
                path="/adminSuperCourse"
                element={user && role === "admin" ? <AdminSuperCourseForm1 /> : <Navigate to="/login" />}
              />
<Route
                path="/ADMINCOURSE"
                element={user && role === "admin" ? <AdminCoursePage /> : <Navigate to="/login" />}
              />
<Route
                path="/adminresults"
                element={user && role === "admin" ? <AdminResultsPage /> : <Navigate to="/login" />}
              />
 
              {/* User Routes */}
<Route
                path="/user"
                element={user && role === "user" ? <UserPage /> : <Navigate to="/login" />}
              />
<Route
                path="/usercoursepage"
                element={user && role === "user" ? <UserCoursePage /> : <Navigate to="/login" />}
              />
 
              {/* Catch-all route to redirect unauthorized access to login */}
<Route path="*" element={<Navigate to="/login" />} />
</Routes>
<ToastContainer />
</div>
</div>
</div>
</Router>
  );
}
 
export default App;