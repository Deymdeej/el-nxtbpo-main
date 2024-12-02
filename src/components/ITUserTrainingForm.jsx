import React, { useState, useEffect,useRef } from 'react';
import { Modal, Button, Form } from "react-bootstrap"; // Assuming you're using react-bootstrap for modal
import { toast } from "react-toastify"; // For toast notifications
import BPOLOGO from '../assets/bpo-logo.png'; // Ensure the path is correct
import { db, auth } from "../firebase"; // Ensure Firebase is properly configured
import TrainingIllustration from '../assets/Calendar_Training.png';
import CourseDefault from '../assets/coursedefault.png';
import TrainingPick from '../assets/trainingpick.png';
import TrainingDefault from '../assets/trainingdefault.png';
import CertPick from '../assets/certpick.png';
import CertDefault from '../assets/certdefault.png';
import LogoutPick from '../assets/logoutpick.png';
import LogoutDefault from '../assets/logoutdefault.png';
import { useNavigate } from 'react-router-dom'; // For navigation
import { updateDoc, doc, getDoc, collection, getDocs, onSnapshot,query, where } from "firebase/firestore";
import { signOut, getAuth } from "firebase/auth";
import scheduleIcon from "../assets/schedule.png";
// Firebase imports
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { setDoc } from "firebase/firestore";
import { storage } from "../firebase";




import './css/ITUserTraining.css';

// ITUserTrainingForm Component
function ITUserTrainingForm() {
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [prerequisiteTitle, setPrerequisiteTitle] = useState(null); // For storing the prerequisite certificate title
  const [hasPrerequisiteCertificate, setHasPrerequisiteCertificate] = useState(false); // Track if the user has the certificate
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [fullName, setFullName] = useState(''); // Define the fullName state
  const [selectedSection, setSelectedSection] = useState('training');
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const auth = getAuth();  // Initialize Firebase Auth
  const [showCertificateModal, setShowCertificateModal] = useState(false);
const [certificateUrl, setCertificateUrl] = useState(null);
const [certificateFileURL, setCertificateFileURL] = useState(null);
  

// Reference for the certificate content
const certificateRef = useRef(null);

 
 
    const fetchAttendance = async () => {
    const attendanceRef = collection(db, "trainingAttendance");
    const q = query(attendanceRef, where("userId", "==", currentUser.uid)); // Query attendance for the current user
    const querySnapshot = await getDocs(q);
    const attendanceList = querySnapshot.docs.map(doc => doc.data());
    setAttendanceData(attendanceList); // Store attendance data (status)
  };
 
 // Fetch the list of trainings
 useEffect(() => {
  const fetchTrainings = async () => {
    const trainingsRef = collection(db, "trainings");
    const querySnapshot = await getDocs(trainingsRef);
    const trainingsList = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id, // Add the document ID to each training object
    }));
    setTrainings(trainingsList);
  };
 
  fetchTrainings();
}, []);
 
// Get the current logged-in user using Firebase Auth
useEffect(() => {
  const user = auth.currentUser;
  if (user) {
    setCurrentUser(user);  // Store the user if authenticated
  } else {
    setCurrentUser(null);   // Clear user data if not logged in
  }
}, []);
 
// Fetch attendance data from the trainingAttendance collection
useEffect(() => {
  if (currentUser) {
    const fetchAttendance = async () => {
      const attendanceRef = collection(db, "trainingAttendance");
      const q = query(attendanceRef, where("userId", "==", currentUser.uid)); // Query attendance for the current user
      const querySnapshot = await getDocs(q);
     
      const attendanceList = querySnapshot.docs.map(doc => doc.data());
      setAttendanceData(attendanceList); // Store attendance data (status)
    };
 
    fetchAttendance();
  }
}, [currentUser]);
 
// Function to get the user's status for a specific training
const getUserStatusForTraining = (trainingId) => {
  const userAttendance = attendanceData.find(
    (attendance) => attendance.trainingId === trainingId
  );
  return userAttendance ? userAttendance.status : "Not Attended";  // Default to "Not Attended"
};


const handleDownloadCertificate = async () => {
  const trainingTitle = selectedTraining?.trainingTitle || "Training Title";
  const userName = fullName || "User Name";
  const currentDate = new Date().toLocaleDateString();

  // Ensure certificateFileURL is passed or defined in the component
  const certificateFileURL = selectedTraining?.certificateFileURL; // Use certificateFileURL here

  if (!certificateFileURL) {
    console.error("No certificate URL available.");
    alert("Certificate URL is missing. Please try again later.");
    return;
  }

  try {
    const response = await fetch(certificateFileURL, { mode: 'cors' });
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

      // Set font and style for training title
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#2C5F2D";
      ctx.textAlign = "center";
      ctx.fillText(trainingTitle, canvas.width * 0.7, canvas.height * 0.27);

      // Set font and style for user's name
      ctx.font = "bold 45px Arial";
      ctx.fillText(userName, canvas.width * 0.7, canvas.height * 0.4);

      // Set font and style for date
      ctx.font = "15px Arial";
      ctx.fillText(`Date: ${currentDate}`, canvas.width * 0.7, canvas.height * 0.58);

      // Convert the canvas to a data URL
      const imgData = canvas.toDataURL("image/png");

      // Get the authenticated user's ID (ensure you have access to the current user)
      const userId = auth.currentUser?.uid;

      // Upload certificate image to Firebase Storage
      const storageRef = ref(storage, `certificateResults/${userId}_${selectedTraining.id}.png`);
      await uploadString(storageRef, imgData, 'data_url');

      // Get the download URL of the uploaded image
      const downloadUrl = await getDownloadURL(storageRef);

      // Store the certificate information in Firestore
      const certificateResultRef = doc(db, "certificateResult", `${userId}_${selectedTraining.id}`);
      await setDoc(certificateResultRef, {
        userId,
        trainingId: selectedTraining.id,
        trainingTitle: selectedTraining.trainingTitle,
        userName: fullName,
        date: currentDate,
        certificateUrl: downloadUrl, // Store the download URL
      });

      // Download the certificate for the user
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${userName}_${trainingTitle}_Certificate.png`;
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



  

  // Real-time updates using onSnapshot
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "trainings"), (snapshot) => {
      const trainingData = [];
      snapshot.forEach((doc) => {
        trainingData.push({ id: doc.id, ...doc.data() });
      });
      setTrainings(trainingData);
    }, (error) => {
      console.error("Error fetching trainings: ", error);
      toast.error("Failed to load trainings");
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          const userDocRef = doc(db, "Users", userId); // Assuming 'Users' collection contains user data
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName || 'Anonymous'); // Set the fullName state
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
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Clear local storage or session
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/login';
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
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
  
  const convertTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    let hoursInt = parseInt(hours, 10);
    const amPm = hoursInt >= 12 ? 'PM' : 'AM';
    hoursInt = hoursInt % 12 || 12;
    return `${hoursInt}:${minutes} ${amPm}`;
  };

  const handleEnrollNowClick = async (training) => {
    setSelectedTraining(training);
    setHasPrerequisiteCertificate(false); // Reset the prerequisite check

    if (training.prerequisiteCertificate) {
      // Fetch the title of the prerequisite certificate
      const prerequisiteDocRef = doc(db, "certificates", training.prerequisiteCertificate);
      const prerequisiteDocSnap = await getDoc(prerequisiteDocRef);

      if (prerequisiteDocSnap.exists()) {
        setPrerequisiteTitle(prerequisiteDocSnap.data().title);

        // Check if the user has this prerequisite certificate
        const userId = auth.currentUser?.uid; // Get current user's ID
        const userCertRef = collection(db, "Certifications");
        const userCertSnapshot = await getDocs(userCertRef);

        // Check if any of the user's certifications match the required certificate ID
        const hasPrerequisite = userCertSnapshot.docs.some(doc => doc.data().certificateId === training.prerequisiteCertificate);

        if (!hasPrerequisite) {
          // The user doesn't have the required prerequisite certificate
          toast.error("You do not have the required prerequisite certificate to enroll in this training.");
          setIsTrainingModalOpen(false);
          return;
        } else {
          setHasPrerequisiteCertificate(true); // User has the prerequisite certificate
        }
      } else {
        setPrerequisiteTitle(null); // No prerequisite found
      }
    } else {
      setHasPrerequisiteCertificate(true); // No prerequisite required, allow enrollment
    }

    setIsTrainingModalOpen(true); // Open the modal for enrolling in the training
};


  const handleModalClose = () => {
    setIsTrainingModalOpen(false);
    setSelectedTraining(null);
    setPrerequisiteTitle(null);
  };
  const handleEnrollTraining = async () => {
    if (selectedTraining) {
      try {
        // Reference to the specific training document in Firestore
        const trainingDocRef = doc(db, "trainings", selectedTraining.id);
        const trainingDocSnap = await getDoc(trainingDocRef);
  
        if (trainingDocSnap.exists()) {
          const currentData = trainingDocSnap.data(); // Get current training data
          const currentUserId = auth.currentUser?.uid; // Get the current user's ID
  
          // Fetch user details from the 'Users' collection in Firestore
          const userDocRef = doc(db, "Users", currentUserId);
          const userDocSnap = await getDoc(userDocRef);
  
          if (!userDocSnap.exists()) {
            toast.error("Failed to retrieve user information.");
            return;
          }
  
          const userData = userDocSnap.data(); // Get the user's data
          const userFullName = userData.fullName || "Anonymous"; // Handle missing full name
          const userDepartment = userData.department || "Unknown"; // Handle missing department
          const userEmail = userData.email || "No Email"; // Handle missing email
          const enrollmentDate = new Date().toISOString(); // Get current date in ISO format
  
          // Ensure the user has the prerequisite certificate, if applicable
          if (!hasPrerequisiteCertificate && selectedTraining.prerequisiteCertificate) {
            toast.error("You do not have the required prerequisite certificate.");
            return;
          }
  
          // Check if the user is already enrolled in the training
          if (currentData.enrolledUsers && currentData.enrolledUsers.some(user => user.userId === currentUserId)) {
            toast.warn("You have already enrolled in this training.");
            setIsTrainingModalOpen(false); // Close the modal
            return;
          }
  
          // Create the enrollment object with all required details
          const newEnrollment = {
            userId: currentUserId,
            fullName: userFullName,
            department: userDepartment,
            email: userEmail,
            enrolledDate: enrollmentDate,
            category: selectedTraining.category || "General", // Get category from training or default to "General"
            attendance: "absent", // Default attendance status to 'absent'
            prerequisiteCertificate: selectedTraining.prerequisiteCertificate || null // Store prerequisite certificate if any
          };
  
          // Add the new enrollment to the list of enrolled users
          const updatedEnrolledUsers = currentData.enrolledUsers
            ? [...currentData.enrolledUsers, newEnrollment]
            : [newEnrollment];
  
          // Update the Firestore document with the new list of enrolled users
          await updateDoc(trainingDocRef, { enrolledUsers: updatedEnrolledUsers });
  
          // Show the success modal after the enrollment is saved successfully
          setIsTrainingModalOpen(false);
          
          // Check if the user has completed the training
          const isCompleted = currentData.enrolledUsers.some(user => user.userId === currentUserId && user.attendance === 'present');
          
          if (isCompleted) {
            // If the user has completed the training, show the certificate modal
            setShowCertificateModal(true);
          } else {
            toast.success("Enrollment successful! Attend the training to receive the certificate.");
          }
        } else {
          toast.error("Training data not found.");
        }
      } catch (error) {
        console.error("Error enrolling in training: ", error);
     
      }
    }
  };
  
  


  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
  };



  const handleShowCertificateModal = (training) => {
    // Check if the training is completed, then show the certificate modal
    if (getUserStatusForTraining(training.id) === "completed") {
      setSelectedTraining(training); // Set the selected training for the certificate
      setShowCertificateModal(true);  // Show the certificate modal
    }
  };


  const fetchCertificateFileURLForTraining = async (trainingId) => {
    try {
      if (!trainingId) {
        throw new Error("No training ID provided.");
      }
  
      // Fetch the training data
      const trainingRef = doc(db, "trainings", trainingId); // 'trainings' is the collection
      const trainingSnap = await getDoc(trainingRef);
  
      if (trainingSnap.exists()) {
        const trainingData = trainingSnap.data();
        const certificateFileURL = trainingData.certificateFileURL; // Directly accessing certificateFileURL
  
        if (!certificateFileURL) {
          throw new Error("No certificate file URL found in training data.");
        }
  
        return certificateFileURL; // Return the certificate file URL
      } else {
        throw new Error("Training not found.");
      }
    } catch (error) {
      console.error("Error fetching certificate file URL for training:", error);
      return null;
    }
  };
  
  



  return (
    <div className="admin-super-container">
      <nav className={`sidebar-super ${isOpen ? 'open-super' : ''}`}>
        <div className="logo-super">
          <img src={BPOLOGO} alt="Company Logo" />
        </div>
        <ul className="nav-links-super">
          <li>
            <button
              onClick={() => navigate('/it-user-dashboard')}
              className={`nav-button-super ${selectedSection === 'courses' ? 'active-super' : ''}`}
            >
              <img src={CourseDefault} alt="Courses" className="nav-icon-super" />
              <span>Courses</span>
            </button> 
          </li>
          <li>
            <button
              onClick={() => handleSectionChange('training')}
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

 {/* Main Content */}
{selectedSection === 'training' && (
       
      <div className="IT-user-course-my-courses-section">
        
        <div className="IT-user-course-course-container">
          <h2>Schedule Training</h2>
          
          <div className="IT-user-course-course-container">
          {trainings.length > 0 ? (
  trainings.map((training) => (
    <div key={training.id} className="IT-User-training-card">
      {/* Get user's attendance status for this training */}
      {currentUser && (
        <div className="IT-User-training-status">
          {/* Only display status if it is either 'ongoing' or 'completed' */}
          {getUserStatusForTraining(training.id) === "ongoing" ? (
            <span className="status-ongoing">Ongoing</span>
          ) : getUserStatusForTraining(training.id) === "completed" ? (
            <span
              className="status-completed"
              onClick={() => handleShowCertificateModal(training)} // Trigger the modal when clicked
              style={{ cursor: 'pointer' }} // Show pointer cursor to indicate it's clickable
            >
              Completed
            </span>
          ) : null} {/* Do not display anything if the status is not set */}
        </div>
      )}

      <div className="IT-User-training-title">{training.trainingTitle}</div>

      {/* Training Description */}
      <div className="IT-User-training-description">
        {training.trainingDescription || "No description available"}
      </div>

      <div className="IT-User-training-datetime">
        <span>{new Date(training.trainingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        &nbsp;
        <span>{convertTo12Hour(training.trainingTime)}</span>
        &nbsp;-&nbsp;
        <span>{convertTo12Hour(training.trainingEndTime)}</span>
      </div>

      {/* Enroll/Enrolled Button */}
      <button
        className={`IT-User-training-enroll-btn ${training.enrolledUsers?.some(user => user.userId === auth.currentUser?.uid) ? 'IT-User-training-enrolled' : 'IT-User-training-enroll-now'}`}
        onClick={() => handleEnrollNowClick(training)}
      >
        {training.enrolledUsers?.some(user => user.userId === auth.currentUser?.uid) ? 'Enrolled' : 'Enroll Now!'}
      </button>
    </div>
  ))
) : (
  <p>No trainings available</p>
)}

  </div>

        </div>
      </div>
       )}

      {/* Side Modal for training details */}
      {/* Side Modal for training details */}
{isTrainingModalOpen && selectedTraining && (
  <div className={`IT-user-training-side-modal ${isTrainingModalOpen ? 'open' : ''}`}>
    <div className="IT-user-training-side-modal-header">
      <h2>{selectedTraining.trainingTitle}</h2>
      <button className="IT-user-training-side-modal-close-button" onClick={handleModalClose}>X</button>
    </div>

    <div className="IT-user-training-side-modal-body">
      <img src={TrainingIllustration} alt="Training Illustration" className="IT-user-training-side-modal-image" />
      
      <div className="IT-user-training-side-modal-details">
        <p>{selectedTraining.trainingDescription}</p>
      </div>
    </div>
    
    <div className="IT-user-training-side-modal-footer">
      <div className="IT-user-course-course-details-1">
        <h4>Prerequisite: <span className="IT-user-training-prerequisite">{prerequisiteTitle || "None"}</span></h4>
        <h5>Category: <span className="IT-user-training-category">{selectedTraining.category || "General"}</span></h5>
        <h5>Start Time: <span className="IT-user-training-category">{selectedTraining.trainingTime || "General"}</span></h5>
        <h5>End Time: <span className="IT-user-training-category">{selectedTraining.trainingEndTime || "General"}</span></h5>

        <button 
          className="IT-user-training-side-modal-enroll-button" 
          onClick={handleEnrollTraining}
          disabled={!hasPrerequisiteCertificate && selectedTraining.prerequisiteCertificate} // Disable if prerequisite is required and not met
        >
          ENROLL TRAINING
        </button>
      </div>
    </div>
  </div>
)}

{/* Show certificate modal if the user has completed the training */}
{showCertificateModal && selectedTraining && (
  <div className="certificate-modal-overlay">
    <div className="certificate-modal">
      <h2>Course Completion Certificate</h2>

      {/* Close Button */}
      <button
        className="close-button top-right"
        onClick={() => setShowCertificateModal(false)} // Close the modal
      >
        ✕
      </button>

      {/* Certificate Content with Background from Firebase */}
      <div
        className="certificate-content"
        ref={certificateRef}
        style={{
          position: "relative",
          textAlign: "center",
          backgroundImage: `url(${selectedTraining.certificateFileURL})`, // Use selected training's certificateFileURL here
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "100%",
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
            alignItems: "center",
          }}
        >
          {selectedTraining?.trainingTitle || "Training Title"}
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
        <button className="download-button" onClick={handleDownloadCertificate}>
          Download as PNG
        </button>
      </div>
    </div>
  </div>
)}




{isSuccessModalOpen && (
  <div className="IT-user-training-success-modal">
    <div className="IT-user-training-success-modal-content">
      <div className="IT-user-training-success-modal-body">
        <img src={scheduleIcon} alt="Success Illustration" className="IT-user-training-success-modal-image" />
        <h3 className="IT-user-training-success-title">You're all set!</h3>
        <p>You secured a slot for this training.</p>
      </div>
      <div className="IT-user-training-success-modal-footer">
        <button className="IT-user-training-success-ok-button" onClick={handleSuccessModalClose}>Okay</button>
      </div>
    </div>
  </div>
)}









        </div>
        </div>
  );
}

export default ITUserTrainingForm;
