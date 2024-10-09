import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, setDoc, getDoc, query, where } from "firebase/firestore"; 
import { toast } from "react-toastify";
import { jsPDF } from "jspdf"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { useNavigate } from 'react-router-dom'; 
import ITUser from './ITUser';

function ITUserDashboard() {
  const [selectedNav, setSelectedNav] = useState('dashboard'); 
  const [courses, setCourses] = useState([]); 
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(0); 
  const [hasPassed, setHasPassed] = useState(false);
  const [userId, setUserId] = useState(null); 
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
  const [certificateUrl, setCertificateUrl] = useState(null); // Store the certificate URL
  const navigate = useNavigate();

  const storage = getStorage(); // Initialize Firebase Storage

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

  // Generate the certificate after passing the quiz and upload to Firebase Storage
  const generateCertificate = async (fullName, courseTitle) => {
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

    // Convert the generated PDF to Blob
    const pdfBlob = doc.output("blob");

    // Create a reference to Firebase Storage location
    const storageRef = ref(storage, `certificates/${userId}_${selectedCourse.id}.pdf`);

    try {
      // Upload the PDF to Firebase Storage
      await uploadBytes(storageRef, pdfBlob);

      // Get the download URL for the uploaded certificate
      const url = await getDownloadURL(storageRef);
      setCertificateUrl(url); // Store the certificate URL for the user to view/download
      toast.success("Certificate uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload certificate.");
      console.error("Error uploading certificate:", error);
    }
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
        await generateCertificate(fullName, selectedCourse.courseTitle); // Upload certificate
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

  const handleNavClick = (navItem) => {
    setSelectedNav(navItem);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <ITUser
      selectedNav={selectedNav}
      handleNavClick={handleNavClick}
      handleLogout={handleLogout}
      courses={courses}
      handleEnrollCourse={handleEnrollCourse}
      handleSelectCourse={handleSelectCourse}
      showEnrollModal={showEnrollModal}
      confirmEnroll={confirmEnroll}
      setShowEnrollModal={setShowEnrollModal}
      selectedCourse={selectedCourse}
      enrolledCourses={enrolledCourses}
      userAnswers={userAnswers}
      handleAnswerChange={handleAnswerChange}
      handleSubmitQuiz={handleSubmitQuiz}
      hasPassed={hasPassed}
      certificateUrl={certificateUrl}
      progress={progress}
      attempts={attempts}
      retryTimeout={retryTimeout}
      reattemptCountdown={reattemptCountdown}
      showReattempt={showReattempt}
      handleReattemptQuiz={handleReattemptQuiz}
      showCorrectAnswers={showCorrectAnswers}
      correctAnswers={correctAnswers}
      convertToEmbedUrl={convertToEmbedUrl}
      fullName={fullName}
      enrollingCourse={enrollingCourse}
      userType={"IT"}
    />
  );
}

export default ITUserDashboard;
