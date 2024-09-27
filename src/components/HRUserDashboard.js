import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase"; // Firebase setup
import { collection, getDocs, doc, setDoc, getDoc, query, where } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify";
import ProgressBar from "react-bootstrap/ProgressBar"; // Progress bar from react-bootstrap
import { Button, Modal } from "react-bootstrap"; // Button and Modal from react-bootstrap
import { jsPDF } from "jspdf"; // jsPDF for generating certificates

function HRUserDashboard() {
  const [courses, setCourses] = useState([]); // Hold all available courses
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(0); // Track quiz attempts
  const [hasPassed, setHasPassed] = useState(false);
  const [userId, setUserId] = useState(null); // Store the user's ID
  const [fullName, setFullName] = useState("User"); // Store the user's full name
  const [retryTimeout, setRetryTimeout] = useState(0); // Countdown for retrying the quiz
  const [showReattempt, setShowReattempt] = useState(false); // Control reattempt button visibility
  const [reattemptCountdown, setReattemptCountdown] = useState(3); // Countdown timer for reattempts
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false); // Show correct answers after submission
  const [correctAnswers, setCorrectAnswers] = useState([]); // Store correct answers
  const [showEnrollModal, setShowEnrollModal] = useState(false); // Control course enrollment modal
  const [enrollingCourse, setEnrollingCourse] = useState(null); // Store the course to enroll
  const [enrolledCourses, setEnrolledCourses] = useState([]); // Store enrolled courses
  const [completedCourses, setCompletedCourses] = useState([]); // Store completed courses (for prerequisites)

  // Fetch the currently logged-in user's ID, name, enrolled, and completed courses
  useEffect(() => {
    const fetchUserDetails = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUserId(currentUser.uid); // Set the user ID

        // Fetch the user's details from Firestore
        const userDocRef = doc(db, "Users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFullName(userData.fullName || "User");
        }

        fetchEnrolledCourses(currentUser.uid); // Fetch the courses the user is enrolled in
        fetchCompletedCourses(currentUser.uid); // Fetch completed courses for prerequisites
      } else {
        toast.error("User is not authenticated. Please log in.");
      }
    };

    fetchUserDetails();
  }, []);

  // Fetch enrolled courses
  const fetchEnrolledCourses = async (userId) => {
    const enrollmentSnapshot = await getDocs(query(collection(db, "Enrollments"), where("userId", "==", userId)));
    const enrolled = enrollmentSnapshot.docs.map((doc) => doc.data().courseId);
    setEnrolledCourses(enrolled); // Store the list of enrolled course IDs
  };

  // Fetch completed courses (Courses that the user has passed as prerequisites)
  const fetchCompletedCourses = async (userId) => {
    const resultsSnapshot = await getDocs(query(collection(db, "QuizResults"), where("userId", "==", userId), where("passed", "==", true)));
    const completed = resultsSnapshot.docs.map((doc) => doc.data().courseId);
    setCompletedCourses(completed); // Store the list of completed course IDs
  };

  // Fetch existing courses from both GeneralCourses and HRCourses collections
  useEffect(() => {
    const fetchCourses = async () => {
      const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses")); // Fetch General courses
      const hrCoursesSnapshot = await getDocs(collection(db, "HRCourses")); // Fetch HR-specific courses

      const generalCourses = generalCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const hrCourses = hrCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine General and HR courses in one state for display
      setCourses([...generalCourses, ...hrCourses]);
    };

    fetchCourses();
  }, []);

  // Handle course selection
  const handleSelectCourse = (course) => {
    if (!enrolledCourses.includes(course.id)) {
      toast.error("You must enroll in the course to view its content.");
      return;
    }
    setSelectedCourse(course);
    setProgress(0); // Reset progress when a new course is selected
    setUserAnswers(Array(course.questions?.length || 0).fill("")); // Initialize user answers array
    setAttempts(0); // Reset attempts for the new course
    setHasPassed(false); // Reset passed state for the new course
    setRetryTimeout(0); // Reset retry timeout
    setShowReattempt(false); // Hide reattempt button
    setShowCorrectAnswers(false); // Hide correct answers
    setCorrectAnswers([]); // Reset correct answers
  };

  // Check if the user has completed the prerequisite courses before allowing enrollment
  const handleEnrollCourse = (course) => {
    if (course.prerequisites && course.prerequisites.length > 0) {
      const hasCompletedPrerequisites = course.prerequisites.every((preReqId) =>
        completedCourses.includes(preReqId)
      );

      if (!hasCompletedPrerequisites) {
        toast.error("You need to complete the prerequisite course(s) before accessing this one.");
        return; // Do not allow enrollment
      }
    }
    setEnrollingCourse(course);
    setShowEnrollModal(true); // Open enrollment modal
  };

  // Confirm course enrollment
  const confirmEnroll = async () => {
    if (enrollingCourse) {
      try {
        await setDoc(doc(db, "Enrollments", `${userId}_${enrollingCourse.id}`), {
          userId,
          courseId: enrollingCourse.id,
          courseTitle: enrollingCourse.courseTitle,
          enrolledDate: new Date(),
        });
        toast.success(`You have been enrolled in ${enrollingCourse.courseTitle}!`);
        setEnrolledCourses((prev) => [...prev, enrollingCourse.id]); // Add to enrolled courses
      } catch (error) {
        toast.error("Failed to enroll in the course.");
      }
    }

    setShowEnrollModal(false); // Close modal after enrolling
  };

  // Handle answer change
  const handleAnswerChange = (questionIndex, choice) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = choice || ""; // Ensure choice is not undefined
    setUserAnswers(newAnswers);
  };

  // Generate the certificate after passing the quiz
  const generateCertificate = (fullName, courseTitle) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Certificate of Completion", 105, 50, null, null, "center");

    doc.setFontSize(16);
    doc.text("This certifies that", 105, 70, null, null, "center");
    doc.setFontSize(20);
    doc.text(fullName, 105, 90, null, null, "center");

    doc.setFontSize(16);
    doc.text("has successfully completed the course", 105, 110, null, null, "center");
    doc.setFontSize(20);
    doc.text(courseTitle, 105, 130, null, null, "center");

    doc.setFontSize(14);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 150, null, null, "center");

    // Save the PDF
    doc.save(`${fullName}_Certificate.pdf`);
  };

  // Submit the quiz
  const handleSubmitQuiz = async () => {
    if (!userId) {
      toast.error("User is not authenticated. Please log in.");
      return;
    }

    if (attempts >= 2) {
      toast.error("You have used all your attempts! Please wait 3 seconds to retry.");
      startRetryTimer();
      return;
    }

    if (!selectedCourse || !selectedCourse.questions || selectedCourse.questions.length === 0) {
      toast.error("Invalid quiz data!");
      return;
    }

    const correctAnswersList = selectedCourse.questions.map((q) => q?.correctAnswer || "");
    setCorrectAnswers(correctAnswersList);

    const userScore = userAnswers.filter((answer, index) => answer === correctAnswersList[index]).length;
    const totalQuestions = correctAnswersList.length;
    const percentage = (userScore / totalQuestions) * 100;

    if (percentage >= 80) {
      toast.success(`Congratulations ${fullName}! You passed with ${percentage}%`);
      setHasPassed(true);
      setProgress(100);
      setShowCorrectAnswers(true);

      const resultData = {
        userId: userId,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.courseTitle,
        score: percentage,
        passed: true,
        attempts: attempts + 1,
        timestamp: new Date(),
      };

      try {
        await setDoc(doc(db, "QuizResults", `${userId}_${selectedCourse.id}`), resultData);
        generateCertificate(fullName, selectedCourse.courseTitle);
        fetchCompletedCourses(userId); // Refresh completed courses
      } catch (error) {
        toast.error("Failed to save quiz results.");
        console.error("Error saving quiz result:", error);
      }
    } else {
      toast.error(`You failed. Your score: ${percentage}%`);
      setProgress(50);
      setAttempts(attempts + 1);

      if (attempts + 1 >= 2) {
        setShowCorrectAnswers(true);
        setShowReattempt(true);
        startReattemptCountdown();
      }
    }
  };

  // Retry timer function
  const startRetryTimer = () => {
    let countdown = 3;
    setRetryTimeout(countdown);

    const interval = setInterval(() => {
      countdown -= 1;
      setRetryTimeout(countdown);

      if (countdown <= 0) {
        clearInterval(interval);
        setAttempts(0);
        toast.info("You can now retake the quiz.");
      }
    }, 1000);
  };

  // Reattempt countdown
  const startReattemptCountdown = () => {
    let countdown = 3;
    setReattemptCountdown(countdown);

    const interval = setInterval(() => {
      countdown -= 1;
      setReattemptCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  };

  // Reattempt quiz function
  const handleReattemptQuiz = () => {
    setAttempts(0);
    setProgress(0);
    setShowReattempt(false);
    setUserAnswers(Array(selectedCourse.questions?.length || 0).fill(""));
    setShowCorrectAnswers(false);
  };

  const convertToEmbedUrl = (videoLink) => {
    if (!videoLink || typeof videoLink !== "string") return null;

    const isYouTubeLink = videoLink.includes("youtube.com") || videoLink.includes("youtu.be");

    if (isYouTubeLink) {
      const videoId = videoLink.split("v=")[1]?.split("&")[0] || videoLink.split("/")[3];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return videoLink;
  };

  return (
    <div className="hr-user-dashboard container mt-5">
      <h3>Select an HR or General Course</h3>
      {courses.length === 0 ? (
        <p>No courses available</p>
      ) : (
        <div className="course-grid">
          {courses.map((course, index) => (
            <div
              key={index}
              className="course-card"
              style={{
                cursor: "pointer",
                opacity: enrolledCourses.includes(course.id) ? 1 : 0.5,
              }}
            >
              <div className="course-icon">📘</div>
              <h5>{course.courseTitle}</h5>
              <p>{course.courseDescription}</p>
              {!enrolledCourses.includes(course.id) && (
                <Button className="mt-2" variant="success" onClick={() => handleEnrollCourse(course)}>
                  Enroll in Course
                </Button>
              )}
              {enrolledCourses.includes(course.id) && (
                <Button
                  className="mt-2"
                  variant="primary"
                  onClick={() => handleSelectCourse(course)}
                >
                  Access Course
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedCourse && enrolledCourses.includes(selectedCourse.id) && (
        <div className="course-details mt-5">
          <h4>{selectedCourse.courseTitle}</h4>
          <p>{selectedCourse.courseDescription}</p>
          <div className="video-section">
            <h5>Course Video</h5>
            {selectedCourse.videoLink ? (
              <iframe
                src={convertToEmbedUrl(selectedCourse.videoLink)}
                title="Course Video"
                width="600"
                height="400"
                allowFullScreen
              ></iframe>
            ) : (
              <p>No video available for this course.</p>
            )}
          </div>

          <div className="quiz-section mt-5">
            <h5>Quiz</h5>
            {selectedCourse.questions?.map((question, index) => (
              <div key={index}>
                <p>{question.question}</p>
                {question.choices?.map((choice, choiceIndex) => (
                  <div key={choiceIndex}>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={choice}
                      onChange={() => handleAnswerChange(index, choice)}
                      disabled={hasPassed || attempts >= 2 || retryTimeout > 0}
                    />
                    <label>{choice}</label>

                    {showCorrectAnswers && (
                      <span
                        style={{
                          color: correctAnswers[index] === choice ? "green" : "red",
                          marginLeft: "10px",
                        }}
                      >
                        {correctAnswers[index] === choice ? "Correct" : "Incorrect"}
                      </span>
                    )}
                  </div>
                ))}
                {showCorrectAnswers && (
                  <p style={{ color: "blue" }}>
                    Correct Answer: {correctAnswers[index]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <Button
            className="mt-3"
            variant="primary"
            onClick={handleSubmitQuiz}
            disabled={hasPassed || attempts >= 2 || retryTimeout > 0}
          >
            Submit Quiz
          </Button>

          {hasPassed && (
            <div className="mt-4">
              <h4>Congratulations {fullName}! You passed!</h4>
              <p>You have been certified for this course.</p>
            </div>
          )}

          {retryTimeout > 0 && (
            <div className="mt-3">
              <p>Retry in {retryTimeout} seconds...</p>
            </div>
          )}

          {showReattempt && (
            <Button
              className="mt-3"
              variant="danger"
              onClick={handleReattemptQuiz}
              disabled={reattemptCountdown > 0}
            >
              Reattempt Quiz {reattemptCountdown > 0 && `(${reattemptCountdown} seconds)`}
            </Button>
          )}

          <div className="mt-4">
            <ProgressBar now={progress} label={`${progress}%`} />
          </div>

          <div className="mt-3">
            <p>Attempts: {attempts}/2</p>
          </div>
        </div>
      )}

      {/* Modal for confirming course enrollment */}
      <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enroll in {enrollingCourse?.courseTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to enroll in {enrollingCourse?.courseTitle}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmEnroll}>
            Confirm Enrollment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default HRUserDashboard;
