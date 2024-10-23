import React, { useState, useEffect } from "react";
import "./css/LoginForm.css";
import group1 from '../assets/group-1.png';
import group2 from '../assets/group-2.png';
import eyeIcon from '../assets/eye-icon.png';       
import eyeSlashIcon from '../assets/eye-slash.png'; 

function LoginForm({ email, setEmail, password, setPassword, handleSubmit, toggleForm }) {
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem('email') || '';
        const storedPassword = localStorage.getItem('password') || '';
        const storedRememberMe = localStorage.getItem('rememberMe') === 'true';

        if (storedRememberMe) {
            setEmail(storedEmail);
            setPassword(storedPassword);
            setRememberMe(storedRememberMe);
        }
    }, [setEmail, setPassword]);

    const handleCheckboxChange = () => {
        setRememberMe((prev) => !prev);
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        handleSubmit(email, password, rememberMe);

        if (rememberMe) {
            localStorage.setItem('email', email);
            localStorage.setItem('password', password);
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('email');
            localStorage.removeItem('password');
            localStorage.removeItem('rememberMe');
        }
    };

    return (
        <div className="sign-in">
            <div className="overlap-group-wrapper">
                <div className="form-container">
                    <div className="logo-container">
                        <img src={group2} alt="Your Logo" className="form-logo" />
                    </div>

                    <div className="text-wrapper">Welcome</div>
                    <p className="div">Please enter your details to continue.</p>

                    <form onSubmit={handleSubmitForm}>
                        <div className="text-wrapper-2">Username</div>
                        <input 
                            type="text" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="usernamefield"
                            placeholder="" 
                        />

                        <div className="text-wrapper-3">Password</div>
                        <div className="input-container">
                            <input 
                                type={showPassword ? "text" : "password"}  
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="passwordfield"
                                placeholder=""
                            />
                            <span 
                                className="eye-icon"
                                onClick={() => setShowPassword(!showPassword)}>
                                <img 
                                    src={showPassword ? eyeSlashIcon : eyeIcon}  
                                    alt="Toggle Password Visibility" 
                                    className="eye-icon-image"
                                />
                            </span>
                        </div>

                        <div className="remember-me-container">
                            <input 
                                type="checkbox" 
                                checked={rememberMe} 
                                onChange={handleCheckboxChange}
                                id="rememberMe" 
                            />
                            <label htmlFor="rememberMe">Remember me</label>
                        </div>

                        <button type="submit" className="text-wrapper-7">Sign In</button>
                    </form>

                    <div className="form-footer">
                        <p className="div-2">Don't have an account?</p>
                        <button type="button" className="div-3" onClick={toggleForm}>Create one</button>
                    </div>
                </div>
                
                <div className="img-container">
                    <img className="img" alt="Group" src={group1} />
                </div>
            </div>
        </div>
    );
}

export default LoginForm;
