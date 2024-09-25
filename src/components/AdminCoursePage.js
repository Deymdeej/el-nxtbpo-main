import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Firebase setup
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"; // Firestore methods
import { Modal, Button } from "react-bootstrap"; // Import Modal from React Bootstrap
import "./css/AdminCoursePage.css"; // For custom styling

function AdminCoursePage() {
  const [courses, setCourses] = useState([]);
  const [showCourseDetailsModal, setShowCourseDetailsModal] = useState(false); // Course details modal
  const [selectedCourse, setSelectedCourse] = useState(null); // Store the selected course

  // Fetch existing courses from the General, IT, and HR collections in Firestore
  useEffect(() => {
    const fetchCourses = async () => {
      const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses"));
      const itCoursesSnapshot = await getDocs(collection(db, "ITCourses"));
      const hrCoursesSnapshot = await getDocs(collection(db, "HRCourses"));

      const generalCourses = generalCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        category: "General",
        ...doc.data(),
      }));

      const itCourses = itCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        category: "IT",
        ...doc.data(),
      }));

      const hrCourses = hrCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        category: "HR",
        ...doc.data(),
      }));

      // Combine courses from General, IT, and HR collections into one array
      setCourses([...generalCourses, ...itCourses, ...hrCourses]);
    };

    fetchCourses();
  }, []);

  // Show course details in modal
  const handleShowCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseDetailsModal(true);
  };

  const handleCloseCourseDetailsModal = () => setShowCourseDetailsModal(false);

  // Function to delete course from Firestore
  const handleDeleteCourse = async () => {
    if (selectedCourse) {
      // Construct the collection path based on the course category
      let collectionPath = "";
      if (selectedCourse.category === "General") {
        collectionPath = "GeneralCourses";
      } else if (selectedCourse.category === "IT") {
        collectionPath = "ITCourses";
      } else if (selectedCourse.category === "HR") {
        collectionPath = "HRCourses";
      }

      // Ensure collectionPath is valid before attempting to delete
      if (collectionPath) {
        const courseRef = doc(db, collectionPath, selectedCourse.id);

        try {
          await deleteDoc(courseRef);
          setCourses((prevCourses) =>
            prevCourses.filter((course) => course.id !== selectedCourse.id)
          );
          setShowCourseDetailsModal(false); // Close modal after deletion
          alert("Course deleted successfully!");
        } catch (error) {
          console.error("Error deleting course: ", error);
          alert("Failed to delete course.");
        }
      } else {
        console.error("Invalid collection path, cannot delete course.");
      }
    }
  };

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Display existing courses */}
        <div className="col-md-12">
          <h4>All Courses</h4>
          {courses.length === 0 ? (
            <p>No courses available</p>
          ) : (
            <div className="course-grid">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className="course-card"
                  onClick={() => handleShowCourseDetails(course)} // Make the course clickable
                  style={{ cursor: "pointer" }}
                >
                  <div className="course-icon">📘</div> {/* Add an icon */}
                  <h5 className="course-title">
                    {course.courseTitle} ({course.category})
                  </h5>
                  <p className="course-description">{course.courseDescription}</p> {/* Show course description */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for displaying course details */}
      {selectedCourse && (
        <Modal show={showCourseDetailsModal} onHide={handleCloseCourseDetailsModal}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedCourse.courseTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Category:</strong> {selectedCourse.category}
            </p>
            <p>
              <strong>Video Link:</strong> {selectedCourse.videoLink || "No Video"}
            </p>
            <h5>Questions</h5>
            <ul>
              {selectedCourse.questions.map((q, index) => (
                <li key={index}>
                  {q.question} <br />
                  <strong>Choices:</strong> {q.choices.join(", ")} <br />
                  <strong>Correct Answer:</strong> {q.correctAnswer}
                </li>
              ))}
            </ul>
            {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
              <div>
                <h5>Prerequisite Courses</h5>
                <ul>
                  {selectedCourse.prerequisites.map((preReqId) => {
                    const preReqCourse = courses.find((c) => c.id === preReqId);
                    return <li key={preReqId}>{preReqCourse?.courseTitle || "Unknown Course"}</li>;
                  })}
                </ul>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleDeleteCourse}>
              Delete
            </Button>
            <Button variant="secondary" onClick={handleCloseCourseDetailsModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default AdminCoursePage;
