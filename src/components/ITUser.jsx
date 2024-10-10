import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from "../firebase"; // Ensure Firebase is properly configured
import { setDoc, doc, getDocs, query, where, collection, getDoc, updateDoc } from "firebase/firestore";
import BPOLOGO from '../assets/bpo-logo.png';
import CoursePick from '../assets/coursepick.png';
import LogoutPick from '../assets/logoutpick.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import CertDefault from '../assets/certdefault.png';
import CertPick from '../assets/certpick.png';
import TrainingPick from '../assets/trainingpick.png';
import TrainingDefault from '../assets/trainingdefault.png';
import SortFilter from '../assets/sort.png'; // Import filter icon
import './css/ITUserCourse.css';
import Category_IT from '../assets/Category_IT.png'; // Import the image here
import { toast } from 'react-toastify'; // Toast for notifications
import PdfIcon from '../assets/pdf.png';  // Adjust the path to match the location of your pdf.png
import verifiedGif from '../assets/verified.gif'; // Update the path to where your GIF is stored
import sadGif from '../assets/sad.gif';  // Adjust the path as needed
import trophyGif from '../assets/trophy.gif';
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";








const ITUser = ({
  handleLogout,
  fullName,
  userType // Added userType to determine whether the user is HR or IT
}) => {
  const [courses, setCourses] = useState([]); // State to hold all courses
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedNav, setSelectedNav] = useState('courses'); // Set default navigation to "courses"
  const [selectedCourse, setSelectedCourse] = useState(null); // For handling selected course
  const [isMyCoursesModalOpen, setIsMyCoursesModalOpen] = useState(false); // For handling "My Courses" modal visibility
  const [isAvailableCoursesModalOpen, setIsAvailableCoursesModalOpen] = useState(false); // For handling "Available Courses" modal visibility
  const [showConfirmModal, setShowConfirmModal] = useState(false); // For showing confirm modal
  const [enrolledCourses, setEnrolledCourses] = useState([]); // State for enrolled courses (fetched from Firebase)
  const [myCourses, setMyCourses] = useState([]); // State for enrolled courses (My Courses)
  const [isNextModalOpen, setIsNextModalOpen] = useState(false); // New state for the next modal
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false); // New state for quiz modal
  const [quizData, setQuizData] = useState(null); // State for quiz data
  const [numberOfQuestions, setNumberOfQuestions] = useState(0); // To hold the number of questions
  const [attemptsUsed, setAttemptsUsed] = useState(0); // To hold the number of attempts used
  const [maxAttempts, setMaxAttempts] = useState(2); // Max attempts for the quiz
  const [currentQuestion, setCurrentQuestion] = useState(0); // State to track the current question
  const [isQuizContentModalOpen, setIsQuizContentModalOpen] = useState(false); // New state for the quiz content modal
  const [selectedAnswer, setSelectedAnswer] = useState(null); // New state for the selected answer
  const [isResultModalOpen, setIsResultModalOpen] = useState(false); // New state for result modal
const [quizScore, setQuizScore] = useState(0); // Store the quiz score
// State to track if detailed results are being shown
const [showDetailedResults, setShowDetailedResults] = useState(false);
const [showCongratsModal, setShowCongratsModal] = useState(false);
const [showCertificateModal, setShowCertificateModal] = useState(false);
const [certificateUrl, setCertificateUrl] = useState(null); // To store the certificate URL
const certificateRef = useRef(null);  // Initialize ref to store the certificate DOM element



  




// State to store the user's selected answers
const [selectedAnswers, setSelectedAnswers] = useState([]);




  const userId = auth.currentUser?.uid; // Assuming the user is authenticated, get the user ID
  // Fetch enrolled courses and available courses (General and IT) from Firebase when the component mounts
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        if (userId) {
          const enrollmentQuery = query(collection(db, "Enrollments"), where("userId", "==", userId));
          const enrollmentSnapshot = await getDocs(enrollmentQuery);
    
          if (!enrollmentSnapshot.empty) {
            const enrolledCoursesFromFirebase = enrollmentSnapshot.docs.map((doc) => ({
              id: doc.data().courseId,
              courseTitle: doc.data().courseTitle,
              courseDescription: doc.data().courseDescription || "No description available",
              category: doc.data().category || "Uncategorized",
              pdfURLs: doc.data().pdfURLs || [],
              videoLink: doc.data().videoLink || ""  // Ensure videoLink is fetched here
            }));
    
            setMyCourses(enrolledCoursesFromFirebase);
            setEnrolledCourses(enrolledCoursesFromFirebase.map(course => course.id));
          }
        }
      } catch (error) {
        console.error("Error fetching enrolled courses:", error.message);
        toast.error("Failed to fetch enrolled courses.");
      }
    };

    const fetchQuizDataFromEnrollment = async (courseId) => {
      try {
        const enrollmentRef = doc(db, "Enrollments", `${userId}_${courseId}`);
        const enrollmentSnap = await getDoc(enrollmentRef);
    
        if (enrollmentSnap.exists()) {
          const enrollmentData = enrollmentSnap.data();
          
          // Ensure that questions field is an array
          if (Array.isArray(enrollmentData.questions)) {
            const questionCount = enrollmentData.questions.length;
            setNumberOfQuestions(questionCount);
          } else {
            setNumberOfQuestions(0); // Fallback if no questions array is present
          }
    
          // Fetch quiz attempts specific to this course
          const quizAttempts = enrollmentData.quizAttempts || 0;  // Default to 0 if not set
          setAttemptsUsed(quizAttempts); // Set attempts used for this course
        } else {
          toast.error("No enrollment data found.");
          setNumberOfQuestions(0);
          setAttemptsUsed(0); // Default attempts to 0 if no enrollment data is found
        }
      } catch (error) {
        console.error("Error fetching enrollment data:", error.message);
        toast.error("Failed to fetch enrollment data.");
      }
    };
    

    const fetchAvailableCourses = async () => {
      try {
        // Fetch IT Courses
        const itCoursesSnapshot = await getDocs(collection(db, "ITCourses"));
        const itCourses = itCoursesSnapshot.docs.map(doc => ({
          id: doc.id,
          courseTitle: doc.data().courseTitle,
          courseDescription: doc.data().courseDescription || "No description available",
          category: "IT", // Mark the category as IT
        }));

        // Fetch General Courses
        const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses"));
        const generalCourses = generalCoursesSnapshot.docs.map(doc => ({
          id: doc.id,
          courseTitle: doc.data().courseTitle,
          courseDescription: doc.data().courseDescription || "No description available",
          category: "General", // Mark the category as General
        }));

        // Merge IT and General courses and update state
        setCourses([...itCourses, ...generalCourses]);
      } catch (error) {
        console.error("Error fetching available courses:", error.message);
        toast.error("Failed to fetch available courses.");
      }
    };

    fetchEnrolledCourses(); // Fetch the user's enrolled courses from Firebase
    fetchAvailableCourses(); // Fetch both IT and General courses
  }, [userId]);

  const fetchQuizDataFromEnrollment = async (courseId) => {
    try {
        const enrollmentRef = doc(db, "Enrollments", `${userId}_${courseId}`);
        const enrollmentSnap = await getDoc(enrollmentRef);

        if (enrollmentSnap.exists()) {
            const enrollmentData = enrollmentSnap.data();
            
            // Ensure that questions field is an array
            if (Array.isArray(enrollmentData.questions)) {
                const questionCount = enrollmentData.questions.length; // Count number of questions
                console.log(`Questions array length: ${questionCount}`); // Debugging to verify
                setNumberOfQuestions(questionCount);
            } else {
                console.error("Questions field is not an array or is missing");
                setNumberOfQuestions(0); // Fallback if no questions array is present
            }
        } else {
            toast.error("No enrollment data found.");
            setNumberOfQuestions(0);
        }
    } catch (error) {
        console.error("Error fetching enrollment data:", error.message);
        toast.error("Failed to fetch enrollment data.");
    }
};

const handleNextClick = () => {
  setIsMyCoursesModalOpen(false);
  setIsNextModalOpen(true);
};
const handleCloseQuizModal = () => {
  setIsQuizModalOpen(false); // Close the quiz modal
};



const fetchQuizData = async (courseId) => {
  try {
    const enrollmentRef = doc(db, "Enrollments", `${userId}_${courseId}`);
    const enrollmentSnap = await getDoc(enrollmentRef);
    
    if (enrollmentSnap.exists()) {
      const enrollmentData = enrollmentSnap.data();
      setQuizData(enrollmentData); // Storing the full quiz data, including questions
      if (Array.isArray(enrollmentData.questions)) {
        setNumberOfQuestions(enrollmentData.questions.length); // Store the number of questions
      } else {
        toast.error("No quiz data available");
      }
    } else {
      toast.error("No enrollment data found.");
    }
  } catch (error) {
    console.error("Error fetching quiz data:", error);
    toast.error("Failed to fetch quiz data.");
  }
};


  const handleNavClick = (navItem) => {
    setSelectedNav(navItem); // This will set the selected navigation item (Courses, Training, etc.)
  };

  // Filter available courses based on the search query, selected filter, and enrollment status
  const filteredAvailableCourses = (courses || []).filter(course =>
    !enrolledCourses.includes(course.id) && // Exclude courses the user is enrolled in
    course.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedFilter === 'All' || course.category === selectedFilter)
  );

  const handleMyCoursesClick = async (course) => {
    try {
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${course.id}`);
      const enrollmentSnapshot = await getDoc(enrollmentRef);
  
      if (!enrollmentSnapshot.exists()) {
        toast.error("No enrollment data found.");
        return;
      }
  
      const enrollmentData = enrollmentSnapshot.data();
  
      // Set the selected course data along with the certificateId
      setSelectedCourse({
        ...course,
        courseTitle: enrollmentData.courseTitle,
        courseDescription: enrollmentData.courseDescription || "No description available",
        pdfURLs: enrollmentData.pdfURLs || [], // Ensure pdfURLs are fetched
        videoLink: enrollmentData.videoLink || "",
        certificateId: enrollmentData.certificateId || null, // Fetch and set the certificateId
      });
  
      setIsMyCoursesModalOpen(true); // Open the modal for My Courses
    } catch (error) {
      console.error("Error fetching enrollment details:", error.message);
      toast.error("Failed to fetch enrollment details.");
    }
  };
  
// Fetch certificate template based on certificateId
const fetchCertificateTemplate = async (certificateId) => {
  try {
    const certificateRef = doc(db, "certificates", certificateId);
    const certificateDoc = await getDoc(certificateRef);

    if (certificateDoc.exists()) {
      const certificateData = certificateDoc.data();
      return certificateData.fileUrl; // Assuming the fileUrl field contains the URL to the certificate template
    } else {
      console.error("Certificate not found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching certificate template:", error);
    return null;
  }
};


  const fetchCertificateTemplateUrl = async (certificateId) => {
    try {
      const certificateRef = ref(storage, `certificates/${certificateId}.png`); // Path to the certificate template in Firebase Storage
      const url = await getDownloadURL(certificateRef);
      return url;
    } catch (error) {
      console.error("Error fetching certificate template:", error);
      return null;
    }
  };
  

 

  const handleConfirmEnroll = () => {
    setShowConfirmModal(true); // Open the confirm modal
  };

  const handleCancelEnroll = () => {
    setShowConfirmModal(false); // Close the confirm modal
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourse || !userId) {
      toast.error("No course selected or user not authenticated");
      return;
    }
  
    try {
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`); // Create a unique enrollment document based on user ID and course ID
  
      // Make sure you are also fetching certificateId from selectedCourse
      const courseCertificateId = selectedCourse.certificateId || null; // Assuming that certificateId might exist in the selectedCourse object
  
      await setDoc(enrollmentRef, {
        userId,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.courseTitle,
        courseDescription: selectedCourse.courseDescription,
        category: selectedCourse.category,
        prerequisites: selectedCourse.prerequisites || "None",
        questions: selectedCourse.questions || [], // Add questions if available
        pdfURLs: selectedCourse.pdfURLs || [], // Add PDFs if available
        videoLink: selectedCourse.videoLink || "",
        certificateId: courseCertificateId, // Store certificateId if present
        enrolledDate: new Date(),
      });
  
      toast.success(`You have been successfully enrolled in ${selectedCourse.courseTitle}!`);
  
      // Move the enrolled course to the "My Courses" section
      setMyCourses((prevMyCourses) => [...prevMyCourses, selectedCourse]); // Add to My Courses
      setEnrolledCourses((prevEnrolledCourses) => [...prevEnrolledCourses, selectedCourse.id]); // Update the enrolledCourses state to reflect the new enrollment
  
      // Optional: Close the modal after enrollment and reset the state
      setIsAvailableCoursesModalOpen(false);
      setShowConfirmModal(false); // Close confirmation modal
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast.error("Failed to enroll in the course. Please try again.");
    }
  };
  
  const handleStartQuiz = async () => {
    if (selectedCourse && attemptsUsed < maxAttempts) { // Ensure maxAttempts not exceeded
        try {
            // Fetch quiz data from enrollment (or wherever you're storing the questions)
            await fetchQuizQuestions(selectedCourse.id); // Fetch quiz data
    
            // Once the data is fetched, close the previous modal and open the quiz content modal
            setIsQuizModalOpen(false); // Close the "Ready for quiz" modal
            setIsQuizContentModalOpen(true); // Open the quiz content modal
        } catch (error) {
            console.error("Error starting quiz:", error);
            toast.error("Failed to start the quiz. Please try again.");
        }
    } else {
        toast.error("You have reached the maximum number of attempts."); // Inform the user if they exceed attempts
    }
};

const handleRetakeQuiz = async () => {
  // Increment the quiz attempts both locally and in Firestore
  const newAttempts = attemptsUsed + 1;
  setAttemptsUsed(newAttempts); // Update state locally

  // Update Firestore with the new attempts count
  const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`);
  await updateDoc(enrollmentRef, {
    quizAttempts: newAttempts
  });

  // Reset the quiz state for retake
  setCurrentQuestion(0);
  setQuizScore(0);
  setSelectedAnswers([]); // Reset all answers
  setIsResultModalOpen(false); // Close the result modal
  setIsQuizContentModalOpen(true); // Open the quiz modal to restart quiz
};

  

  const handleAnswerSelect = (questionIndex, answer) => {
    // Create a copy of selectedAnswers state
    const updatedSelectedAnswers = [...selectedAnswers];
    
    // Update the selected answer for the current question
    updatedSelectedAnswers[questionIndex] = answer;
    
    // Set the updated answers
    setSelectedAnswers(updatedSelectedAnswers);
  };
  
  
  
  
  
  const handleAvailableCoursesClick = async (course) => {
    try {
      const collectionName = course.category === "IT" ? "ITCourses" : "GeneralCourses";
      const courseDocRef = doc(db, collectionName, course.id);
      const courseSnapshot = await getDoc(courseDocRef);
  
      if (!courseSnapshot.exists()) {
        toast.error("Course details not found.");
        return;
      }
  
      const fullCourseData = courseSnapshot.data();
  
      // Make sure the certificateId is being fetched here
      const certificateId = fullCourseData.certificateId || null;
  
      setSelectedCourse({
        ...course,
        prerequisites: fullCourseData.prerequisites || [],
        questions: fullCourseData.questions || [],
        pdfURLs: fullCourseData.pdfURLs || [],
        videoLink: fullCourseData.videoLink || "",
        certificateId: certificateId, // Set the certificateId in selectedCourse
      });
  
      setIsAvailableCoursesModalOpen(true);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to fetch course details.");
    }
  };
  


  const fetchQuizQuestions = async (courseId) => {
    try {
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${courseId}`);
      const enrollmentSnap = await getDoc(enrollmentRef);
  
      if (enrollmentSnap.exists()) {
        const enrollmentData = enrollmentSnap.data();
  
        // Assuming 'questions' is an array
        if (Array.isArray(enrollmentData.questions)) {
          setQuizData(enrollmentData);  // Save the quiz data (including questions) in state
        } else {
          console.error("No questions found in the enrollment data.");
          setQuizData(null);  // If no questions, set to null
        }
      } else {
        toast.error("No enrollment data found.");
      }
    } catch (error) {
      console.error("Error fetching quiz questions:", error.message);
      toast.error("Failed to fetch quiz questions.");
    }
  };
  // When the quiz is finished, display results:
const handleFinishQuiz = () => {
  setIsQuizContentModalOpen(false); // Close the quiz content modal
  setIsResultModalOpen(true); // Open the result modal
  
  // Here you can process the user's selected answers
  console.log("User's Answers:", selectedAnswers); // This will log the user's answers
  // Compare selectedAnswers with the correct answers in quizData to display results
};

const handleShowCertificate = async () => {
  if (selectedCourse && selectedCourse.certificateId) {
    const templateUrl = await fetchCertificateTemplate(selectedCourse.certificateId); // Fetch template URL
    if (templateUrl) {
      setCertificateUrl(templateUrl); // Set the template URL
      setShowCertificateModal(true);  // Show the certificate modal
    } else {
      console.error("Certificate template not available.");
    }
  }
};


const downloadCertificateAsPDF = async () => {
  try {
    if (!selectedCourse || !selectedCourse.certificateId) {
      toast.error("Certificate information not available.");
      return;
    }

    // Fetch the fileUrl from Firestore
    const certificateDocRef = doc(db, "certificates", selectedCourse.certificateId);
    const certificateDoc = await getDoc(certificateDocRef);

    if (!certificateDoc.exists()) {
      toast.error("Certificate template not found.");
      return;
    }

    const { fileUrl } = certificateDoc.data(); // Extract the fileUrl from the document

    const input = certificateRef.current;
    if (input) {
      const image = new Image();
      image.src = fileUrl; // Use the fileUrl fetched from Firestore

      image.onload = () => {
        // Once the image is fully loaded, generate the PDF
        html2canvas(input).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'landscape',
          });

          // Add the certificate template image
          pdf.addImage(image, 'PNG', 0, 0, 297, 210); // Adjust the dimensions as needed

          // Add dynamic content for name, course title, and date
          pdf.setFontSize(40); // Larger font for the name
          pdf.text(fullName, 148, 120, { align: 'center' }); // Adjust positioning based on template
          
          pdf.setFontSize(24); // Smaller font for the course title
          pdf.text(selectedCourse?.courseTitle, 148, 145, { align: 'center' }); // Center the course title

          pdf.setFontSize(18); // Even smaller font for the date
          pdf.text(`Date: ${new Date().toLocaleDateString()}`, 148, 160, { align: 'center' }); // Center the date

          // Save the PDF
          pdf.save(`${fullName}_Certificate.pdf`);
        }).catch((error) => {
          console.error("Error generating PDF:", error);
        });
      };

      image.onerror = () => {
        toast.error("Error loading certificate image.");
      };
    }
  } catch (error) {
    console.error("Error fetching certificate URL or generating PDF:", error);
    toast.error("Failed to generate the certificate.");
  }
};







  const handleQuizStartClick = () => {
    if (selectedCourse) {
      fetchQuizDataFromEnrollment(selectedCourse.id); // Fetch quiz data from the enrollment
    }
    setIsNextModalOpen(false); // Close the next modal
    setIsQuizModalOpen(true); // Open quiz modal
  };

  
  
  
  
  

  const convertToEmbedUrl = (videoLink) => {
    if (!videoLink || typeof videoLink !== "string") {
      console.log("No valid videoLink provided.");
      return null;
    }

    const isYouTubeLink = videoLink.includes("youtube.com") || videoLink.includes("youtu.be");
    console.log("Is YouTube Link: ", isYouTubeLink, videoLink);

    if (isYouTubeLink) {
      const videoId = videoLink.split("v=")[1]?.split("&")[0] || videoLink.split("/")[3];
      console.log("Video ID: ", videoId);
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return videoLink;
  };

  return (
    <div className="IT-user-course-layout">
      <div className="IT-user-course-sidebar">
        <div className="IT-user-course-header">
          <img className="IT-user-course-logo" alt="Group" src={BPOLOGO} />
        </div>
        <nav className="IT-user-course-nav">
          <div
            className={`IT-user-course-nav-item ${selectedNav === 'courses' ? 'active' : ''}`}
            role="button"
            tabIndex="1"
            onClick={() => handleNavClick('courses')}
          >
            <div className="IT-user-course-icon-container">
              <img
                className="IT-user-course-icon2"
                alt="Courses Icon"
                src={selectedNav === 'courses' ? CoursePick : CourseDefault}
              />
            </div>
            Courses
          </div>

          <div
            className={`IT-user-course-nav-item ${selectedNav === 'training' ? 'active' : ''}`}
            role="button"
            tabIndex="2"
            onClick={() => handleNavClick('training')}
          >
            <div className="IT-user-course-icon-container">
              <img
                className="IT-user-course-icon3"
                alt="Training Icon"
                src={selectedNav === 'training' ? TrainingPick : TrainingDefault}
              />
            </div>
            Training
          </div>

          <div
            className={`IT-user-course-nav-item ${selectedNav === 'certificates' ? 'active' : ''}`}
            role="button"
            tabIndex="3"
            onClick={() => handleNavClick('certificates')}
          >
            <div className="IT-user-course-icon-container">
              <img
                className="IT-user-course-icon4"
                alt="Certificates Icon"
                src={selectedNav === 'certificates' ? CertPick : CertDefault}
              />
            </div>
            Certificates
          </div>
        </nav>
        <div
          className={`IT-user-course-nav-logout ${selectedNav === 'logout' ? 'active' : ''}`}
          role="button"
          tabIndex="4"
          onClick={handleLogout}
        >
          <div className="IT-user-course-icon-container">
            <img
              className="IT-user-course-icon4"
              alt="Logout Icon"
              src={selectedNav === 'logout' ? LogoutPick : LogoutDefault}
            />
          </div>
          Logout
        </div>
      </div>
      <div className="IT-user-course-content">
        <h1>Hi, {fullName}</h1>

        {selectedNav === 'courses' && (
          <>
            {/* My Courses Section */}
            <div className="IT-user-course-my-courses-section">
              <h2>My Courses</h2>
              <div className="IT-user-course-course-container">
                {myCourses.length > 0 ? (
                  myCourses.map((course) => (
                    <div 
                      className="IT-user-course-course-card clickable"  // Added 'clickable' class to make styling easier
                      key={course.id}
                      onClick={() => handleMyCoursesClick(course)} 
                      style={{ cursor: "pointer" }} // Optional: Change cursor to indicate it's clickable
                    >
                      <h3>{course.courseTitle}</h3>
                      <p className="IT-user-course-course-description">{course.courseDescription}</p>
                      <div className="IT-user-course-category-text">Category</div>
                      <div className="IT-user-course-category-label">{course.category}</div>
                    </div>
                  ))
                ) : (
                  <p>No courses enrolled yet.</p>
                )}
              </div>
            </div>

            {/* Available Courses Section */}
            <div className="IT-user-course-available-section">
              <h2>Available Courses</h2>
              <div className="IT-user-course-course-container">
                {filteredAvailableCourses.length > 0 ? (
                  filteredAvailableCourses.map((course) => (
                    <div className="IT-user-course-course-card" key={course.id} onClick={() => handleAvailableCoursesClick(course)}>
                      <h3>{course.courseTitle}</h3>
                      <p className="IT-user-course-course-description">{course.courseDescription}</p>
                      <div className="IT-user-course-category-text">Category</div>
                      <div className="IT-user-course-category-label">{course.category}</div>
                    </div>
                  ))
                ) : (
                  <p>No available courses found.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* My Courses Modal */}
{isMyCoursesModalOpen && selectedCourse && (
  <div className="IT-user-course-modal-overlay">
    <div className="IT-user-course-mycourse-content">
      
      {/* Modal Header */}
      <div className="IT-user-course-mycourse-header">
        <h2 className="IT-user-course-mycourse-title">
          {selectedCourse.courseTitle}
        </h2>
        <button className="IT-user-course-mycourse-close-button" onClick={() => setIsMyCoursesModalOpen(false)}>X</button>
      </div>

      {/* Modal Body */}
      <div className="IT-user-course-mycourse-body">
        <p className="IT-user-course-description">
          <strong>Description:</strong> {selectedCourse.courseDescription}
        </p>

        {/* Display PDF Preview */}
        {Array.isArray(selectedCourse.pdfURLs) && selectedCourse.pdfURLs.length > 0 && (
          <div className="IT-user-course-mycourse-pdf-container">
            <h4>PDF Resource:</h4>
            <iframe
              src={selectedCourse.pdfURLs[0]}
              title="PDF Preview"
            />
          </div>
        )}

        {/* Downloadable PDF Section */}
        {Array.isArray(selectedCourse.pdfURLs) && selectedCourse.pdfURLs.length > 0 && (
          <div className="IT-user-course-mycourse-resource-container">
            <h4>Resources:</h4>
            {selectedCourse.pdfURLs.map((pdfUrl, index) => {
              const fileName = decodeURIComponent(pdfUrl).split('/').pop().split('?')[0];
              return (
                <div key={index} className="pdf-item">
                  <a href={pdfUrl} download target="_blank" rel="noopener noreferrer" className="pdf-link">
                    <img src={PdfIcon} alt="PDF Icon" className="IT-user-course-pdf-icon" />
                    <span className="pdf-filename">{fileName}</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="IT-user-course-mycourse-footer">
        <button onClick={handleNextClick}>Next</button>
      </div>
    </div>
  </div>
)}

{/* Next Modal */}
{isNextModalOpen && selectedCourse && (
  <div className="IT-user-course-modal-overlay">
    <div className="IT-user-course-next-content">
      <button onClick={() => setIsNextModalOpen(false)} className="close-button">X</button>
      
      {/* Modal Header */}
      <div className="IT-user-course-next-header">
        <h2>{selectedCourse.courseTitle}</h2>
      </div>

      {/* Modal Body */}
      <div className="IT-user-course-next-body">
        {selectedCourse.videoLink ? (
          <div className="IT-user-course-next-video-container">
            <h4>Video Resource</h4>
            <iframe
              src={convertToEmbedUrl(selectedCourse.videoLink)}
              title={selectedCourse.courseTitle}
              allowFullScreen
            />
          </div>
        ) : (
          <p>No video resource available.</p>
        )}
      </div>

      {/* Modal Footer */}
      <div className="IT-user-course-next-footer">
        <button onClick={handleQuizStartClick}>Next Page ➔</button>
      </div>
    </div>
  </div>
)}


    {/* Quiz Modal - Start Quiz Modal */}
    {isQuizModalOpen && (
  <div className="quiz-modal-overlay">
    <div className="quiz-modal-content">
      <button onClick={handleCloseQuizModal} className="quiz-close-button">X</button>
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" 
        alt="Quiz Icon" 
        className="quiz-icon" 
      />
      <h2 className="quiz-title">Ready for quiz</h2>
      <p className="quiz-description">
        Test yourself on the skills in this course for what you already know!
      </p>
      <p className="quiz-questions">{numberOfQuestions} Questions Only</p>
      <p className="quiz-attempts">{attemptsUsed}/{maxAttempts} Attempts</p>

      {/* Disable start button if max attempts are reached */}
      <button 
        className="quiz-start-button" 
        onClick={handleStartQuiz} 
        disabled={attemptsUsed >= maxAttempts}
      >
        Start Quiz
      </button>

      {/* Show message if attempts are exhausted */}
      {attemptsUsed >= maxAttempts && (
        <p style={{ color: 'red' }}>Maximum attempts reached. You cannot retake the quiz.</p>
      )}
    </div>
  </div>
)}



{/* Quiz Content Modal */}
{isQuizContentModalOpen && quizData && (
  <div className="quiz-content-modal-overlay">
    <div className="quiz-content-modal">
      <h2>{selectedCourse.courseTitle}</h2>
      {quizData.questions[currentQuestion] && (
        <div>
          <h3>{quizData.questions[currentQuestion].question}</h3>
          <ul>
            {quizData.questions[currentQuestion].choices.map((choice, index) => (
              <li key={index}>
                <input
                  type="radio"
                  id={`choice_${index}`}
                  name={`quiz-question-${currentQuestion}`}
                  value={String.fromCharCode(65 + index)} // A, B, C, D
                  onChange={() => handleAnswerSelect(currentQuestion, String.fromCharCode(65 + index))} // Track answer for the current question
                  checked={selectedAnswers[currentQuestion] === String.fromCharCode(65 + index)} // Maintain the selected option
                />
                <label htmlFor={`choice_${index}`}>
                  {String.fromCharCode(65 + index)}. {choice}
                </label>
              </li>
            ))}
          </ul>
          <p>{currentQuestion + 1} of {quizData.questions.length} Questions</p>
          <button
            className="quiz-next-button"
            onClick={() => {
              // Check if the selected answer is correct before moving to the next question
              if (selectedAnswers[currentQuestion] === quizData.questions[currentQuestion].correctAnswer) {
                setQuizScore((prevScore) => prevScore + 1); // Increment score if the answer is correct
              }
              
              if (currentQuestion < quizData.questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
              } else {
                // Finish quiz and show results
                setIsQuizContentModalOpen(false);
                setIsResultModalOpen(true);
              }
            }}
            disabled={!selectedAnswers[currentQuestion]} // Disable the next button if no answer is selected
          >
            {currentQuestion < quizData.questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </button>
        </div>
      )}
    </div>
  </div>
)}



{/* Result Modal */}
{isResultModalOpen && (
  <div className="result-modal-overlay">
    <div className="result-modal">
      <h2>{selectedCourse.courseTitle}</h2>
      <div className="result-modal-content">
        {quizScore >= (quizData.questions.length * 0.8) ? (
          // Passed Modal
          <>
            <img src={verifiedGif} alt="Verified Icon" className="result-icon" />
            <h3>Congratulations, you passed!</h3>
            <p>Your Score: {quizScore}/{quizData.questions.length}</p>
            <button 
              className="view-result-button" 
              onClick={() => {
                setIsResultModalOpen(false);
                setShowDetailedResults(true);
              }}
            >
              View Result
            </button>
            <button 
              className="next-page-button" 
              onClick={() => {
                setIsResultModalOpen(false);
                setShowCongratsModal(true);
              }}
            >
              Next Page
            </button>
          </>
        ) : (
          // Failed Modal
          <>
            <img src={sadGif} alt="Sad Icon" className="result-icon" />
            <h3>Nice Try, a little more effort.</h3>
            <p>Your Score: {quizScore}/{quizData.questions.length}</p>
            <button 
              className="view-result-button" 
              onClick={() => {
                setIsResultModalOpen(false);
                setShowDetailedResults(true);
              }}
            >
              View Result
            </button>
            <button 
              className="retake-button" 
              onClick={() => {
                if (attemptsUsed < maxAttempts) {
                  // Allow retake if attempts are still available
                  setCurrentQuestion(0);
                  setQuizScore(0);
                  setSelectedAnswers([]); // Reset selected answers
                  setAttemptsUsed((prevAttempts) => prevAttempts + 1); // Increment attempts
                  setIsResultModalOpen(false); // Close the result modal
                  setIsQuizContentModalOpen(true); // Reopen the quiz content modal
                } else {
                  // Disable retake if attempts are maxed out
                  toast.error("No more attempts left for this quiz.");
                }
              }}
              disabled={attemptsUsed >= maxAttempts} // Disable retake button if max attempts reached
            >
              {attemptsUsed >= maxAttempts ? "No More Attempts" : "Retake Quiz"}
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}



{showCongratsModal && (
        <div className="congrats-modal-overlay">
          <div className="congrats-modal">
            <h2>Congratulations!</h2>
            <img src={trophyGif} alt="Trophy Icon" />
            <p>
              Congratulations on successfully completing the course and reaching this incredible milestone in your learning journey!
            </p>
            <button className="continue-button" onClick={handleShowCertificate}>
              Continue
            </button>
          </div>
        </div>
      )}

{/* Certificate Modal */}
{showCertificateModal && certificateUrl && (
  <div className="certificate-modal-overlay">
    <div className="certificate-modal">
      <h2>Course Completion Certificate</h2>
      <div className="certificate-content" ref={certificateRef} style={{ position: 'relative' }}>
        {/* Display the certificate template */}
        <img src={certificateUrl} alt="Certificate Template" className="certificate-template" style={{ width: '100%', height: 'auto' }} />

        {/* Overlay Course Title */}
        <div
          style={{
            position: 'absolute',
            top: '45%', // Adjust the vertical position as per template
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '30px', // Adjust the font size
            fontWeight: 'bold',
            color: '#000',
          }}
        >
          {selectedCourse?.courseTitle}
        </div>

        {/* Overlay User's full name */}
        <div
          style={{
            position: 'absolute',
            top: '55%', // Adjust the vertical position as per template
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#000',
          }}
        >
          {fullName}
        </div>

        {/* Overlay Date */}
        <div
          style={{
            position: 'absolute',
            top: '65%', // Adjust the vertical position as per template
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '18px',
            color: '#000',
          }}
        >
          Date: {new Date().toLocaleDateString()}
        </div>
      </div>
      <button onClick={downloadCertificateAsPDF}>Download as PDF</button>
      <button onClick={() => setShowCertificateModal(false)}>Close</button>
    </div>
  </div>
)}





     




        {/* Available Courses Modal */}
        {isAvailableCoursesModalOpen && selectedCourse && (
          <div className="IT-user-course-modal">
            <div className="IT-user-course-modal-content">
              <div className="IT-user-course-modal-header">
                <h2>{selectedCourse.courseTitle}</h2>
                <button className="IT-user-course-close-button" onClick={() => setIsAvailableCoursesModalOpen(false)}>X</button>
              </div>

              <div className="IT-user-course-modal-body">
                <img src={Category_IT} alt="Course visual" className="IT-user-course-modal-image" />
                <p>{selectedCourse.courseDescription}</p>
                <div className="IT-user-course-course-details">
                  <h4>Prerequisite: <span className="IT-user-course-prerequisite">
                    {selectedCourse.prerequisites?.length > 0 ? selectedCourse.prerequisites.join(', ') : "None"}
                  </span></h4>
                  <h5>Category: <span className="IT-user-course-category">{selectedCourse.category}</span></h5>
                </div>
              </div>

              <div className="IT-user-course-modal-footer">
                <button className="IT-user-course-enroll-button" onClick={handleConfirmEnroll}>Enroll Course</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Enroll Modal */}
        {showConfirmModal && (
          <div className="IT-user-course-confirm-overlay">
            <div className="IT-user-course-confirm-modal">
              <div className="IT-user-course-modal-header">
                Confirm Enrollment
              </div>

              <div className="IT-user-course-modal-body">
                <p>Are you sure you want to enroll in {selectedCourse?.courseTitle}?</p>
              </div>

              <div className="IT-user-course-modal-footer">
                <button className="IT-user-course-cancel-button" onClick={handleCancelEnroll}>
                  No
                </button>
                <button className="IT-user-course-confirm-button" onClick={handleEnrollCourse}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ITUser;
