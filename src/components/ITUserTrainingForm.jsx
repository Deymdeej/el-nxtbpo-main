import React, { useState, useEffect,useRef} from 'react';
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
import { updateDoc } from "firebase/firestore";
import scheduleIcon from "../assets/schedule.png";
import { collection, onSnapshot, doc, getDoc, getDocs } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

import './css/ITUserTraining.css';


// ITUserTrainingForm Component
function ITUserTrainingForm({
  showModal,
  setShowModal,
  trainingTitle,
  setTrainingTitle,
  trainingDescription,
  setTrainingDescription,
  schedule,
  setSchedule,
  handleSubmit
}) {
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [prerequisiteTitle, setPrerequisiteTitle] = useState(null); // For storing the prerequisite certificate title
  const [hasPrerequisiteCertificate, setHasPrerequisiteCertificate] = useState(false); // Track if the user has the certificate
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [selectedSection, setSelectedSection] = useState('training');
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  

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
        const trainingDocRef = doc(db, "trainings", selectedTraining.id);
        const trainingDocSnap = await getDoc(trainingDocRef);
  
        if (trainingDocSnap.exists()) {
          const currentData = trainingDocSnap.data();
          const currentUserId = auth.currentUser?.uid;
  
          // Fetch user details from the 'users' collection
          const userDocRef = doc(db, "Users", currentUserId); // Assuming you have a 'users' collection
          const userDocSnap = await getDoc(userDocRef);
  
          if (!userDocSnap.exists()) {
            toast.error("Failed to retrieve user information.");
            return;
          }
  
          const userData = userDocSnap.data();
          const userFullName = userData.fullName || "Anonymous"; // Handle case where full name is missing
          const userDepartment = userData.department || "Unknown"; // Handle case where department is missing
          const userEmail = userData.email || "No Email"; // Handle case where email is missing
          const enrollmentDate = new Date().toISOString(); // Get current date
  
          if (!hasPrerequisiteCertificate) {
            toast.error("You do not have the required prerequisite certificate.");
            return;
          }
  
          // Check if the user is already enrolled
          if (currentData.enrolledUsers && currentData.enrolledUsers.some(user => user.userId === currentUserId)) {
            toast.warn("You have already enrolled in this training.");
            setIsTrainingModalOpen(false); // Close the modal
            return;
          }
  
          // Create the enrollment object
          const newEnrollment = {
            userId: currentUserId,
            fullName: userFullName,
            department: userDepartment,
            email: userEmail,
            enrolledDate: enrollmentDate
          };
  
          // Add the user to the list of enrolled users
          const updatedEnrolledUsers = currentData.enrolledUsers
            ? [...currentData.enrolledUsers, newEnrollment]
            : [newEnrollment];
  
          await updateDoc(trainingDocRef, { enrolledUsers: updatedEnrolledUsers });
  
          // Show success modal after successful enrollment
          setIsTrainingModalOpen(false);
          setIsSuccessModalOpen(true);
        }
      } catch (error) {
        console.error("Error enrolling in training: ", error);
        toast.error("Failed to enroll. Please try again.");
      }
    }
  };
  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
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
        <h1>Hello IT user!</h1>


 {/* Main Content */}
{selectedSection === 'training' && (
       
      <div className="IT-User-training-content">
        <h2>Schedule</h2>
        <div className="IT-User-training-schedule-section">
          <h3>Schedule Training</h3>
          <div className="IT-User-training-cards-container">
            {trainings.length > 0 ? (
              trainings.map((training) => (
                <div key={training.id} className="IT-User-training-card">
                  <div className="IT-User-training-title">{training.trainingTitle}</div>
                  <div className="IT-User-training-datetime">
                    <span>{new Date(training.trainingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>{convertTo12Hour(training.trainingTime)}</span>
                  </div>
                  <button className={`IT-User-training-enroll-btn ${training.enrolledUsers?.length > 0 ? 'IT-User-training-enrolled' : 'IT-User-training-enroll-now'}`} onClick={() => handleEnrollNowClick(training)}>
                    {training.enrolledUsers?.length > 0 ? 'Enrolled' : 'Enroll Now!'}
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
      {isTrainingModalOpen && selectedTraining && (
        <div className={`IT-user-training-side-modal ${isTrainingModalOpen ? 'open' : ''}`}>
          <div className="IT-user-training-side-modal-content">
            <div className="IT-user-training-side-modal-header">
              <h2>{selectedTraining.trainingTitle}</h2>
              <button className="IT-user-training-side-modal-close-button" onClick={handleModalClose}>X</button>
            </div>

            <div className="IT-user-training-side-modal-body">
              <img src={TrainingIllustration} alt="Training Illustration" className="IT-user-training-side-modal-image" />
              <p>{selectedTraining.trainingDescription}</p>
              <div className="IT-user-training-side-modal-details">
                <h4>Prerequisite: <span className="IT-user-training-prerequisite">{prerequisiteTitle || "None"}</span></h4>
                <h5>Category: <span className="IT-user-training-category">{selectedTraining.category || "General"}</span></h5>
              </div>
            </div>
            <div className="IT-user-training-side-modal-footer">
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

      {/* Success Modal after enrollment */}
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
