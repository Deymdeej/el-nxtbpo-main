import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase"; // Add Firebase auth
import { collection, getDocs, doc, setDoc, getDoc, query, where } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify";
import ProgressBar from "react-bootstrap/ProgressBar"; // Import progress bar
import { Button } from "react-bootstrap"; // Import Button from react-bootstrap
import { jsPDF } from "jspdf"; // Import jsPDF for certification

function ITUserDashboard() {
  const [courses, setCourses] = useState([]); // Hold both General and IT courses
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(0); // Track attempts
  const [hasPassed, setHasPassed] = useState(false);
  const [userId, setUserId] = useState(null); // Store userId
  const [fullName, setFullName] = useState("User"); // Store user's full name
  const [completedCourses, setCompletedCourses] = useState([]); // Store the IDs of completed courses
  const [retryTimeout, setRetryTimeout] = useState(0); // Store the countdown for retry
  const [showReattempt, setShowReattempt] = useState(false); // Control reattempt visibility
  const [reattemptCountdown, setReattemptCountdown] = useState(3); // Countdown for reattempt button
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false); // To show correct answers
  const [correctAnswers, setCorrectAnswers] = useState([]); // Store the correct answers
  const [certifiedUsers, setCertifiedUsers] = useState([]); // Hold certified users

  // Fetch the currently logged-in user's ID, name, and completed courses
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

        fetchCompletedCourses(currentUser.uid); // Fetch the completed courses
      } else {
        toast.error("User is not authenticated. Please log in.");
      }
    };

    fetchUserDetails();
  }, []);

  // Fetch the user's completed courses
  const fetchCompletedCourses = async (userId) => {
    const quizResultsSnapshot = await getDocs(collection(db, "QuizResults"));
    const completed = quizResultsSnapshot.docs
      .filter((doc) => doc.data().userId === userId && doc.data().passed === true)
      .map((doc) => doc.data().courseId);
    setCompletedCourses(completed); // Set the list of completed course IDs
  };

  // Fetch existing courses from both GeneralCourses and ITCourses collections
  useEffect(() => {
    const fetchCourses = async () => {
      const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses")); // Fetch General courses
      const itCoursesSnapshot = await getDocs(collection(db, "ITCourses")); // Fetch IT-specific courses

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
    };

    fetchCourses();
  }, []);

  // Fetch certified users for the selected course
  const fetchCertifiedUsers = async (courseId) => {
    const certifiedQuery = query(
      collection(db, "QuizResults"),
      where("courseId", "==", courseId),
      where("passed", "==", true)
    );

    const certifiedSnapshot = await getDocs(certifiedQuery);
    const certified = certifiedSnapshot.docs.map((doc) => doc.data());
    setCertifiedUsers(certified); // Set the list of certified users
  };

  // Handle course selection and check prerequisite
  const handleSelectCourse = (course) => {
    if (course.prerequisites && course.prerequisites.length > 0) {
      const hasCompletedPrerequisites = course.prerequisites.every((preReqId) =>
        completedCourses.includes(preReqId)
      );

      if (!hasCompletedPrerequisites) {
        toast.error("You need to complete the prerequisite course(s) before accessing this one.");
        return; // Do not allow selecting the course
      }
    }
    setSelectedCourse(course);
    setProgress(0); // Reset progress when a new course is selected
    setUserAnswers(Array(course.questions?.length || 0).fill("")); // Initialize user answers array
    setAttempts(0); // Reset attempts for the new course
    setHasPassed(false); // Reset passed state for the new course
    setRetryTimeout(0); // Reset retry timeout when selecting a new course
    setShowReattempt(false); // Hide reattempt button
    setShowCorrectAnswers(false); // Hide correct answers
    setCorrectAnswers([]); // Reset correct answers

    // Fetch certified users for the selected course
    fetchCertifiedUsers(course.id);
  };

  const handleAnswerChange = (questionIndex, choice) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = choice || ""; // Ensure choice is not undefined
    setUserAnswers(newAnswers);
  };

  const generateCertificate = (fullName, courseTitle) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Certificate of Completion", 105, 50, null, null, "center");

    doc.setFontSize(16);
    doc.text(`This certifies that`, 105, 70, null, null, "center");
    doc.setFontSize(20);
    doc.text(fullName, 105, 90, null, null, "center");

    doc.setFontSize(16);
    doc.text(`has successfully completed the course`, 105, 110, null, null, "center");
    doc.setFontSize(20);
    doc.text(courseTitle, 105, 130, null, null, "center");

    doc.setFontSize(14);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 150, null, null, "center");

    // Save the PDF
    doc.save(`${fullName}_Certificate.pdf`);
  };

  const handleSubmitQuiz = async () => {
    // Ensure the userId is not undefined
    if (!userId) {
      toast.error("User is not authenticated. Please log in.");
      return;
    }

    if (attempts >= 2) {
      toast.error("You have used all your attempts! Please wait 3 seconds to retry.");
      startRetryTimer(); // Start the 3-second timer
      return;
    }

    if (!selectedCourse || !selectedCourse.questions || selectedCourse.questions.length === 0) {
      toast.error("Invalid quiz data!");
      return;
    }

    const correctAnswersList = selectedCourse.questions.map((q) => q?.correctAnswer || "");
    setCorrectAnswers(correctAnswersList); // Store the correct answers

    const userScore = userAnswers.filter(
      (answer, index) => answer === correctAnswersList[index]
    ).length;

    const totalQuestions = correctAnswersList.length;
    const percentage = (userScore / totalQuestions) * 100;

    if (percentage >= 80) {
      toast.success(`Congratulations ${fullName}! You passed with ${percentage}%`);
      setHasPassed(true);
      setProgress(100);
      setShowCorrectAnswers(true); // Show correct answers after passing

      // Save the quiz result to Firestore in the required format
      const resultData = {
        department: "IT", // Or fetch this value dynamically if available
        email: auth.currentUser.email, // Getting the email from Firebase auth
        fullName: fullName, // Full name of the user
        role: "user", // This could be dynamic based on the user's role
        userId: userId, // Storing the user ID
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.courseTitle,
        score: percentage,
        passed: true,
        attempts: attempts + 1,
        timestamp: new Date(),
      };

      try {
        await setDoc(doc(db, "QuizResults", `${userId}_${selectedCourse.id}`), resultData);

        // Update the user's certification status in Firestore
        await setDoc(doc(db, "Users", userId), { certified: true }, { merge: true });

        // Generate the certificate
        generateCertificate(fullName, selectedCourse.courseTitle);
      } catch (error) {
        toast.error("Failed to save quiz results.");
        console.error("Error saving quiz result:", error);
      }

      // Refresh the list of completed courses
      fetchCompletedCourses(userId);
    } else {
      toast.error(`You failed. Your score: ${percentage}%`);
      setProgress(50);
      setAttempts(attempts + 1);

      if (attempts + 1 >= 2) {
        setShowCorrectAnswers(true); // Show correct answers after 2 attempts fail
        setShowReattempt(true); // Show reattempt button only after 2 attempts
        startReattemptCountdown(); // Start 3-second countdown for reattempt
      }
    }
  };

  // Function to start the 3-second retry timer
  const startRetryTimer = () => {
    let countdown = 3;
    setRetryTimeout(countdown);

    const interval = setInterval(() => {
      countdown -= 1;
      setRetryTimeout(countdown);

      if (countdown <= 0) {
        clearInterval(interval);
        setAttempts(0); // Reset the attempts after the 3 seconds
        toast.info("You can now retake the quiz.");
      }
    }, 1000);
  };

  // Function to start the 3-second countdown for reattempt button
  const startReattemptCountdown = () => {
    let countdown = 3; // Set countdown to 3 seconds
    setReattemptCountdown(countdown);

    const interval = setInterval(() => {
      countdown -= 1;
      setReattemptCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  };

  // Handle reattempt button click
  const handleReattemptQuiz = () => {
    setAttempts(0);
    setProgress(0);
    setShowReattempt(false); // Hide reattempt button
    setUserAnswers(Array(selectedCourse.questions?.length || 0).fill("")); // Reset answers
    setShowCorrectAnswers(false); // Hide correct answers for the next attempt
  };

  const convertToEmbedUrl = (videoLink) => {
    if (!videoLink || typeof videoLink !== "string") return null; // Check if videoLink exists and is a string

    const isYouTubeLink = videoLink.includes("youtube.com") || videoLink.includes("youtu.be");

    if (isYouTubeLink) {
      const videoId = videoLink.split("v=")[1]?.split("&")[0] || videoLink.split("/")[3];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return videoLink; // Return the original link if it's not YouTube
  };

  return (
    <div className="it-user-dashboard container mt-5">
      <h3>Select an IT or General Course</h3>
      {courses.length === 0 ? (
        <p>No courses available</p>
      ) : (
        <div className="course-grid">
          {courses.map((course, index) => (
            <div
              key={index}
              className="course-card"
              onClick={() => handleSelectCourse(course)}
              style={{
                cursor: "pointer",
                opacity: course.prerequisites && course.prerequisites.length > 0 &&
                !course.prerequisites.every((preReqId) => completedCourses.includes(preReqId))
                  ? 0.5
                  : 1,
              }}
            >
              <div className="course-icon">📘</div>
              <h5>{course.courseTitle}</h5>
              <p>{course.courseDescription}</p>
              {course.prerequisites && course.prerequisites.length > 0 &&
              !course.prerequisites.every((preReqId) => completedCourses.includes(preReqId)) && (
                <small style={{ color: "red" }}>Locked (Complete prerequisite course(s))</small>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedCourse && (
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

                    {/* Show correct/incorrect after completion */}
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

      {certifiedUsers.length > 0 && (
        <div className="certified-users-section mt-5">
          <h4>Certified Users for {selectedCourse.courseTitle}</h4>
          <ul>
            {certifiedUsers.map((user, index) => (
              <li key={index}>
                {user.fullName} ({user.email}) - Certified on {new Date(user.timestamp.seconds * 1000).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ITUserDashboard;
