import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../firebase"; // Ensure correct path
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import SignupForm from "./SignupForm"; // Import SignupForm component
import { useNavigate } from "react-router-dom";

function Register({ toggleForm }) {
  // State for registration fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [role, setRole] = useState("user"); // Default role is user
  const [department, setDepartment] = useState("IT"); // Default department is IT
  const navigate = useNavigate();

  // Handler for the registration process
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save the user data in Firestore (without storing the password)
      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        fullName: fname,
        role: role, // Save the selected role
        department: department, // Save the selected department
        userId: user.uid, // Store the userId for reference
      });

      toast.success("Registration successful!", {
        position: "top-center",
      });

      // Redirect to login page after successful registration
      navigate("/loginpage");
      
    } catch (error) {
      toast.error(error.message, {
        position: "bottom-center",
      });
      console.error("Error during registration:", error.message);
    }
  };

  // Render the SignupForm with necessary props
  return (
    <SignupForm
      fname={fname}
      setFname={setFname}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      role={role} // Pass role state
      setRole={setRole} // Handle role changes
      department={department}
      setDepartment={setDepartment}
      handleRegister={handleRegister} // Pass the handler for form submission
      toggleForm={toggleForm}
    />
  );
}

export default Register;
