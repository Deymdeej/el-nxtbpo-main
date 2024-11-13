import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Login from "./login";
import Register from "./Register";

function AuthContainer() {
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false); 


  useEffect(() => {

    if (location.pathname === "/register") {
      setIsSignUp(true);
    } else {
      setIsSignUp(false); 
    }
  }, [location.pathname]);

  const toggleForm = () => {
    setIsSignUp((prevState) => !prevState);
  };

  return (
    <div>
      {isSignUp ? (
        <Register toggleForm={toggleForm} />  
      ) : (
        <Login toggleForm={toggleForm} /> 
      )}
    </div>
  );
}

export default AuthContainer;
