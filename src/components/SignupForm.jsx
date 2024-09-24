import React from "react";
import "./css/SignupForm.css"; // Ensure this points to your CSS file
import group3 from "../assets/group-3.png"; // Ensure the image is properly imported
import group2 from "../assets/group-2.png";

function SignupForm({ fname, setFname, email, setEmail, password, setPassword, department, setDepartment, handleRegister, toggleForm }) {
  return (
    <div className="sign-up">
      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          <div className="text-wrapper">Get Started</div>
          <p className="div">Please enter your details to continue.</p>
          
          <form onSubmit={handleRegister}>
            {/* First Name */}
            <div className="text-wrapper-2">Full name</div>
            <input
              type="text"
              className="fnamefield"
              placeholder="First name"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              required
            />

            {/* Email */}
            <div className="text-wrapper-6">Email</div>
            <input
              type="email"
              className="emailfield"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password */}
            <div className="text-wrapper-9">Password</div>
            <input
              type="password"
              className="passwordfield"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Role (Department) */}
            <div className="text-wrapper-8">Department</div>
            <select
              className="deptfield"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="IT">IT</option>
              <option value="HR">HR</option>
            </select>

            {/* Submit Button */}
            <button type="submit" className="text-wrapper-10">Sign Up</button>
          </form>

          {/* Already registered? Link */}
          <p className="div-2"> Already have an account?</p> 
          
          <button type="button"className="div-4" onClick={toggleForm}>
          Sign in
          </button>

          <img className="group" alt="Group" src={group2} />
          <img className="img" alt="Group" src={group3} />
        </div>
      </div>
    </div>
  );
}

export default SignupForm;
