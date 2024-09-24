import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Firebase setup
import { collection, addDoc, getDocs } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify"; // For feedback
import { Modal, Button } from "react-bootstrap"; // Import Modal from React Bootstrap
import "./css/AdminCoursePage.css"; // For custom styling

function AdminCoursePage() {
  const [courses, setCourses] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [prerequisites, setPrerequisites] = useState([]); // Store selected prerequisite courses
  const [questions, setQuestions] = useState([
    { question: "", choices: ["", "", "", ""], correctAnswer: "" },
  ]);
  const [firstCourseId, setFirstCourseId] = useState(null); // Store the first course ID
  const [showModal, setShowModal] = useState(false); // Modal visibility control
  const [showCourseDetailsModal, setShowCourseDetailsModal] = useState(false); // Course details modal
  const [selectedCourse, setSelectedCourse] = useState(null); // Store the selected course

  // Fetch existing courses from the database
  useEffect(() => {
    const fetchCourses = async () => {
      const courseSnapshot = await getDocs(collection(db, "Courses"));
      const courseList = courseSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(courseList);

      // Automatically set the first course's ID as a default prerequisite
      if (courseList.length > 0) {
        setFirstCourseId(courseList[0].id); // Set first course ID
      }
    };

    fetchCourses();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
  };

  const handleChangeQuestion = (index, event) => {
    const { name, value } = event.target;
    const newQuestions = [...questions];
    newQuestions[index][name] = value;
    setQuestions(newQuestions);
  };

  const handleChangeChoice = (qIndex, cIndex, event) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices[cIndex] = event.target.value;
    setQuestions(newQuestions);
  };

  const handlePrerequisiteChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setPrerequisites(selectedOptions); // Update selected prerequisites
  };

  const handleSubmit = async () => {
    try {
      // Add first course as prerequisite if no prerequisite is selected
      const coursePrerequisites = prerequisites.length === 0 && firstCourseId
        ? [firstCourseId]  // Set first course as prerequisite if none selected
        : prerequisites;

      await addDoc(collection(db, "Courses"), {
        courseTitle,
        courseDescription,
        videoLink,
        questions,
        prerequisites: coursePrerequisites, // Save prerequisites as part of the course
      });
      setCourseTitle("");
      setCourseDescription("");
      setVideoLink("");
      setQuestions([{ question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
      setPrerequisites([]); // Reset prerequisites after submission
      toast.success("Course added successfully!");

      // Fetch courses again after adding a new course
      const courseSnapshot = await getDocs(collection(db, "Courses"));
      const courseList = courseSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(courseList);

      setShowModal(false); // Close modal after adding course
    } catch (error) {
      toast.error("Error adding course: " + error.message);
    }
  };

  // Show course details in modal
  const handleShowCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseDetailsModal(true);
  };

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const handleCloseCourseDetailsModal = () => setShowCourseDetailsModal(false);

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Left side: Add Course button */}
        <div className="col-md-6">
          <h4>No Course yet</h4>
          <div className="add-course-box" onClick={handleShowModal}>
            <div className="add-icon">+</div>
          </div>
        </div>

        {/* Right side: Display existing courses */}
        <div className="col-md-6">
          <h4>Existing Courses</h4>
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
                  <h5 className="course-title">{course.courseTitle}</h5>
                  <p className="course-description">{course.courseDescription}</p> {/* Show course description */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding a new course */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label>Course Title</label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Enter course title"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Course Description</label>
            <textarea
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Enter course description"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Video Link</label>
            <input
              type="text"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="Enter video link"
              className="form-control"
            />
          </div>

          {/* Prerequisite selection */}
          <div className="form-group">
            <label>Select Prerequisite Courses (if any)</label>
            <select
              multiple
              value={prerequisites}
              onChange={handlePrerequisiteChange}
              className="form-control"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.courseTitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h4>Quiz Questions</h4>
            {questions.map((question, index) => (
              <div key={index}>
                <input
                  type="text"
                  name="question"
                  value={question.question}
                  onChange={(e) => handleChangeQuestion(index, e)}
                  placeholder="Enter question"
                  className="form-control mb-2"
                />
                <h5>Choices</h5>
                {question.choices.map((choice, cIndex) => (
                  <input
                    key={cIndex}
                    type="text"
                    value={choice}
                    onChange={(e) => handleChangeChoice(index, cIndex, e)}
                    placeholder={`Choice ${cIndex + 1}`}
                    className="form-control mb-1"
                  />
                ))}
                <label>Correct Answer</label>
                <input
                  type="text"
                  name="correctAnswer"
                  value={question.correctAnswer}
                  onChange={(e) => handleChangeQuestion(index, e)}
                  placeholder="Enter correct answer"
                  className="form-control mb-3"
                />
              </div>
            ))}
            <Button variant="secondary" onClick={handleAddQuestion} className="mt-2">
              Add another question
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit Course
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for displaying course details */}
      {selectedCourse && (
        <Modal show={showCourseDetailsModal} onHide={handleCloseCourseDetailsModal}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedCourse.courseTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Video Link:</strong> {selectedCourse.videoLink}</p>
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
