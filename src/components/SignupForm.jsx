/* SignupForm.jsx */
import React from "react";
import "./css/SignupForm.css"; // Ensure this points to your CSS file
import group3 from "../assets/group-3.png"; // Ensure the image is properly imported
import group2 from "../assets/group-2.png";
function SignupForm({ fname, setFname, email, setEmail, password, setPassword, department, setDepartment, handleRegister, toggleForm }) {
  return (
    <div className="sign-up">
      <div className="overlap-group-wrapper">
        {/* Form container */}
        <div className="form-container">
          <div className="form-content">
            <div className="text-wrapper">Get Started</div>
            <p className="div">Please enter your details to continue.</p>
            
            <form onSubmit={handleRegister}>
  {/* First Name */}
  <div className="input-group">
    <label className="input-label" htmlFor="fname">Full name</label>
    <input
      id="fname"
      type="text"
      className="fnamefield"
      placeholder="First name"
      value={fname}
      onChange={(e) => setFname(e.target.value)}
      required
    />
  </div>

  {/* Email */}
  <div className="input-group">
    <label className="input-label" htmlFor="email">Email</label>
    <input
      id="email"
      type="email"
      className="emailfield"
      placeholder="Enter email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
  </div>

  {/* Password */}
  <div className="input-group">
    <label className="input-label" htmlFor="password">Password</label>
    <input
      id="password"
      type="password"
      className="passwordfield"
      placeholder="Enter password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />
  </div>

  {/* Department */}
  <div className="input-group">
    <label className="input-label" htmlFor="department">Department</label>
    <select
      id="department"
      className="deptfield"
      value={department}
      onChange={(e) => setDepartment(e.target.value)}
      required
    >
      <option value="IT">IT</option>
      <option value="HR">HR</option>
    </select>
  </div>

  {/* Submit Button */}
  <button type="submit" className="text-wrapper-10"  >Sign Up</button>
</form>


            {/* Already registered? Link */}
            <p className="div-2"> Already have an account?</p> 
            <button type="button" className="div-4" onClick={toggleForm}>Sign in</button>
          </div>
        </div>

        {/* Image container */}
        <div className="image-container">
          <img className="img" alt="Group" src={group3} />
        </div>
      </div>
    </div>
  );
}




export default SignupForm;
