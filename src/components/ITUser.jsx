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
import CloseIcon from '../assets/closebtn.svg'





const ITUser = ({
  handleLogout,
  certificateId,
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

const certificateRef = useRef(null);
const [certificateUrl, setCertificateUrl] = useState(null);
const [courseTitle, setCourseTitle] = useState("");
const [timeLeft, setTimeLeft] = useState(null);



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


  useEffect(() => {
    const fetchCertificateImage = async () => {
      try {
        const imageRef = ref(storage, `uploads/${certificateId}.png`); // Path to the image in Firebase Storage
        const url = await getDownloadURL(imageRef);
        setCertificateUrl(url); // Set the URL in state to use as background
      } catch (error) {
        console.error("Error fetching certificate image:", error);
      }
    };

    if (certificateId) {
      fetchCertificateImage();
    }
  }, [certificateId]);




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
        const certificateRef = doc(db, "certificates", selectedCourse.certificateId);
        const certificateDoc = await getDoc(certificateRef);
        if (certificateDoc.exists()) {
          const certificateData = certificateDoc.data();
          setCertificateUrl(certificateData.fileUrl); // Assuming 'fileUrl' is the certificate template URL
        } else {
          console.error("No certificate found.");
        }
      }
    };
    if (selectedCourse) {
      fetchCertificate();
    }
  }, [selectedCourse]);


  




// Function to trigger PDF download from Firebase URL
const handleDownloadPDF = () => {
  if (selectedCourse.pdfURLs && selectedCourse.pdfURLs.length > 0) {
    const pdfUrl = selectedCourse.pdfURLs[0]; // Assuming the first URL is the certificate PDF
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${fullName}_Certificate.pdf`; // Name the downloaded file using the user's name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up the DOM
  } else {
    toast.error("No PDF available for download.");
  }
};

// Call this function where you show the passed quiz modal



// Function to fetch certificate URL from Firestore
const handleDownloadCertificate = async () => {
  const courseTitle = selectedCourse?.courseTitle || "Course Title";
  const userName = fullName || "User Name";
  const currentDate = new Date().toLocaleDateString();

  if (!certificateUrl) {
    console.error("No certificate URL available.");
    alert("Certificate URL is missing. Please try again later.");
    return;
  }

  try {
    const response = await fetch(certificateUrl, { mode: 'cors' });
    if (!response.ok) throw new Error("Failed to fetch the certificate image");

    const blob = await response.blob();
    const img = new Image();
    img.src = URL.createObjectURL(blob);

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw the background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Set font and style for course title
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#2C5F2D";
      ctx.textAlign = "center";
      ctx.fillText(courseTitle, canvas.width * 0.7, canvas.height * 0.27);

      // Set font and style for user's name
      ctx.font = "bold 45px Arial";
      ctx.fillText(userName, canvas.width * 0.7, canvas.height * 0.4);

      // Set font and style for date
      ctx.font = "15px Arial";
      ctx.fillText(`Date: ${currentDate}`, canvas.width * 0.7, canvas.height * 0.58);

      // Convert the canvas to a data URL
      const imgData = canvas.toDataURL("image/png");

      // Upload certificate image to Firebase Storage
      const storageRef = ref(storage, `certificateResults/${userId}_${selectedCourse.id}.png`);
      await uploadString(storageRef, imgData, 'data_url');

      // Get the download URL of the uploaded image
      const downloadUrl = await getDownloadURL(storageRef);

      // Store the certificate information in Firestore
      const certificateResultRef = doc(db, "certificateResult", `${userId}_${selectedCourse.id}`);
      await setDoc(certificateResultRef, {
        userId,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.courseTitle,
        userName: fullName,
        date: currentDate,
        certificateUrl: downloadUrl, // Store the download URL
      });

      // Download the certificate for the user
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${userName}_${courseTitle}_Certificate.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL
      URL.revokeObjectURL(img.src);

      toast.success("Certificate downloaded and saved successfully!");
    };

    img.onerror = () => {
      console.error("Error loading certificate image.");
      alert("Failed to load certificate image. Please check the URL or try again later.");
    };
  } catch (error) {
    console.error("Error downloading certificate image:", error);
    alert("An error occurred while downloading the certificate. Please try again.");
  }
};







  // Function to download certificate as PDF
  const handleDownloadCertificateAsPDF = async () => {
    if (!certificateRef.current) {
      console.error("No certificate reference available.");
      return;
    }

    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("landscape");
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210); // A4 size in mm
      pdf.save(`${fullName}_Certificate.pdf`);
    } catch (error) {
      console.error("Error generating PDF certificate:", error);
    }
  };



const downloadImageAsDataURL = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // Get data URL
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading image:', error);
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
        quizDuration: enrollmentData.quizDuration || 10,  // Default to 10 minutes if not specified
      });
  
      // Initialize the timer countdown for the quiz
      setTimeLeft(enrollmentData.quizDuration * 60); // Convert minutes to seconds
  
      // Fetch the quiz result for the specific course
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

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
  
      return () => clearInterval(timerId); // Cleanup interval on component unmount
    } else if (timeLeft === 0) {
      handleFinishQuiz(); // Auto-submit when time is up
    }
  }, [timeLeft]);
  

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

useEffect(() => {
  if (isQuizContentModalOpen && selectedCourse && selectedCourse.quizDuration) {
    setTimeLeft(selectedCourse.quizDuration * 60); // Initialize time in seconds from Firebase `quizDuration`
  }
}, [isQuizContentModalOpen, selectedCourse]);
  
  
const handleRetakeCourse = async () => {
  try {
    if (!selectedCourse || !userId) {
      toast.error("No course selected or user not authenticated");
      return;
    }

    // Delete the quiz result from Firestore
    const quizResultRef = doc(db, "QuizResults", `${userId}_${selectedCourse.id}`);
    await deleteDoc(quizResultRef); // Use deleteDoc to remove the quiz result

    // Reset the attempts to zero in Firestore
    const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`);
    await updateDoc(enrollmentRef, {
      quizAttempts: 0,  // Reset quizAttempts to zero
    });

    // Reset local state related to the quiz
    setAttemptsUsed(0);  // Reset attempts to zero
    setQuizScore(0);     // Reset score
    setSelectedAnswers([]);  // Clear selected answers
    setCurrentQuestion(0);   // Reset the current question index

    // Close the passed quiz modal
    setShowPassedQuizModal(false);

    // Open the "My Courses" modal again so the user can retake the course
    setIsMyCoursesModalOpen(true);

    toast.success("Quiz deleted. Attempts reset to zero. You can now retake the course.");
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
  
  


  
  

  
  

  
  

  
  
  
  
  
  
  
 

  const handleConfirmEnroll = () => {
    setShowConfirmModal(true); // Open the confirm modal
  };

  const handleCancelEnroll = () => {
    setShowConfirmModal(false); // Close the confirm modal
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourse || !userId) {
      toast.error("No course selected or user not authenticated.");
      return;
    }
  
    // Check if the course is already enrolled
    if (enrolledCourses.includes(selectedCourse.id)) {
      toast.error("You are already enrolled in this course.");
      setIsAvailableCoursesModalOpen(false);
      return;
    }
  
    try {
      // Fetch full course details from Firebase to ensure we get the latest data
      const courseDocRef = doc(db, selectedCourse.category === 'IT' ? "ITCourses" : "GeneralCourses", selectedCourse.id);
      const courseSnapshot = await getDoc(courseDocRef);
  
      if (!courseSnapshot.exists()) {
        toast.error("Failed to fetch course details. Please try again.");
        return;
      }
  
      const courseData = courseSnapshot.data();
  
      // Create an object that combines selectedCourse with additional details from Firestore
      const courseDataWithDetails = {
        ...selectedCourse,
        quizDuration: courseData.quizDuration || 1,
        questions: courseData.questions || [],
        pdfURLs: courseData.pdfURLs || [],
        videoLink: courseData.videoLink || "",
        certificateId: courseData.certificateId || null,
      };
  
      // Update selectedCourse with full details for local state use
      setSelectedCourse(courseDataWithDetails);
  
      // Store enrollment details in Firestore, including quiz details
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`);
      await setDoc(enrollmentRef, {
        userId,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.courseTitle,
        courseDescription: selectedCourse.courseDescription,
        category: selectedCourse.category,
        prerequisites: selectedCourse.prerequisites || "None",
        questions: courseData.questions || [],
        quizDuration: courseData.quizDuration || 1,
        pdfURLs: courseData.pdfURLs || [],
        videoLink: courseData.videoLink || "",
        certificateId: courseData.certificateId || null,
        enrolledDate: new Date(),
      });
  
      toast.success(`You have been successfully enrolled in ${selectedCourse.courseTitle}!`);
  
      // Close modals after enrollment
      setIsAvailableCoursesModalOpen(false);
      setShowConfirmModal(false);
  
      // Optionally update local enrolled courses state
      setEnrolledCourses((prev) => [...prev, selectedCourse.id]);
  
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast.error("Failed to enroll in the course. Please try again.");
    }
  };
  
  
  
  
  const handleStartQuiz = async () => {
    if (selectedCourse && attemptsUsed < maxAttempts) { 
        try {
            // Clear previous quiz data (reset score and answers)
            setQuizScore(0);
            setCurrentQuestion(0);
            setSelectedAnswers([]);

            // Fetch quiz data for the selected course
            await fetchQuizQuestions(selectedCourse.id);

            // Once data is fetched, open the quiz content modal
            setIsQuizModalOpen(false);
            setIsQuizContentModalOpen(true);
        } catch (error) {
            console.error("Error starting quiz:", error);
            toast.error("Failed to start the quiz. Please try again.");
        }
    } else {
        toast.error("You have reached the maximum number of attempts.");
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



const handleDownloadCertificateBackground = async () => {
  if (!selectedCourse || !selectedCourse.certificateId) {
    toast.error("Certificate information is incomplete.");
    return;
  }

  const fileUrl = await fetchCertificateTemplateUrl(selectedCourse.certificateId); // Fetch the file URL from Firestore

  if (fileUrl) {
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = fileUrl; // Use the fetched URL
    link.download = `${fullName}_Certificate_Background.png`; // Set the download filename
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up the DOM
  } else {
    toast.error("Failed to fetch the certificate background for download.");
  }
};





const handleRetakeQuiz = async () => {
  if (attemptsUsed < maxAttempts) {
    // Increment the attempt count
    const newAttemptsUsed = attemptsUsed;
    setAttemptsUsed(newAttemptsUsed);

    try {
      // Update the attempt count in Firestore or wherever you're storing it
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`);
      await updateDoc(enrollmentRef, {
        quizAttempts: newAttemptsUsed,
      });

      // Reset quiz state for a fresh start
      resetQuizState();

      // Bring user back to the Ready for Quiz modal
      setIsResultModalOpen(false); // Close the result modal
      setIsQuizModalOpen(true);    // Reopen the "Ready for Quiz" modal

    } catch (error) {
      console.error("Error retaking quiz:", error);
      toast.error("Failed to retake the quiz. Please try again.");
    }
  } else {
    toast.error("No more attempts left for this quiz.");
  }
};


  

const handleAnswerSelect = (questionIndex, answer) => {
  const updatedSelectedAnswers = [...selectedAnswers];
  updatedSelectedAnswers[questionIndex] = answer;
  setSelectedAnswers(updatedSelectedAnswers);

  // Check if the selected answer is correct
  if (answer === quizData.questions[questionIndex].correctAnswer) {
      setQuizScore(prevScore => prevScore + 1); // Only count correct answers for this attempt
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
    const prerequisiteIds = fullCourseData.prerequisites || [];

    const prerequisiteTitles = await Promise.all(
      prerequisiteIds.map(async (prereqId) => {
        const prereqCourseRef = doc(db, "ITCourses", prereqId);
        const prereqCourseSnap = await getDoc(prereqCourseRef);
        return prereqCourseSnap.exists() ? prereqCourseSnap.data().courseTitle : "Unknown Course";
      })
    );

    setSelectedCourse({
      ...course,
      prerequisites: prerequisiteTitles.length > 0 ? prerequisiteTitles : "None",
      prerequisiteResults: await Promise.all(
        prerequisiteIds.map(async (prereqId) => {
          const quizResultRef = doc(db, "QuizResults", `${userId}_${prereqId}`);
          const quizResultSnap = await getDoc(quizResultRef);
          return quizResultSnap.exists() ? quizResultSnap.data().passed : false;
        })
      ),
      questions: fullCourseData.questions || [],
      pdfURLs: fullCourseData.pdfURLs || [],
      videoLink: fullCourseData.videoLink || "",
      certificateId: fullCourseData.certificateId || null,
      quizDuration: fullCourseData.quizDuration || "Not specified",  // Add quiz duration
    });

    setIsAvailableCoursesModalOpen(true); // Open the modal with course details
  } catch (error) {
    console.error("Error fetching course details:", error);
    toast.error("Failed to fetch course details.");
  }
};
  
  
  
  


  const fetchQuizQuestions = async (courseId) => {
    try {
        // Fetch the quiz questions related to the specific course
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
    // Close the quiz modal and open the result modal
    setIsQuizContentModalOpen(false);
    setIsResultModalOpen(true);

    const passed = quizScore >= (quizData.questions.length * 0.8);

    const quizResult = {
        userId,
        fullName,
        courseId: selectedCourse.id,  
        courseTitle: selectedCourse.courseTitle,
        score: quizScore,  // Final score of the current attempt
        totalQuestions: quizData.questions.length,
        passed,
        timestamp: new Date(),
    };

    try {
        const resultRef = doc(db, "QuizResults", `${userId}_${selectedCourse.id}`);
        await setDoc(resultRef, quizResult); // Save quiz result in Firestore

        setQuizSaved(true); // Mark quiz as saved

        if (passed) {
            setPassedCourses((prevPassedCourses) => [...prevPassedCourses, selectedCourse.id]); 
            toast.success("Congratulations! You passed the quiz.");
        } else {
            toast.error("You did not pass the quiz.");
        }

        // After saving the result, reset the quiz state
        resetQuizState();

    } catch (error) {
        console.error("Error saving quiz result:", error.message);
        toast.error("Failed to save quiz result.");
    }
};

// Reset quiz state to initial values
const resetQuizState = () => {
  setQuizScore(0);  // Reset the score
  setSelectedAnswers([]);  // Clear the selected answers
  setCurrentQuestion(0);  // Reset the current question
};




const handleShowCertificate = async () => {
  if (!selectedCourse || !selectedCourse.certificateId) {
    toast.error("Certificate information is incomplete.");
    return;
  }

  const certificateUrl = await fetchCertificateTemplateUrl(selectedCourse.certificateId);
  
  if (certificateUrl) {
    setCertificateUrl(certificateUrl); // Set the certificate URL in state
    setShowCertificateModal(true);  // Show the certificate modal
  } else {
    toast.error("Certificate template not available.");
  }
};





  

  const handleQuizStartClick = () => {
    if (selectedCourse) {
      fetchQuizDataFromEnrollment(selectedCourse.id); // Fetch quiz data from the enrollment
    }
    setIsNextModalOpen(false); // Close the next modal
    setIsQuizModalOpen(true); // Open quiz modal
  };

  
  
  const fetchCertificateTemplateUrl = async (certificateId) => {
    try {
      const certificateDocRef = doc(db, "certificates", certificateId);
      const certificateDoc = await getDoc(certificateDocRef);
  
      if (certificateDoc.exists()) {
        const certificateData = certificateDoc.data();
        return certificateData.fileUrl; // Retrieve the URL directly from Firestore
      } else {
        console.error("No certificate document found!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching certificate template:", error);
      return null;
    }
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
      <h1 style={{ fontSize: '22px', marginLeft: '25px' }}>
        <strong><span style={{ color: '#48887B' }}>Hello</span></strong>, <em>{fullName || 'IT user'}</em>!
      </h1>

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
                      <p22 className="IT-user-course-course-description">{course.courseDescription}</p22>
                      <div className="IT-user-course-category-text">Category:</div>
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
        <div className="it-user-available-category-text">Category:</div>
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
        <button className="IT-user-course-mycourse-close-button" onClick={() => setIsMyCoursesModalOpen(false)}><img src={CloseIcon} alt="Close"/></button>
      </div>
 
      {/* Modal Body */}
      <div className="IT-user-course-mycourse-body">
        <p className="IT-user-course-description">
          <strong>Description:</strong> {selectedCourse.courseDescription}
        </p>
        <p><strong>Quiz Duration:</strong> {selectedCourse.quizDuration} minutes</p>
 
      {/* Modal Body */}
      <div className="IT-user-course-next-body">
        {selectedCourse.videoLink ? (
          <div className="IT-user-course-next-video-container">
            <h4>Video Resource:</h4>
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
 
 
{isQuizModalOpen && (
  <div className="quiz-modal-overlay">
    <div className="quiz-modal-content">
      <button onClick={() => setIsQuizModalOpen(false)} className="quiz-close-button">X</button>
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
      <p className="quiz-duration">Quiz Duration: {selectedCourse.quizDuration} minutes</p> {/* Display quiz duration here */}
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
 
 
{isQuizContentModalOpen && quizData && quizData.questions && (
  <div className="quiz-content-modal-overlay">
    <div className="quiz-content-modal">
      <h2>{selectedCourse.courseTitle}</h2>
      <p>Time Left: {formatTime(timeLeft)}</p> {/* Display the timer here */}
     
      {quizData.questions.length > 0 && quizData.questions[currentQuestion] ? (
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
          {/* Display current question number and total number of questions */}
          <p>{currentQuestion + 1} of {quizData.questions.length} Questions</p>
          <button
            className="quiz-next-button"
            onClick={() => {
              if (currentQuestion < quizData.questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
              } else {
                handleFinishQuiz();  // Call this function to process quiz results
              }
            }}
            disabled={!selectedAnswers[currentQuestion]} // Disable the next button if no answer is selected
          >
            {currentQuestion < quizData.questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </button>
        </div>
      ) : (
        <p>Loading questions...</p>
      )}
    </div>
  </div>
)}




{/* Vincent Kyle Mesiona*/}


{isResultModalOpen && quizResult && selectedCourse && (
  <div className="result-modal-overlay" style={{ zIndex: 1 }}>
    <div className="result-modal">
      {/* Close Button at the top right */}
      <div className="IT-user-course-passed-footer">
      <button
        className="close-button top-right"
        onClick={() => setIsResultModalOpen(false)} // Close the modal
      >
        ✕
      </button>
      </div>
      
      <h2>{selectedCourse.courseTitle || "Course Title"}</h2>
      <div className="result-modal-content">
        {/* If the quiz is passed, show the passed modal */}
        {quizResult.passed ? (
          <>
            <img src={verifiedGif} alt="Verified Icon" className="result-icon" />
            <h3>Congratulations, you passed {selectedCourse.courseTitle}!</h3>
            <p1><strong>Your Score: {quizResult.score}/{quizResult.totalQuestions}</strong></p1>

            <div className="IT-user-course-passed-footer">
            <button
              className="retake-button"
              onClick={handleRetakeCourse}
            >
              Retake Course
            </button>

            
            <button
              className="next-page-button"
              onClick={async () => {
                setIsResultModalOpen(false);
                setShowCongratsModal(true);
                await handleNextPageAfterPass();
              }}
            >
              Next Page
            </button>
            </div>

          </>
        ) : (
          <>
            <img src={sadGif} alt="Sad Icon" className="result-icon" />
            <h3>You didn't pass {selectedCourse.courseTitle}. A little more effort is needed.</h3>
            <p>Your Score: {quizResult.score}/{quizResult.totalQuestions}</p>

          
            
            <button
              className="retake-button"
              onClick={async () => {
                if (attemptsUsed < maxAttempts) {
                  const newAttemptsUsed = attemptsUsed + 1;
                  setAttemptsUsed(newAttemptsUsed);

                  try {
                    const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`);
                    await updateDoc(enrollmentRef, {
                      quizAttempts: newAttemptsUsed,
                    });

                    setCurrentQuestion(0);
                    setQuizScore(0);
                    setSelectedAnswers([]);

                    setIsResultModalOpen(false);
                    setIsQuizModalOpen(true);
                  } catch (error) {
                    console.error("Error retaking quiz:", error);
                    toast.error("Failed to retake the quiz. Please try again.");
                  }
                } else {
                  toast.error("No more attempts left for this quiz.");
                }
              }}
              disabled={attemptsUsed >= maxAttempts}
            >
              {attemptsUsed >= maxAttempts ? "No More Attempts" : "Retake Quiz"}
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}




{/* Vincent Kyle Mesiona*/}






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



{/* Vincent Kyle Mesiona*/}

{showCertificateModal && (
          <div className="certificate-modal-overlay">
            <div className="certificate-modal">
              <h2>Course Completion Certificate</h2>
              
             {/* Certificate Content with Background from Firebase */}
             
      <button
        className="close-button top-rightcert"
        onClick={() => setShowCertificateModal(false)} // Close the modal
      >
        ✕
      </button>
  
<div
  className="certificate-content"
  ref={certificateRef}
  style={{
    position: "relative",
    textAlign: "center",
    backgroundImage: `url(${certificateUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    width: "100%", // Ensure full width of the container
    height: "500px", // Set a specific height to control the appearance
  }}
>
  {/* Certificate Overlays for Text */}
  <div
    className="certificate-course-title"
    style={{
      position: "absolute",
      top: "27%",
      left: "70%",
      transform: "translate(-50%, -50%)",
      fontSize: "25px",
      fontWeight: "bold",
      color: "#2C5F2D",
      alignItems: "center"
    }}
  >
    {selectedCourse?.courseTitle || "Course Title"}
  </div>

  <div
    className="certificate-full-name"
    style={{
      position: "absolute",
      top: "40%",
      left: "70%",
      transform: "translate(-50%, -50%)",
      fontSize: "25px",
      fontWeight: "bold",
      color: "#2C5F2D",
      alignItems: "center",
    }}
  >
    {fullName || "User Name"}
  </div>

  <div
    className="certificate-date"
    style={{
      position: "absolute",
      top: "58%",
      left: "70%",
      transform: "translate(-50%, -50%)",
      fontSize: "15px",
      color: "#2C5F2D",
      alignItems: "center",

    }}
  >
    Date: {new Date().toLocaleDateString()}
  </div>
</div>


 

              {/* Download Buttons */}
              <div className="certificate-actions">

  <button  className="download-button" onClick={handleDownloadCertificate}>Download as PNG</button>
  
</div>
            </div>
          </div>
        )}


      {/* Vincent Kyle Mesiona*/}



      








{isAvailableCoursesModalOpen && selectedCourse && (
  <div className="IT-user-course-modal">
    <div className="IT-user-course-modal-content">
      <div className="IT-user-course-modal-header">
        <h2>{selectedCourse.courseTitle}</h2>
        <button className="IT-user-course-close-button" onClick={() => setIsAvailableCoursesModalOpen(false)}>X</button>
      </div>

      <div className="IT-user-course-modal-body">
        <img src={Category_IT} alt="Course visual" className="IT-user-course-modal-image" />
        <p23>{selectedCourse.courseDescription}</p23>
        <div className="IT-user-course-course-details">
          <h4>Prerequisite: <span className="IT-user-course-prerequisite">
            {Array.isArray(selectedCourse.prerequisites) && selectedCourse.prerequisites.length > 0
              ? selectedCourse.prerequisites.join(', ')  // Now showing titles instead of IDs
              : "None"}
          </span></h4>

          <h5>Category: <span className="IT-user-course-category">{selectedCourse.category}</span></h5>
          <h5>Quiz Duration: <span>{selectedCourse.quizDuration} minutes</span></h5>
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
