import React, { useState, useEffect,useRef} from 'react';
import { db, auth } from "../firebase"; // Ensure Firebase is properly configured
import {
  setDoc, doc, getDocs, query, where, collection, getDoc, updateDoc, deleteDoc, onSnapshot
} from "firebase/firestore";

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
import { useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import UserDefault from '../assets/userdefault.png';
import {  uploadString} from "firebase/storage"; 






const ITUser = ({
  handleLogout,
 
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
const [showDetailedResults, setShowDetailedResults] = useState(false);
const [showCongratsModal, setShowCongratsModal] = useState(false);
const [showCertificateModal, setShowCertificateModal] = useState(false);
const { createCanvas, loadImage } = require('canvas');
const [quizSaved, setQuizSaved] = useState(false); // New state to track if the quiz result is saved
const [showPassedQuizModal, setShowPassedQuizModal] = useState(false);
const [passedCourses, setPassedCourses] = useState([]); // Store IDs of passed courses
const [isOpen, setIsOpen] = useState(true);
const [selectedSection, setSelectedSection] = useState('courses');
const [prerequisiteResults, setPrerequisiteResults] = useState([]);
const [quizResults, setQuizResults] = useState([]); // State to hold quiz results
const [certifications, setCertifications] = useState([]); // State to hold certifications
const [quizResult, setQuizResult] = useState(null); 
const [fullName, setFullName] = useState(''); // Initialize fullName with an empty string

const [certificateUrl, setCertificateUrl] = useState(null); // Certificate template URL from Firebase
  const certificateRef = useRef(null); // Reference to the certificate DOM element




const navigate = useNavigate();










// State to store the user's selected answers
const [selectedAnswers, setSelectedAnswers] = useState([]);




  const userId = auth.currentUser?.uid; // Assuming the user is authenticated, get the user ID
  // Fetch enrolled courses and available courses (General and IT) from Firebase when the component mounts
  useEffect(() => {
    if (userId) {
      // Real-time listener for enrolled courses
      const enrollmentQuery = query(collection(db, "Enrollments"), where("userId", "==", userId));
      const unsubscribeEnrolled = onSnapshot(enrollmentQuery, (snapshot) => {
        const enrolledCoursesFromFirebase = snapshot.docs.map(doc => ({
          id: doc.data().courseId,
          courseTitle: doc.data().courseTitle,
          courseDescription: doc.data().courseDescription || "No description available",
          category: doc.data().category || "Uncategorized",
          pdfURLs: doc.data().pdfURLs || [],
          videoLink: doc.data().videoLink || "",
          certificateId: doc.data().certificateId || null,
          enrolledDate: doc.data().enrolledDate?.toDate() || null,
        }));

        setMyCourses(enrolledCoursesFromFirebase);
        setEnrolledCourses(enrolledCoursesFromFirebase.map(course => course.id));
      }, (error) => {
        console.error("Error fetching enrolled courses in real-time:", error.message);
        toast.error("Failed to fetch enrolled courses.");
      });

      // Real-time listener for IT and General courses
      const unsubscribeITCourses = onSnapshot(collection(db, "ITCourses"), (snapshot) => {
        const itCourses = snapshot.docs.map(doc => ({
          id: doc.id,
          courseTitle: doc.data().courseTitle,
          courseDescription: doc.data().courseDescription || "No description available",
          category: "IT",
        }));
        setCourses(prevCourses => [...prevCourses.filter(course => course.category !== 'IT'), ...itCourses]);
      }, (error) => {
        console.error("Error fetching IT courses in real-time:", error.message);
        toast.error("Failed to fetch IT courses.");
      });

      const unsubscribeGeneralCourses = onSnapshot(collection(db, "GeneralCourses"), (snapshot) => {
        const generalCourses = snapshot.docs.map(doc => ({
          id: doc.id,
          courseTitle: doc.data().courseTitle,
          courseDescription: doc.data().courseDescription || "No description available",
          category: "General",
        }));
        setCourses(prevCourses => [...prevCourses.filter(course => course.category !== 'General'), ...generalCourses]);
      }, (error) => {
        console.error("Error fetching General courses in real-time:", error.message);
        toast.error("Failed to fetch General courses.");
      });

      // Cleanup listeners when component unmounts
      return () => {
        unsubscribeEnrolled();
        unsubscribeITCourses();
        unsubscribeGeneralCourses();
      };
    }
  }, [userId]);


  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          const userDocRef = doc(db, "Users", userId); // Assume 'Users' collection contains user data
          const userDoc = await getDoc(userDocRef);
  
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName || 'Anonymous'); // Assuming 'fullName' field is present
          } else {
            console.error("No such user data found.");
            setFullName('Anonymous');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
  
    fetchUserData();
  }, [userId]);
  


  useEffect(() => {
    // Fetch quiz result in real-time when the component loads or when userId or selectedCourse changes
    if (userId && selectedCourse) {
      const quizResultRef = doc(db, "QuizResults", `${userId}_${selectedCourse.id}`);

      const unsubscribeQuizResult = onSnapshot(quizResultRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setQuizResult(data);
          setQuizScore(data.score);  // Set quiz score from Firestore
          setQuizSaved(true);  // Mark quiz as saved since data exists
          setIsResultModalOpen(true);  // Open result modal when data is available
        } else {
          console.log("No quiz result data found.");
        }
      }, (error) => {
        console.error("Error fetching quiz result:", error.message);
        toast.error("Failed to fetch quiz result.");
      });

      // Cleanup on component unmount
      return () => {
        unsubscribeQuizResult();
      };
    }
  }, [userId, selectedCourse]);

  // Function to handle next page after passing quiz
  useEffect(() => {
    const fetchQuizData = async () => {
      if (userId && selectedCourse) {
        const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`);
        try {
          const enrollmentSnap = await getDoc(enrollmentRef);
          if (enrollmentSnap.exists()) {
            const enrollmentData = enrollmentSnap.data();
            setQuizData(enrollmentData); // Store the quiz data
          } else {
            console.error("No enrollment data found.");
          }
        } catch (error) {
          console.error("Error fetching quiz data:", error);
        }
      }
    };
  
    fetchQuizData();
  }, [userId, selectedCourse]); 

  useEffect(() => {
    const fetchCertificate = async () => {
      if (selectedCourse?.certificateId) {
        const url = await fetchCertificateTemplateUrl(selectedCourse.certificateId);
        setCertificateUrl(url);
      }
    };
    
    fetchCertificate();
  }, [selectedCourse]);



const uploadCertificateToFirebase = async (pngDataUrl) => {
  try {
    // Create a reference to the Firebase storage location where you want to store the PNG
    const storageRef = ref(storage, `certificates/${fullName}_Certificate_with_Design.png`);
    
    // Upload the PNG file as a base64 URL string
    const snapshot = await uploadString(storageRef, pngDataUrl, 'data_url');
    
    // Get the download URL for the uploaded certificate
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading certificate:", error);
    return null;
  }
};

const downloadCertificateAsImageWithDesign = () => {
  if (!certificateUrl) {
    console.error('No certificate template URL available.');
    return;
  }

  // Create a new Image element to load the certificate template (design background)
  const img = new Image();
  img.crossOrigin = 'anonymous'; // Ensure CORS is handled for external images
  img.src = certificateUrl; // Set the certificate design image URL

  img.onload = async () => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match the loaded image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the template image onto the canvas
    context.drawImage(img, 0, 0, img.width, img.height);

    // Customize the text style for the course title
    context.font = 'bold 40px Arial';
    context.fillStyle = '#4CAF50'; // Green color for the course title
    context.textAlign = 'center';

    // Add the course title
    context.fillText(`FOR ${selectedCourse?.courseTitle || 'Course Title'}`, canvas.width / 2, canvas.height / 2 - 50);

    // Customize the text style for the full name
    context.font = 'bold 36px Arial';
    context.fillStyle = '#000'; // Black color for the name

    // Add the user's full name
    context.fillText(`${fullName || 'Full Name'}`, canvas.width / 2, canvas.height / 2);

    // Customize the text style for the date
    context.font = 'bold 28px Arial';
    context.fillStyle = '#000'; // Black color for the date

    // Add the date
    const date = new Date().toLocaleDateString();
    context.fillText(`Date: ${date}`, canvas.width / 2, canvas.height / 2 + 50);

    // Convert the final canvas content to a PNG image data URL
    const imgData = canvas.toDataURL('image/png');

    // Upload the certificate PNG to Firebase
    const downloadUrl = await uploadCertificateToFirebase(imgData);

    if (downloadUrl) {
      // Create a link element to trigger the download from Firebase
      const link = document.createElement('a');
      link.href = downloadUrl; // Use the Firebase download URL
      link.download = `${fullName}_Certificate_with_Design.png`; // Set the file name using the user's full name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // Clean up the DOM after triggering the download
    } else {
      console.error("Error: Certificate download URL not available.");
    }
  };

  img.onerror = () => {
    console.error('Failed to load the certificate template image.');
  };
};
 

 
  const fetchCertificateTemplateUrl = async (certificateId) => {
    try {
      const certificateRef = ref(storage, `certificates/${certificateId}.png`); // Path to certificate in storage
      const url = await getDownloadURL(certificateRef);
      return url;
    } catch (error) {
      console.error("Error fetching certificate template:", error);
      return null;
    }
  };


  
  const fetchQuizDataFromEnrollment = async (courseId) => {
    try {
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${courseId}`);
      const enrollmentSnap = await getDoc(enrollmentRef);
  
      if (enrollmentSnap.exists()) {
        const enrollmentData = enrollmentSnap.data();
        
        // Assuming you have an array of questions in the enrollment data
        if (Array.isArray(enrollmentData.questions)) {
          const questionCount = enrollmentData.questions.length;
          setNumberOfQuestions(questionCount);
        } else {
          setNumberOfQuestions(0); // Fallback if no questions array is present
        }
  
        const quizAttempts = enrollmentData.quizAttempts || 0;
        setAttemptsUsed(quizAttempts); // Set the attempts used
  
        // Fetch the quiz result if it exists
        const resultRef = doc(db, "QuizResults", `${userId}_${courseId}`);
        const resultSnap = await getDoc(resultRef);
        if (resultSnap.exists()) {
          const resultData = resultSnap.data();
          setQuizScore(resultData.score || 0);  // Set the initial score if exists
        }
  
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
  
  
   

const fetchCertificateTemplate = async (certificateId) => {
  try {
    if (!certificateId) {
      throw new Error("No certificate ID provided.");
    }

    const certificateRef = doc(db, "certificates", certificateId); // Assuming 'certificates' is the collection
    const certificateSnap = await getDoc(certificateRef);

    if (certificateSnap.exists()) {
      const certificateData = certificateSnap.data();
      return certificateData.fileUrl; // Assuming the certificate data contains a 'fileUrl' field
    } else {
      throw new Error("Certificate not found.");
    }
  } catch (error) {
    console.error("Error fetching certificate template:", error);
    return null;
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




  // Filter available courses based on the search query, selected filter, and enrollment status
  const filteredAvailableCourses = (courses || []).filter(course =>
    !enrolledCourses.includes(course.id) && // Exclude courses the user is enrolled in
    course.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedFilter === 'All' || course.category === selectedFilter)
  );

  const handleMyCoursesClick = async (course) => {
    try {
      if (!course) return;
  
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${course.id}`);
      const enrollmentSnapshot = await getDoc(enrollmentRef);
  
      if (!enrollmentSnapshot.exists()) {
        toast.error("No enrollment data found for this user.");
        return;
      }
  
      const enrollmentData = enrollmentSnapshot.data();
  
      // Set the selected course data
      setSelectedCourse({
        ...course,
        courseTitle: enrollmentData.courseTitle,
        courseDescription: enrollmentData.courseDescription || "No description available",
        pdfURLs: enrollmentData.pdfURLs || [],
        videoLink: enrollmentData.videoLink || "",
        certificateId: enrollmentData.certificateId || null,
      });
  
      // Fetch the quiz result for the course
      const quizResultRef = doc(db, "QuizResults", `${userId}_${course.id}`);
      const quizResultSnapshot = await getDoc(quizResultRef);
  
      if (quizResultSnapshot.exists()) {
        const quizResultData = quizResultSnapshot.data();
        setQuizResult(quizResultData);  // Set the quiz result to be displayed
  
        // Show the result modal
        setIsResultModalOpen(true);
      } else {
        // No quiz result, proceed with the normal course modal or flow
        setIsMyCoursesModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching enrollment details:", error.message);
      toast.error("Failed to fetch enrollment details.");
    }
  };


  
  
// Function to handle the retake process
const handleRetakeCourse = async () => {
  try {
    if (!selectedCourse || !userId) {
      toast.error("No course selected or user not authenticated");
      return;
    }

    // Delete the quiz result from Firestore
    const quizResultRef = doc(db, "QuizResults", `${userId}_${selectedCourse.id}`);
    await deleteDoc(quizResultRef); // Use deleteDoc to remove the quiz result

    // Reset local state related to the quiz
    setAttemptsUsed(0);  // Reset attempts
    setQuizScore(0);     // Reset score
    setSelectedAnswers([]);  // Clear selected answers
    setCurrentQuestion(0);   // Reset the current question index

    // Close the passed quiz modal
    setShowPassedQuizModal(false);

    // Open the "My Courses" modal again so the user can retake the course
    setIsMyCoursesModalOpen(true);

    toast.success("Quiz deleted. You can now retake the course.");
  } catch (error) {
    console.error("Error deleting quiz data:", error);
    toast.error("Failed to delete quiz data.");
  }
};

  

  
  
  const downloadCertificateTemplateAsImage = () => {
    if (!certificateUrl) {
      console.error('No certificate template URL available.');
      return;
    }
  
    // Create a link element, trigger download of the background image
    const link = document.createElement('a');
    link.href = certificateUrl; // The URL of the certificate template image
    link.download = `Certificate_Template.png`; // The name for the downloaded image
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up the DOM after triggering the download
  };
  
  


  const downloadCertificateAsImage = () => {
    const input = certificateRef.current; // Reference to the certificate DOM element
  
    if (!input) {
      console.error('No certificate reference available.');
      return;
    }
  
    html2canvas(input, {
      scale: 2, // Increase scale for better quality
      useCORS: true // Handle external images with CORS
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png'); // Get the image data from the canvas
  
        // Create a link element, trigger download
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${fullName}_Certificate.png`; // Name the image file using the user's full name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Clean up the DOM after triggering the download
      })
      .catch((error) => {
        console.error('Error generating image:', error);
      });
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
  
    // Check if the course is already enrolled
    if (enrolledCourses.includes(selectedCourse.id)) {
      toast.error("You are already enrolled in this course.");
      setIsAvailableCoursesModalOpen(false);
      return;
    }
  
    try {
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`); // Create a unique enrollment document based on user ID and course ID
  
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
  
      // Do not yet add the course to `myCourses` here, we'll do this later when the quiz starts
  
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

const checkIfQuizPassed = async (courseId, courseTitle) => {
  try {
    const quizResultRef = doc(db, "QuizResults", `${userId}_${courseId}`);
    const quizResultSnap = await getDoc(quizResultRef);
    if (quizResultSnap.exists()) {
      const quizData = quizResultSnap.data();
      if (quizData.passed) {
        setPassedCourses((prevPassedCourses) => [...prevPassedCourses, courseId]); // Add course ID to passed courses
      }
    }
  } catch (error) {
    console.error("Error checking quiz result:", error.message);
  }
};





const handleRetakeQuiz = async () => {
  const newAttempts = attemptsUsed + 1;
  setAttemptsUsed(newAttempts); // Update state locally

  // Update Firestore with the new attempts count for the specific user
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

  // Check if the answer is correct and update the score
  if (answer === quizData.questions[questionIndex].correctAnswer) {
      setQuizScore(prevScore => prevScore + 1); // Increment the score if the answer is correct
  }
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
      
      // Fetch prerequisite course IDs
      const prerequisiteIds = fullCourseData.prerequisites || [];
  
      // Fetch the titles of the prerequisite courses
      const prerequisiteTitles = await Promise.all(
        prerequisiteIds.map(async (prereqId) => {
          const prereqCourseRef = doc(db, "ITCourses", prereqId);
          const prereqCourseSnap = await getDoc(prereqCourseRef);
          if (prereqCourseSnap.exists()) {
            return prereqCourseSnap.data().courseTitle;
          }
          return "Unknown Course"; // Fallback for missing data
        })
      );
  
      // Check if the user has passed the prerequisites by looking into QuizResults
      const prerequisiteResults = await Promise.all(
        prerequisiteIds.map(async (prereqId) => {
          const quizResultRef = doc(db, "QuizResults", `${userId}_${prereqId}`);
          const quizResultSnap = await getDoc(quizResultRef);
  
          if (quizResultSnap.exists()) {
            const quizResultData = quizResultSnap.data();
            return quizResultData.passed; // Return true if passed
          }
          return false; // Return false if no quiz result exists
        })
      );
  
      // Set the prerequisiteTitles and prerequisiteResults in the state
      setSelectedCourse({
        ...course,
        prerequisites: prerequisiteTitles.length > 0 ? prerequisiteTitles : "None",
        prerequisiteResults, // Store the results for later use
        questions: fullCourseData.questions || [],
        pdfURLs: fullCourseData.pdfURLs || [],
        videoLink: fullCourseData.videoLink || "",
        certificateId: fullCourseData.certificateId || null,
      });
  
      setIsAvailableCoursesModalOpen(true); // Open the modal with course details
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
  // Function to handle quiz submission
  const handleFinishQuiz = async () => {
    setIsQuizContentModalOpen(false); // Close the quiz content modal
    setIsResultModalOpen(true); // Open the result modal
    
    const passed = quizScore >= (quizData.questions.length * 0.8);
  
    const quizResult = {
      userId,
      fullName,
      courseTitle: selectedCourse.courseTitle,
      score: quizScore,
      totalQuestions: quizData.questions.length,
      passed,
      timestamp: new Date(),
    };
  
    try {
      const resultRef = doc(db, "QuizResults", `${userId}_${selectedCourse.id}`);
      await setDoc(resultRef, quizResult); // Save to Firebase
      console.log("Quiz result saved successfully!");
      setQuizSaved(true); // Mark as saved
  
      if (passed) {
        setPassedCourses((prevPassedCourses) => [...prevPassedCourses, selectedCourse.id]); // Add to passed courses
        toast.success("Congratulations! You passed the quiz.");
      } else {
        toast.error("You did not pass the quiz.");
      }
    } catch (error) {
      console.error("Error saving quiz result:", error.message);
      toast.error("Failed to save quiz result.");
    }
  };
  

  
  

  
  
  
  

  const handleShowCertificate = async () => {
    try {
      if (!selectedCourse || !selectedCourse.certificateId) {
        toast.error("Certificate information is incomplete.");
        return;
      }
  
      // Fetch the certificate template URL based on the certificate ID
      const templateUrl = await fetchCertificateTemplate(selectedCourse.certificateId);
      
      if (templateUrl) {
        setCertificateUrl(templateUrl); // Set the certificate URL in state
        setShowCertificateModal(true);  // Show the certificate modal
        setShowCongratsModal(false);  // Close the congratulations modal
      } else {
        toast.error("Certificate template not available.");
      }
    } catch (error) {
      console.error("Error showing certificate:", error);
      toast.error("An error occurred while fetching the certificate.");
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

  const handleNextPageAfterPass = async () => {
    try {
        if (!selectedCourse || !userId) {
            toast.error("Course or user information is missing.");
            return;
        }

        // Check if the quiz result is already saved
        if (!quizSaved) {
            // Prepare the quiz result data
            const quizResult = {
                userId: userId,
                fullName: fullName,
                courseTitle: selectedCourse.courseTitle,
                score: quizScore,
                totalQuestions: quizData.questions.length,
                passed: quizScore >= (quizData.questions.length * 0.8),
                timestamp: new Date(),
            };

            // Save the quiz result to Firebase
            const resultRef = doc(db, "QuizResults", `${userId}_${selectedCourse.id}`);
            await setDoc(resultRef, quizResult);
            console.log("Quiz result saved successfully!");

            // Mark the quiz as saved to avoid multiple saves
            setQuizSaved(true);

            // Optionally, add the course to the passed courses
            setPassedCourses((prevPassedCourses) => [...prevPassedCourses, selectedCourse.id]);

            toast.success("Your quiz result has been saved!");
        }

        // Keep the congrats modal open and proceed to the next step
        // Do not close the congrats modal here
       
    } catch (error) {
        console.error("Error during the next page process:", error);
        toast.error("An error occurred while processing the next page.");
    }
};


  

  const handleFetchAndCertifyUser = async () => {
    if (!selectedCourse || !userId) {
      toast.error("Course or user information is missing.");
      return;
    }
  
    try {
      // Ensure that the certificate ID is available in the selectedCourse object
      const courseCertificateId = selectedCourse.certificateId;
      if (!courseCertificateId) {
        throw new Error("Certificate ID is missing from the course.");
      }
  
      // Fetch the certificate template URL from Firestore using the certificateId
      const certificateUrl = await fetchCertificateTemplate(courseCertificateId);
  
      if (!certificateUrl) {
        throw new Error("Failed to fetch certificate template.");
      }
  
      // Update the user's certification status in Firestore
      const certificationData = {
        userId,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.courseTitle,
        certifiedDate: new Date(),
        certificateUrl, // Save the fetched certificate URL
        certificateId: courseCertificateId, // Add the certificate ID to the data
      };
  
      const certificationRef = doc(db, "Certifications", `${userId}_${selectedCourse.id}`);
      await setDoc(certificationRef, certificationData);
  
      toast.success("You have been certified!");
  
    } catch (error) {
      console.error("Error during certification process:", error);
      toast.error("Failed to certify the user.");
    }
  };
  

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  const handleResize = () => {
    if (window.innerWidth > 768) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };
  
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  return (
    <div className="admin-super-container">
      <nav className={`sidebar-super ${isOpen ? 'open-super' : ''}`}>
        <div className="logo-super">
          <img src={BPOLOGO} alt="Company Logo" />
        </div>
        <ul className="nav-links-super">
          <li>
            <button
              onClick={() => handleSectionChange('courses')}
              className={`nav-button-super ${selectedSection === 'courses' ? 'active-super' : ''}`}
            >
              <img src={CourseDefault} alt="Courses" className="nav-icon-super" />
              <span>Courses</span>
            </button> 
          </li>
          <li>
            <button
              onClick={() => navigate('/it-user-training')}
              className={`nav-button-super ${selectedSection === 'training' ? 'active-super' : ''}`}
            >
              <img src={TrainingDefault} alt="Training" className="nav-icon-super" />
              <span>Training</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/it-user-certificate')}
              className={`nav-button-super ${selectedSection === 'cert' ? 'active-super' : ''}`}
            >
              <img src={CertDefault} alt="Certificates" className="nav-icon-super" />
              <span>Certificates</span>
            </button>
          </li>
        </ul>
        <div className="logout-super">
          <button className="nav-button-super" onClick={handleLogout}>
            <img src={LogoutDefault} alt="Logout Icon" className="nav-icon-super" />
            Logout
          </button>
        </div>
      </nav>

      <button className="hamburger-super" onClick={toggleSidebar}>
        ☰
      </button>

      <div className="content-super">
  <h1>Hello, {fullName || 'IT user'}!</h1>

        {selectedSection === 'courses' && (
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
              <div className="it-useravailable-course-container">
  {filteredAvailableCourses.length > 0 ? (
    filteredAvailableCourses.map((course) => (
      <div
        className="it-user-available-course-card clickable"
        key={course.id}
        onClick={() => handleAvailableCoursesClick(course)}
        style={{ cursor: "pointer" }}
      >
        <h3>{course.courseTitle}</h3>
        <p className="it-user-available-course-description">
          {course.courseDescription}
        </p>
        <div className="it-user-available-category-text">Category</div>
        <div className="it-user-available-category-label">{course.category}</div>
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
        {isMyCoursesModalOpen && selectedCourse && !passedCourses.includes(selectedCourse.id) && (
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
                // When all questions are answered, finish quiz
                handleFinishQuiz();  // Call this function to process quiz results
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







{isResultModalOpen && quizResult && (
  <div className="result-modal-overlay" style={{ zIndex: 1 }}>
    <div className="result-modal">
      <h2>{selectedCourse?.courseTitle || "Course Title"}</h2>
      <div className="result-modal-content">
        {/* If the quiz is passed, show the passed modal */}
        {quizResult.passed ? (
          <>
            <img src={verifiedGif} alt="Verified Icon" className="result-icon" />
            <h3>Congratulations, you passed!</h3>
            <p>Your Score: {quizResult?.score}/{quizResult?.totalQuestions}</p>

            {/* Show View Result Button */}
            <button
              className="view-result-button"
              onClick={() => {
                setIsResultModalOpen(false);
                setShowDetailedResults(true); // Open the detailed result view
              }}
            >
              View Result
            </button>

            {/* Next Page Button to show congrats modal */}
            <button
              className="next-page-button"
              onClick={async () => {
                setIsResultModalOpen(false); // Close result modal
                setShowCongratsModal(true);  // Show congrats modal
                await handleNextPageAfterPass();  // Save quiz progress or move to certification
              }}
            >
              Next Page
            </button>

            {/* Show Retake Course Button */}
            <button
              className="retake-button"
              onClick={handleRetakeCourse} // Assuming this function is already defined
            >
              Retake Course
            </button>

            {/* Close Button */}
            <button
              className="close-button"
              onClick={() => setIsResultModalOpen(false)} // Close the modal
            >
              Close
            </button>
          </>
        ) : (
          <>
            <img src={sadGif} alt="Sad Icon" className="result-icon" />
            <h3>Nice Try, a little more effort needed.</h3>
            <p>Your Score: {quizResult?.score}/{quizResult?.totalQuestions}</p>

            {/* Show View Result Button */}
            <button
              className="view-result-button"
              onClick={() => {
                setIsResultModalOpen(false);
                setShowDetailedResults(true);
              }}
            >
              View Result
            </button>

            {/* Retake Quiz Button */}
            <button
              className="retake-button"
              onClick={() => {
                if (attemptsUsed < maxAttempts) {
                  setCurrentQuestion(0);
                  setQuizScore(0);
                  setSelectedAnswers([]); // Reset selected answers
                  setIsResultModalOpen(false);
                  setIsQuizContentModalOpen(true); // Reopen quiz content modal
                } else {
                  toast.error("No more attempts left for this quiz.");
                }
              }}
              disabled={attemptsUsed >= maxAttempts}
            >
              {attemptsUsed >= maxAttempts ? "No More Attempts" : "Retake Quiz"}
            </button>

            {/* Close Button */}
            <button
              className="close-button"
              onClick={() => setIsResultModalOpen(false)} // Close the modal
            >
              Close
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
        Congratulations on successfully completing the course and reaching this
        incredible milestone in your learning journey!
      </p>
      <button
        className="continue-button"
        onClick={async () => {
          try {
            // Fetch certificate and update user certification in Firestore
            await handleFetchAndCertifyUser(); // Fetch certificate and certify the user
            
            // Show the certificate modal after fetching the certificate
            await handleShowCertificate(); // Show the certificate modal after fetching it

            // Now close the congrats modal after the certificate has been shown
            setShowCongratsModal(false); // Close the congratulations modal
          } catch (error) {
            console.error("Error during certification process:", error);
            toast.error("An error occurred while processing certification.");
          }
        }}
      >
        Continue
      </button>
    </div>
  </div>
)}



{/* Detailed Results Modal */}
{showDetailedResults && (
  <div className="result-detailed-modal-overlay">
    <div className="result-detailed-modal">
      <h2>Detailed Results</h2>
      <div className="result-details-content">
        {quizData.questions.map((question, index) => (
          <div key={index} className="result-item">
            <p><strong>{index + 1}. {question.question}</strong></p>
            <ul className="result-options">
              {question.choices.map((choice, choiceIndex) => (
                <li 
                  key={choiceIndex} 
                  className={`
                    ${selectedAnswers[index] === String.fromCharCode(65 + choiceIndex) && selectedAnswers[index] !== question.correctAnswer ? 'wrong-answer' : ''} 
                    ${question.correctAnswer === String.fromCharCode(65 + choiceIndex) ? 'correct-answer' : ''}
                  `}
                >
                  <span><strong>{String.fromCharCode(65 + choiceIndex)}.</strong> {choice}</span>
                  {selectedAnswers[index] === String.fromCharCode(65 + choiceIndex) && (
                    selectedAnswers[index] === question.correctAnswer
                      ? <span className="checkmark"> &#10004; </span>  // Checkmark for correct answer
                      : <span className="cross"> &#10008; </span>  // Cross for wrong answer
                  )}
                  {question.correctAnswer === String.fromCharCode(65 + choiceIndex) && selectedAnswers[index] !== question.correctAnswer && (
                    <span className="correct-label">Correct Answer</span>  // Indicate correct answer
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button className="close-button" onClick={() => setShowDetailedResults(false)}>Close</button>
    </div>
  </div>
)}

 {/* Certificate Modal */}
 {showCertificateModal && (
        <div className="certificate-modal-overlay">
          <div className="certificate-modal">
            <h2>Course Completion Certificate</h2>
            
            {/* Certificate layout */}
            <div className="certificate-content" ref={certificateRef}>
              {certificateUrl ? (
                <img
                  src={certificateUrl}
                  alt="Certificate Template"
                  className="certificate-template"
                />
              ) : (
                <p>Loading certificate template...</p>
              )}

              {/* Overlay User's Course Title */}
              <div className="certificate-course-title">
                {selectedCourse?.courseTitle}
              </div>

              {/* Overlay User's Full Name */}
              <div className="certificate-full-name">
                {fullName}
              </div>

              {/* Overlay Date */}
              <div className="certificate-date">
                Date: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="certificate-actions">
              <button onClick={downloadCertificateAsImageWithDesign}>Download as PNG</button>
              <button onClick={() => setShowCertificateModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}









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
            {Array.isArray(selectedCourse.prerequisites) && selectedCourse.prerequisites.length > 0
              ? selectedCourse.prerequisites.join(', ')  // Now showing titles instead of IDs
              : "None"}
          </span></h4>

          <h5>Category: <span className="IT-user-course-category">{selectedCourse.category}</span></h5>
        </div>
      </div>

      <div className="IT-user-course-modal-footer">
        {selectedCourse.prerequisites?.length > 0 && !selectedCourse.prerequisiteResults.every(result => result) ? (
          <div className="IT-user-course-enroll-locked">
            <p className="prerequisite-warning">
              Complete all prerequisite courses first.
            </p>
            <button disabled className="IT-user-course-enroll-button-disabled">
              Course Locked
            </button>
          </div>
        ) : (
          <button className="IT-user-course-enroll-button" onClick={handleConfirmEnroll}>
            Enroll Course
          </button>
        )}
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
