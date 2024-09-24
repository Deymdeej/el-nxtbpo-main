import { signOut } from "firebase/auth";
import { auth } from "../firebase"; // Ensure correct import path
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate(); // Use react-router-dom for navigation

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("User logged out successfully!", {
        position: "top-center",
      });
      navigate("/login"); // Redirect to the login page after logout
    } catch (error) {
      console.error("Logout error:", error.message);
      toast.error("Error logging out. Please try again.", {
        position: "bottom-center",
      });
    }
  };

  return (
    <button onClick={handleLogout} className="btn btn-secondary">
      Log Out
    </button>
  );
}

export default Logout;
