import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // Firebase setup
import { collection, getDocs, setDoc, doc } from "firebase/firestore"; // Firestore methods
import Calendar from "react-calendar"; // Calendar component
import 'react-calendar/dist/Calendar.css'; // Import calendar styles
import { Modal, Button, Form } from "react-bootstrap"; // Import modal for popup and Form components

function AdminResultsPage() {
  const [quizResults, setQuizResults] = useState([]);
  const [schedules, setSchedules] = useState({}); // Store user schedules
  const [userNames, setUserNames] = useState({}); // Store user names
  const [showModal, setShowModal] = useState(false); // Control modal visibility
  const [selectedUser, setSelectedUser] = useState(null); // Store selected user
  const [scheduleDate, setScheduleDate] = useState(null); // Store selected schedule date (initially null)
  const [scheduleTime, setScheduleTime] = useState("12:00"); // Store selected schedule time (default to 12:00)
  const [scheduleDetails, setScheduleDetails] = useState(""); // Store additional schedule details

  // Fetch quiz results and user names from Firestore
  useEffect(() => {
    const fetchQuizResults = async () => {
      const resultsSnapshot = await getDocs(collection(db, "QuizResults"));
      const resultsList = resultsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuizResults(resultsList);
    };

    const fetchSchedules = async () => {
      const scheduleSnapshot = await getDocs(collection(db, "UserSchedules"));
      const scheduleData = {};
      scheduleSnapshot.docs.forEach((doc) => {
        scheduleData[doc.id] = doc.data().schedule;
      });
      setSchedules(scheduleData); // Store all schedules with userId as key
    };

    const fetchUserNames = async () => {
      const usersSnapshot = await getDocs(collection(db, "Users")); // Assuming "Users" collection
      const userData = {};
      usersSnapshot.docs.forEach((doc) => {
        const user = doc.data();
        // Concatenate first and last name
        const fullName = `${user.firstName} ${user.lastName}`;
        userData[doc.id] = fullName; // Store full name
      });
      setUserNames(userData); // Store all user names with userId as key
    };

    fetchQuizResults();
    fetchSchedules(); // Fetch schedules on component load
    fetchUserNames(); // Fetch user names
  }, []);

  // Open modal and set the selected user for scheduling
  const handleScheduleClick = (userId) => {
    setSelectedUser(userId); // Set the selected user
    setShowModal(true); // Show the modal
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setScheduleDate(null); // Reset schedule date when closing modal
    setScheduleDetails(""); // Reset additional details when closing modal
  };

  // Handle schedule date change
  const handleDateChange = (date) => {
    setScheduleDate(date); // Update selected date
  };

  // Handle schedule time change
  const handleTimeChange = (event) => {
    setScheduleTime(event.target.value); // Update selected time
  };

  // Handle schedule details change
  const handleDetailsChange = (event) => {
    setScheduleDetails(event.target.value); // Update additional details
  };

  // Save the schedule to Firestore
  const handleSaveSchedule = async () => {
    if (!selectedUser || !scheduleDate || !scheduleTime) return;

    try {
      // Combine the date and time into a single Date object
      const [hours, minutes] = scheduleTime.split(":");
      const scheduleDateTime = new Date(scheduleDate);
      scheduleDateTime.setHours(hours, minutes);

      const scheduleData = {
        userId: selectedUser,
        schedule: scheduleDateTime.toISOString(), // Store as ISO string for consistency
        details: scheduleDetails, // Add the additional schedule details
      };

      await setDoc(doc(db, "UserSchedules", selectedUser), scheduleData); // Save schedule
      alert("Schedule saved successfully!");

      // Update schedule state to reflect new schedule
      setSchedules((prevSchedules) => ({
        ...prevSchedules,
        [selectedUser]: scheduleDateTime,
      }));

      setShowModal(false); // Close modal after saving
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule.");
    }
  };

  return (
    <div className="admin-results-page container mt-5">
      <h3>Quiz Results</h3>
      {quizResults.length === 0 ? (
        <p>No quiz results available</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Name</th> {/* Changed header from Course Title to Name */}
              <th>Score</th>
              <th>Passed</th>
              <th>Attempts</th>
              <th>Timestamp</th>
              <th>Schedule</th> {/* Add Schedule header */}
            </tr>
          </thead>
          <tbody>
            {quizResults.map((result) => (
              <tr key={result.id}>
                <td>{userNames[result.userId] || "Unknown User"}</td> {/* Display full name */}
                <td>{result.score}%</td>
                <td>{result.passed ? "Yes" : "No"}</td>
                <td>{result.attempts}</td>
                <td>{new Date(result.timestamp.seconds * 1000).toLocaleString()}</td>
                <td>
                  {/* Show check mark if already scheduled, otherwise show Set Schedule button */}
                  {schedules[result.userId] ? (
                    <span>✓ {new Date(schedules[result.userId]).toLocaleString()}</span>
                  ) : (
                    <Button variant="primary" onClick={() => handleScheduleClick(result.userId)}>
                      Set Schedule
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for scheduling */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Set Schedule for User: {userNames[selectedUser]}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Select a date:</h5>
          <Calendar value={scheduleDate} onChange={handleDateChange} />
          
          {/* Show time input field only after selecting a date */}
          {scheduleDate && (
            <>
              <h5 className="mt-3">Select a time:</h5>
              <Form.Control
                type="time"
                value={scheduleTime}
                onChange={handleTimeChange}
              />
              <h5 className="mt-3">Additional Details:</h5>
              <Form.Control
                as="textarea"
                rows={3}
                value={scheduleDetails}
                onChange={handleDetailsChange}
                placeholder="Enter meeting details (location, purpose, etc.)"
              />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveSchedule} disabled={!scheduleDate}>
            Save Schedule
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminResultsPage;
