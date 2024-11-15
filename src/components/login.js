import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; // Firebase setup
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore"; // Firestore methods
import LoginForm from "./LoginForm"; // Import the LoginForm component

function Login({ toggleForm }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (email, password, rememberMe) => {
    try {
      // Sign in the user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      toast.success("User logged in successfully", {
        position: "top-center",
      });

      // Fetch the user's data from Firestore
      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userRole = userData.role?.toLowerCase(); // Fetch role (admin/user) and convert to lowercase
        const department = userData.department?.toLowerCase(); // Fetch department and convert to lowercase

        // Log role and department for debugging
        console.log("User role:", userRole);
        console.log("User department:", department);

        // Check role and navigate accordingly
        if (userRole === "admin") {
          if (!department) {
            
            navigate("/admin"); // Head Admin navigation
          } else if (department === "it") {
            navigate("/it-admin-courses"); // IT Admin navigation
          } else if (department === "hr") {
            navigate("/hr-admin-dashboard"); // HR Admin navigation
          } else {
            toast.error("Invalid department, please contact support", {
              position: "bottom-center",
            });
          }
        } else if (userRole === "user") {
          if (department === "it") {
            navigate("/it-user-dashboard"); // IT User Dashboard navigation
          } else if (department === "hr") {
            navigate("/hr-user-dashboard"); // HR User Dashboard navigation
          } else {
            toast.error("Invalid department, please contact support", {
              position: "bottom-center",
            });
          }
        } else {
          toast.error("Invalid role, please contact support", {
            position: "bottom-center",
          });
        }
      } else {
        toast.error("User data not found, please contact support", {
          position: "bottom-center",
        });
      }

      // Handle Remember Me functionality
      if (rememberMe) {
        localStorage.setItem('email', email);
        localStorage.setItem('password', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }

    } catch (error) {
      console.error("Login error:", error);
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email.", {
            position: "bottom-center",
          });
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password. Please try again.", {
            position: "bottom-center",
          });
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format.", {
            position: "bottom-center",
          });
          break;
        case "auth/too-many-requests":
          toast.error("Too many attempts. Please try again later.", {
            position: "bottom-center",
          });
          break;
        default:
          toast.error("Login failed. Please try again.", {
            position: "bottom-center",
          });
      }
    }
  };

  return (
    <LoginForm
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      rememberMe={rememberMe}
      setRememberMe={setRememberMe}
      handleSubmit={handleSubmit}
      toggleForm={toggleForm}
    />
  );
}

export default Login;
