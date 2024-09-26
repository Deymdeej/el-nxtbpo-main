import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Firebase setup including auth
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify"; // For feedback
import { Modal, Button } from "react-bootstrap"; // Import Modal from React Bootstrap
import "./css/AdminCoursePage.css"; // For custom styling

function ITAdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [disableVideoLink, setDisableVideoLink] = useState(false); // Checkbox state for disabling video link input
  const [prerequisites, setPrerequisites] = useState([]); // Store selected prerequisite courses
  const [questions, setQuestions] = useState([
    { question: "", choices: ["", "", "", ""], correctAnswer: "" },
  ]);
  const [firstCourseId, setFirstCourseId] = useState(null); // Store the first course ID
  const [showModal, setShowModal] = useState(false); // Modal visibility control
  const [showCourseDetailsModal, setShowCourseDetailsModal] = useState(false); // Course details modal
  const [selectedCourse, setSelectedCourse] = useState(null); // Store the selected course
  const [section, setSection] = useState("general"); // Dropdown state for selecting section inside modal
  const [createdBy, setCreatedBy] = useState(""); // Store the createdBy full name

  // Fetch existing courses from the database
  useEffect(() => {
    const fetchCourses = async () => {
      const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses"));
      const itCoursesSnapshot = await getDocs(collection(db, "ITCourses"));

      const generalCourses = generalCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const itCourses = itCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine General and IT courses in one state for display
      setCourses([...generalCourses, ...itCourses]);

      // Automatically set the first course's ID as a default prerequisite
      if (generalCourses.length > 0) {
        setFirstCourseId(generalCourses[0].id); // Set first course ID
      }

      // Fetch the logged-in user's full name from Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, "Users", currentUser.uid); // Assuming user details are stored in a "Users" collection
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCreatedBy(userData.fullName || "Unknown User"); // Fetch and set the user's full name
        } else {
          setCreatedBy("Unknown User");
        }
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

  // Error handling function
  const validateForm = () => {
    if (!courseTitle.trim()) {
      toast.error("Course Title is required");
      return false;
    }
    if (!courseDescription.trim()) {
      toast.error("Course Description is required");
      return false;
    }
    if (questions.some((q) => !q.question.trim())) {
      toast.error("All questions must have a question text");
      return false;
    }
    if (questions.some((q) => q.choices.some((c) => !c.trim()))) {
      toast.error("All choices must be filled for each question");
      return false;
    }
    if (questions.some((q) => !q.correctAnswer.trim())) {
      toast.error("Each question must have a correct answer");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return; // Run the validation checks before proceeding

    try {
      // Add first course as prerequisite if no prerequisite is selected
      const coursePrerequisites =
        prerequisites.length === 0 && firstCourseId
          ? [firstCourseId] // Set first course as prerequisite if none selected
          : prerequisites;

      // Store course in the selected section (General or IT Department)
      const collectionPath = section === "general" ? "GeneralCourses" : "ITCourses";

      // Add the new course to Firestore
      const docRef = await addDoc(collection(db, collectionPath), {
        courseTitle,
        courseDescription,
        videoLink: disableVideoLink ? "" : videoLink, // Disable video link if checkbox is checked
        questions,
        prerequisites: coursePrerequisites, // Save prerequisites as part of the course
        createdBy, // Add the createdBy field (full name)
        createdAt: new Date(), // Store the created timestamp
      });

      // Create the new course object
      const newCourse = {
        id: docRef.id, // Get the newly created document ID
        courseTitle,
        courseDescription,
        videoLink: disableVideoLink ? "" : videoLink,
        questions,
        prerequisites: coursePrerequisites,
        createdBy, // Add createdBy (full name) to the course object
        createdAt: new Date(), // Store createdAt timestamp
      };

      // Add the new course to the state without re-fetching
      setCourses((prevCourses) => [...prevCourses, newCourse]);

      // Reset the form fields
      setCourseTitle("");
      setCourseDescription("");
      setVideoLink("");
      setQuestions([{ question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
      setPrerequisites([]); // Reset prerequisites after submission
      setDisableVideoLink(false); // Reset video link checkbox

      toast.success("Course added successfully!");

      // Close modal after adding course
      setShowModal(false);
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
        <div className="col-md-6">
          <h4>No Course yet</h4>
          <div className="add-course-box" onClick={handleShowModal}>
            <div className="add-icon">+</div>
          </div>
        </div>

        {/* Right side: Display existing courses */}
        <div className="col-md-6">
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
          {/* Dropdown for selecting General or IT Department */}
          <div className="form-group">
            <label>Select Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)} className="form-control">
              <option value="general">General</option>
              <option value="it">IT Department</option>
            </select>
          </div>

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
              disabled={disableVideoLink} // Disable the input if the checkbox is checked
            />
            <div className="form-check mt-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="disableVideoLink"
                checked={disableVideoLink}
                onChange={(e) => setDisableVideoLink(e.target.checked)} // Toggle disable/enable of the input field
              />
              <label className="form-check-label" htmlFor="disableVideoLink">
                No Video Link
              </label>
            </div>
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
            <p><strong>Created By:</strong> {selectedCourse.createdBy}</p> {/* Display createdBy */}
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

export default ITAdminDashboard;
