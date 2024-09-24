import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase"; // Ensure db and auth are imported
import { useNavigate, Link } from "react-router-dom"; // For redirection and linking
import { collection, getDocs } from "firebase/firestore"; // Firestore methods
import "./css/UserPage.css"; // Custom CSS for styling

function UserPage() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null); // Store user's schedule
  const [scheduleDetails, setScheduleDetails] = useState(""); // Store schedule details
  const [userId, setUserId] = useState(null); // Store the current user's ID

  // Fetch the current user's ID and their schedule
  useEffect(() => {
    const fetchUserSchedule = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUserId(currentUser.uid);
        try {
          // Fetch the user's schedule from Firestore
          const scheduleSnapshot = await getDocs(collection(db, "UserSchedules"));
          const userSchedule = scheduleSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .find((sched) => sched.userId === currentUser.uid);

          if (userSchedule) {
            let scheduleDate;

            // Check if schedule is stored as a Firestore timestamp
            if (userSchedule.schedule && userSchedule.schedule.seconds) {
              scheduleDate = new Date(userSchedule.schedule.seconds * 1000); // Convert Firebase Timestamp to Date
            } else {
              scheduleDate = new Date(userSchedule.schedule); // In case it's a standard date string
            }

            setSchedule(scheduleDate); // Store the user's schedule
            setScheduleDetails(userSchedule.details || ""); // Store schedule details if available
          }
        } catch (error) {
          console.error("Error fetching schedule:", error);
        }
      } else {
        navigate("/login");
      }
    };

    fetchUserSchedule();
  }, [navigate]);

  // Logout function
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="user-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>User Panel</h2>
        <ul>
          <li>
            {/* Dashboard link to AdminPage */}
            <Link to="/userpage">Dashboard</Link>
          </li>
          <li>
            <a href="#profile">Profile</a>
          </li>
        
          <li>
            {/* New link to View Quiz page */}
            <Link to="/usercoursepage">Course</Link>
          </li>
          <li>
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h2>Welcome to the User Panel</h2>

        {/* Notify the user if they have a scheduled meeting */}
        {schedule ? (
          <div className="notification">
            <p>
              <strong>Meeting Scheduled:</strong> You have a scheduled meeting on{" "}
              <span>
                {schedule.toLocaleDateString("en-US")}{" "}
                {schedule.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>.
            </p>
            {scheduleDetails && (
              <p>
                <strong>Details:</strong> {scheduleDetails}
              </p>
            )}
          </div>
        ) : (
          <p>You currently have no scheduled meetings.</p>
        )}

        <p>Explore the course content or check your profile for updates.</p>
      </div>
    </div>
  );
}

export default UserPage;
