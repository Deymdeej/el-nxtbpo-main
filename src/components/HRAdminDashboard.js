import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase"; // Include Firebase storage
import { collection, addDoc, getDocs, doc, getDoc, query, where } from "firebase/firestore"; // Firestore methods
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage methods
import { toast } from "react-toastify"; // For feedback
import { Modal, Button } from "react-bootstrap"; // Import Modal from React Bootstrap
import "./css/AdminCoursePage.css"; // For custom styling

function HRAdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState({}); // Store number of enrolled users per course
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
  const [pdfFile, setPdfFile] = useState(null); // State for storing selected PDF file
  const [pdfUrl, setPdfUrl] = useState(""); // State to store PDF URL after upload

  // Fetch existing courses and enrollment counts from the database
  useEffect(() => {
    const fetchCoursesAndEnrollments = async () => {
      const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses"));
      const hrCoursesSnapshot = await getDocs(collection(db, "HRCourses")); // Fetch HR Courses

      const generalCourses = generalCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const hrCourses = hrCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine General and HR courses in one state for display
      const allCourses = [...generalCourses, ...hrCourses];
      setCourses(allCourses);

      // Fetch enrollment counts for each course
      const enrollmentCounts = {};
      for (let course of allCourses) {
        const enrollmentsSnapshot = await getDocs(query(collection(db, "Enrollments"), where("courseId", "==", course.id)));
        enrollmentCounts[course.id] = enrollmentsSnapshot.size; // Count number of enrolled users
      }
      setEnrollmentCounts(enrollmentCounts);

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

    fetchCoursesAndEnrollments();
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

  // Handle PDF file selection
  const handlePdfChange = (e) => {
    if (e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  // Upload PDF to Firebase Storage
  const uploadPdfToStorage = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file to upload.");
      return null;
    }

    const storageRef = ref(storage, `course-pdfs/${pdfFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, pdfFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {},
        (error) => {
          toast.error("Error uploading PDF: " + error.message);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          toast.success("PDF uploaded successfully!");
          resolve(downloadUrl); // Return the download URL
        }
      );
    });
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
    if (questions.some((q) => !q.choices.includes(q.correctAnswer))) {
      toast.error("Correct answer must be one of the choices for each question");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return; // Run the validation checks before proceeding

    try {
      const pdfDownloadUrl = await uploadPdfToStorage(); // Upload PDF and get the URL

      // Add first course as prerequisite if no prerequisite is selected and there is a first course
      const coursePrerequisites =
        prerequisites.length === 0 && firstCourseId
          ? [firstCourseId] // Set first course as prerequisite if none selected
          : prerequisites.length > 0
          ? prerequisites // Use the selected prerequisites
          : []; // If no prerequisites are selected and no first course exists, leave it empty

      // Store course in the selected section (General or HR Department)
      const collectionPath = section === "general" ? "GeneralCourses" : "HRCourses";

      // Add the new course to Firestore
      const docRef = await addDoc(collection(db, collectionPath), {
        courseTitle,
        courseDescription,
        videoLink: disableVideoLink ? "" : videoLink, // Disable video link if checkbox is checked
        questions,
        prerequisites: coursePrerequisites.length > 0 ? coursePrerequisites : [], // Only save prerequisites if they exist
        createdBy, // Add the createdBy field (full name)
        createdAt: new Date(), // Store the created timestamp
        pdfUrl: pdfDownloadUrl || "", // Save the PDF download URL
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
        pdfUrl: pdfDownloadUrl || "", // Save the PDF download URL
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
      setPdfFile(null); // Reset PDF file input

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
                  <p className="course-enrollments">
                    Enrolled Users: {enrollmentCounts[course.id] || 0} {/* Show number of enrolled users */}
                  </p>
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
          {/* Dropdown for selecting General or HR Department */}
          <div className="form-group">
            <label>Select Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)} className="form-control">
              <option value="general">General</option>
              <option value="hr">HR Department</option>
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

          {/* PDF file upload */}
          <div className="form-group">
            <label>Upload Course PDF</label>
            <input type="file" accept=".pdf" onChange={handlePdfChange} className="form-control" />
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
            <p><strong>PDF Link:</strong> {selectedCourse.pdfUrl ? <a href={selectedCourse.pdfUrl} target="_blank" rel="noopener noreferrer">Download PDF</a> : "No PDF available"}</p>
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

export default HRAdminDashboard;
