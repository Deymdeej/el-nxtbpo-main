import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, Timestamp, writeBatch, FieldValue } from "firebase/firestore"; // Firestore methods
import { db } from "../firebase"; // Firestore configuration

import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import './css/ITAdminTraining.css';
import './css/AdminFormSuper.css';
import CloseIcon from "../assets/closebtn.svg";
import TrainingDefault from '../assets/trainingdefault.png';
import CertDefault from '../assets/certdefault.png';
import { getAuth, signOut } from "firebase/auth";
import EditIcon from "../assets/edit.svg"

const HRAdminTrainingDashboardForm = ({ selectedNav }) => {
  const [showAddModal, setShowAddModal] = useState(false); // For adding new training
  const [showEditModal, setShowEditModal] = useState(false); // For editing existing training
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingId, setTrainingId] = useState(null); // Declare trainingId state
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingDescription, setTrainingDescription] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [trainingTime, setTrainingTime] = useState(""); // In 24-hour format
  const [amPm, setAmPm] = useState("AM"); // AM/PM toggle
  const [selectedCertificate, setSelectedCertificate] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [errors, setErrors] = useState({});
  const [trainings, setTrainings] = useState([]);
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 5; // You can adjust this number as needed
  const [attendance, setAttendance] = useState({});
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768); // Initialize based on screen size
  const auth = getAuth();
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentTraining, setCurrentTraining] = useState(null); // Store current training for attendance modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false); // Attendance Modal visibility
  const [currentUser, setCurrentUser] = useState(null); // Store current user for editing/attendance
  const [selectedSection, setSelectedSection] = useState("training");

  const userId = auth.currentUser?.uid; // Get the logged-in user's ID


  useEffect(() => {
    console.log("Modal opened with training data:", selectedTraining);
  }, [showEditModal]);  // Runs whenever the modal visibility changes
  
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

  const handleAttendanceSubmit = async () => {
    try {
      // Check if enrolled users or selected training is missing
      if (!enrolledUsers || enrolledUsers.length === 0) {
        throw new Error("Enrolled users are missing.");
      }
  
      if (!selectedTraining || !selectedTraining.id) {
        throw new Error("Training information is missing.");
      }
  
      // Loop through each enrolled user to update or create attendance
      for (const user of enrolledUsers) {
        const status = user.attendance || "absent"; // Default to "absent" if no status is selected
  
        // Check if the attendance already exists in the "training_attendance" collection
        const attendanceDocRef = doc(
          db,
          "trainingAttendance", // Ensure correct collection name
          `${selectedTraining.id}_${user.userId}` // Use combination of trainingId and userId as document ID
        );
  
        const attendanceDocSnapshot = await getDoc(attendanceDocRef);
  
        if (attendanceDocSnapshot.exists()) {
          // If the document exists, update the attendance status
          await updateDoc(attendanceDocRef, {
            status: status,
            date: Timestamp.now(), // Update timestamp
          });
        } else {
          // If the document doesn't exist, create a new attendance document
          await setDoc(attendanceDocRef, {
            userId: user.userId,
            trainingId: selectedTraining.id,
            status: status,
            fullName: user.fullName || "Unknown",
            department: user.department || "Unknown",
            category: user.category || "General",
            email: user.email || "No Email",
            date: Timestamp.now(), // Timestamp when attendance is recorded
          });
        }
  
        console.log(`Attendance for ${user.fullName} updated successfully`);
      }
  
      alert("Attendance updated successfully!");
      setShowAttendanceModal(false); // Close modal after successful submission
  
    } catch (error) {
      console.error("Error updating attendance:", error.message); // Log full error message
      alert(`Failed to update attendance. ${error.message}`);
    }
  };  
  
  useEffect(() => {
    if (!trainingId) return;
  
    const fetchTrainingDetails = async () => {
      try {
        const docRef = doc(db, "hrtrainings", trainingId);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const trainingData = docSnap.data();
          
          // Set the training details
          setTrainingTitle(trainingData.trainingTitle || "");
          setTrainingDescription(trainingData.trainingDescription || "");
          setTrainingDate(trainingData.trainingDate || "");
          setTrainingTime(trainingData.trainingTime || "");
          setSelectedCertificate(trainingData.prerequisiteCertificate || "");
  
          // Set `selectedTraining` with the fetched data
          setSelectedTraining({
            id: trainingId,
            ...trainingData,
          });
        } else {
          console.log("No such training document!");
          alert("Training data not found.");
        }
      } catch (error) {
        console.error("Error fetching training details:", error);
        alert("Failed to fetch training details. Please try again.");
      }
    };
  
    const fetchEnrolledUsersWithAttendance = async () => {
      try {
        const docRef = doc(db, "hrtrainings", trainingId);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const trainingData = docSnap.data();
          const enrolledUsers = trainingData.enrolledUsers || [];
  
          if (enrolledUsers.length > 0) {
            const userSnapshots = await Promise.all(
              enrolledUsers.map(user => getDoc(doc(db, "Users", user.userId)))
            );
  
            const attendanceSnapshots = await Promise.all(
              enrolledUsers.map(user => getDoc(doc(db, "trainingAttendance", `${trainingId}_${user.userId}`)))
            );
  
            // Merge user data with attendance data
            const usersData = userSnapshots.map((userSnapshot, index) => {
              if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                const attendanceSnapshot = attendanceSnapshots[index];
                let attendance = "absent"; // Default to absent if no attendance record exists
  
                // If attendance record exists, update attendance status
                if (attendanceSnapshot.exists()) {
                  attendance = attendanceSnapshot.data().status || "absent";
                }
  
                return {
                  ...enrolledUsers[index], // Spread enrolled user info
                  fullName: userData.fullName || "Anonymous",
                  department: userData.department || "Unknown",
                  email: userData.email || "No Email",
                  attendance: attendance, // Use attendance from Firestore
                };
              }
              return null; // Return null if no user data found
            }).filter(Boolean); // Filter out null values
  
            setEnrolledUsers(usersData); // Set the users with attendance data
          } else {
            setEnrolledUsers([]); // No enrolled users, set empty array
          }
        } else {
          console.log("No such training document!");
          alert("Training data not found.");
        }
      } catch (error) {
        console.error("Error fetching users and attendance:", error);
        alert("Failed to fetch enrolled users and attendance data. Please try again.");
      }
    };
  
    fetchTrainingDetails();
    fetchEnrolledUsersWithAttendance(); // Fetch both users and attendance
  
  }, [trainingId]); // Only run when trainingId changes
  
  // Declare getPaginatedUsers before using it
const getPaginatedUsers = () => {
  const start = currentPage * usersPerPage;
  const end = start + usersPerPage;

  // Ensure we're not exceeding the available users
  return enrolledUsers.slice(start, end);
};
  useEffect(() => {
    console.log("Enrolled Users: ", enrolledUsers);  // Debugging enrolledUsers
    console.log("Current Page: ", currentPage);  // Debugging currentPage
  }, [currentPage, enrolledUsers]);

  const handleNextPage = () => {
    if ((currentPage + 1) * usersPerPage < enrolledUsers.length) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const usersPerPage = 10;

  const paginatedUsers = getPaginatedUsers();
  console.log(paginatedUsers); // Check if users are returned correctly

   // Function to close the Attendance Modal
   const handleAttendanceModalClose = () => {
    setShowAttendanceModal(false);
  };

  const handleAttendanceModalOpen = async (training) => {
    console.log("Training clicked:", training);  // Log the training object
    if (training && training.id) {
      setTrainingId(training.id);  // Set the training ID when the modal opens
      console.log("Setting training ID:", training.id); // Log the ID set
  
      // Fetch the attendance data when the modal is opened
      await fetchAttendanceData(training.id);  // <-- Call to fetch attendance data
  
      setShowAttendanceModal(true);  // Show the attendance modal
    } else {
      console.error('Training ID is missing!');
      alert('Training ID is missing!');
    }
  };

  const fetchAttendanceData = async (trainingId) => {
    try {
      console.log("Fetching attendance for training ID:", trainingId);
  
      // Query to fetch attendance records for the selected training from 'trainingAttendance' collection
      const attendanceQuery = query(
        collection(db, "trainingAttendance"),
        where("trainingId", "==", trainingId)
      );
  
      const querySnapshot = await getDocs(attendanceQuery);
  
      if (!querySnapshot.empty) {
        const attendanceData = querySnapshot.docs.map(doc => doc.data());
  
        // Merge fetched attendance data with enrolledUsers (if necessary)
        const updatedUsers = enrolledUsers.map(user => {
          const attendanceRecord = attendanceData.find(
            (record) => record.userId === user.userId
          );
          return attendanceRecord ? { ...user, ...attendanceRecord } : user;
        });
  
        setEnrolledUsers(updatedUsers); // Update state with fetched attendance data
        console.log("Attendance data fetched:", attendanceData);
      } else {
        console.log("No attendance data found for this training.");
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };
  
  
   // Function to toggle dropdown visibility
   const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id); // Toggle the dropdown open/close
  };

  // Function to close the dropdown
  const closeDropdown = () => {
    setActiveDropdown(null); // Close dropdown
  };

  const fetchTrainings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "hrtrainings"));
      const trainingsList = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      console.log('Fetched trainings:', trainingsList);
  
      setTrainings(trainingsList);  // Ensure this state update triggers re-render
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  };
  
  
  // Fetch available certificates
  const fetchCertificates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "certificates"));
      const certificatesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        certificateTitle: doc.data().title,
      }));
      setCertificates(certificatesData);
    } catch (error) {
      console.error("Error fetching certificates: ", error);
    }
  };

  useEffect(() => {
    // Fetch data (certificates and trainings) once when component mounts
    const fetchData = async () => {
      await fetchCertificates();
      await fetchTrainings();
    };
  
    fetchData(); // Initial fetch
  
    // Filter and sort logic inside useEffect
    const filtered = getFilteredUsers(); // Apply filtering and sorting
    setFilteredUsers(filtered); // Update the state with the filtered users
  
  }, [searchTerm, sortOrder, enrolledUsers]); // Trigger when search term, sort order, or enrolled users change
  
  // Filtering function based on search term and sort order

  // Handle delete training
const handleDelete = async (trainingId) => {
  if (window.confirm("Are you sure you want to delete this training?")) {
    try {
      await deleteDoc(doc(db, "hrtrainings", trainingId));
      alert("Training deleted successfully!");
      fetchTrainings(); // Fetch the updated list of trainings after deletion
      handleEditModalClose(); // Close the modal after deletion
    } catch (error) {
      console.error("Error deleting training:", error);
      alert("Failed to delete the training. Please try again.");
    }
  }
};

useEffect(() => {
  if (selectedTraining) {
    setTrainingTitle(selectedTraining.trainingTitle || "");
    setTrainingDescription(selectedTraining.trainingDescription || "");
    setTrainingDate(selectedTraining.trainingDate || "");
    setTrainingTime(selectedTraining.trainingTime || "");
    setSelectedCertificate(selectedTraining.prerequisiteCertificate || "");
  }
}, [selectedTraining]); // This will update state when selectedTraining changes


  const formatTimeTo12Hour = (time) => {
    let [hours, minutes] = time.split(":");
    let period = "AM";
  
    hours = parseInt(hours, 10);
  
    if (hours >= 12) {
      period = "PM";
      if (hours > 12) hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }
  
    return `${hours}:${minutes} ${period}`;
  };
  // Handle AM/PM change
  const handleAmPmChange = (newAmPm) => {
    let [hours, minutes] = trainingTime.split(":");
    hours = parseInt(hours, 10);

    if (newAmPm === "PM" && hours < 12) {
      hours += 12;
    } else if (newAmPm === "AM" && hours >= 12) {
      hours -= 12;
    }

    setTrainingTime(`${hours.toString().padStart(2, "0")}:${minutes}`);
    setAmPm(newAmPm);
  };

  // Handle modal close and reset
// Handle Add modal close - Do not reset form fields here
const handleAddModalClose = () => {
  setShowAddModal(false); // Just close the modal
};

// Handle Edit modal close - Do not reset form fields here
const handleEditModalClose = () => {
  setShowEditModal(false); // Just close the modal
};

const handleAttendanceChange = async (userId, newStatus) => {
  try {
    console.log("Updating attendance for user:", userId, "to", newStatus);

    // Find the user in the enrolledUsers state and update their attendance
    const updatedUsers = enrolledUsers.map(user =>
      user.userId === userId ? { ...user, attendance: newStatus } : user
    );

    // Update the state with the new attendance status
    setEnrolledUsers(updatedUsers);

    // Update the attendance in the Firestore "trainingAttendance" collection
    const attendanceDocRef = doc(db, "trainingAttendance", `${userId}-${trainingId}`); // Assumes you have a doc ID based on userId and trainingId

    await updateDoc(attendanceDocRef, {
      attendance: newStatus
    });

    console.log(`Attendance updated for user ${userId} to ${newStatus}`);
  } catch (error) {
    console.error("Error updating attendance:", error);
  }
};

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

// Handle form reset
const resetFormFields = () => {
  setTrainingTitle("");
  setTrainingDescription("");
  setTrainingDate("");
  setTrainingTime("");
  setSelectedCertificate("");
  setAmPm("AM");
  setErrors({});
};


  // Form validation
  const validateForm = () => {
    let formErrors = {};
    if (!trainingTitle.trim()) formErrors.trainingTitle = "Training title is required";
    if (!trainingDescription.trim()) formErrors.trainingDescription = "Training description is required";
    if (!trainingDate) formErrors.trainingDate = "Training date is required";
    if (!trainingTime) formErrors.trainingTime = "Training time is required";
    return formErrors;
  };

  // Handle form submission to add new training
// Handle form submission to add new training
const handleAddSubmit = async () => {
  const validationErrors = validateForm();
  if (Object.keys(validationErrors).length === 0) {
    try {
      const userId = auth.currentUser?.uid; // Fetch the userId of the logged-in user

      await addDoc(collection(db, "hrtrainings"), {
        trainingTitle,
        trainingDescription,
        trainingDate,
        trainingTime, // Save time in 24-hour format (no conversion needed)
        prerequisiteCertificate: selectedCertificate,
        enrolledUsers: [],
        userId // Add userId to the document
      });
      
      alert("Training added successfully!");
      resetFormFields(); // Reset after submission
      setShowAddModal(false); // Close Add modal after successful submission
      fetchTrainings();
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Failed to add training. Please try again.");
    }
  } else {
    setErrors(validationErrors);
  }
};


  const handleEditSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      // Check if selectedTraining is set and has a valid ID
      if (!selectedTraining || !selectedTraining.id) {
        console.error('No training selected or missing training ID');
        alert('No training selected or missing training ID');
        return; // Prevent further processing if no valid training
      }
  
      try {
        const trainingDocRef = doc(db, "hrtrainings", selectedTraining.id);
  
        // Update the training information in Firestore
        await updateDoc(trainingDocRef, {
          trainingTitle,
          trainingDescription,
          trainingDate,
          trainingTime,
          prerequisiteCertificate: selectedCertificate,
        });
  
        alert("Training updated successfully!");
        setShowEditModal(false); // Close Edit modal after successful submission
        fetchTrainings(); // Refresh the training list
  
      } catch (error) {
        console.error("Error updating training:", error);
        alert("Failed to update training. Please try again.");
      }
    } else {
      setErrors(validationErrors);
    }
  };
  
  const getFilteredUsers = () => {
    let filtered = enrolledUsers;
  
    // Apply search filter (check Fullname and Email)
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    // Apply sort order
    if (sortOrder === "newest") {
      filtered = filtered.sort((a, b) => new Date(b.enrolledDate) - new Date(a.enrolledDate));
    } else {
      filtered = filtered.sort((a, b) => new Date(a.enrolledDate) - new Date(b.enrolledDate));
    }
  
    return filtered;
  };
  
  const handleTrainingClick = async (training) => {
    console.log("Training clicked:", training);
  
    // Set training data
    setSelectedTraining(training);
    setTrainingTitle(training.trainingTitle);
    setTrainingDescription(training.trainingDescription);
    setTrainingDate(training.trainingDate);
    setTrainingTime(training.trainingTime);
    setSelectedCertificate(training.prerequisiteCertificate);
    setEnrolledUsers(training.enrolledUsers || []);
    
    // Open the modal for training details
    setShowEditModal(true);
  };
  
  return (
    <div className="admin-super-container">
      <nav className={`sidebar-super ${isOpen ? 'open-super' : 'closed-super'}`}>
        <div className="logo-super">
          <img src={BPOLOGO} alt="Company Logo" />
        </div>
        <ul className="nav-links-super">
          
          <li>
            <button
              onClick={() => navigate('/hr-admin-dashboard')}
              className={`nav-button-super ${selectedSection === 'course' ? 'active-super' : ''}`}
            >
              <img src={CourseDefault} alt="Course" className="nav-icon-super" />
              <span>Course</span>
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
              onClick={() => navigate('/hr-admin-certificate')}
              className={`nav-button-super ${selectedSection === 'certificate' ? 'active-super' : ''}`}
            >
              <img src={CertDefault} alt="Certificate" className="nav-icon-super" />
              <span>Certificate</span>
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

      {/* Dashboard Content */}
      <div className="content-super">

        
        <h15 className="it-admin-training-title">Schedule Training</h15>

        {selectedSection === 'training' && (
         <div className="row">
    <div className="col-md-12">

    <div className="course-grid-horizontal">
         {/* Existing Training Cards */}
{trainings
  .filter((training) => training.userId === auth.currentUser?.uid) // Filter by userId
  .map((training) => (
    <div key={training.id} className="it-admin-training-card">
      <div className="it-admin-training-header">
        <div className="it-admin-title-training">{training.trainingTitle}</div>
        <div className="dropdown-container-training">
          <div
            className="three-dot-icon-training"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event from firing
              toggleDropdown(training.id);
            }}
          >
            <img src={EditIcon} alt="Options" />
          </div>

          {/* Dropdown options */}
          {activeDropdown === training.id && (
            <div className="dropdown-menu-training">
              <div
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTrainingClick(training); // Call edit function
                  closeDropdown();
                }}
              >
                Edit
              </div>
              <div
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAttendanceModalOpen(training); // Call view attendance function
                  closeDropdown();
                }}
              >
                View Attendance
              </div>
              {/* Delete Option */}
              <div
                className="dropdown-item delete-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(training.id); // Call delete function
                  closeDropdown();
                }}
              >
                Delete
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card content */}
      <div className="it-admin-description-training">{training.trainingDescription}</div>
      <div className="it-admin-training-time">
        <p>{training.trainingDate}</p>
        <p>{formatTimeTo12Hour(training.trainingTime)}</p> {/* Display in 12-hour format */}
      </div>
    </div>
  ))}

            {/* Add Training Button */}
            <div
            className="it-admin-training-add-card"
            onClick={() => {
              resetFormFields(); // Reset form fields when opening the Add modal
              setShowAddModal(true);
            }}
          >
            <div className="it-admin-training-add-icon">+</div>
            <p>Add Training</p>
          </div>

          
        </div>

        </div>
        </div>

        )}
      </div>

      {/* Modal for Adding Training */}
      <Modal show={showAddModal} onHide={handleAddModalClose} centered>
        <Modal.Header className="it-admin-training-header-modal">
          <Modal.Title>Add Training</Modal.Title>
          <button type="button" className="it-admin-training-closebutton" onClick={handleAddModalClose}>
          <img src={CloseIcon} alt="Close"/>
          </button>
        </Modal.Header>
        <Modal.Body className="it-admin-training-modal">
          <Form>
            <Form.Group controlId="trainingTitle">
              <div className="it-admin-training-title-add">
              <Form.Label>Training Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter training title"
                value={trainingTitle}
                onChange={(e) => setTrainingTitle(e.target.value)}
                isInvalid={!!errors.trainingTitle}
              />
              {errors.trainingTitle && (
                <Form.Control.Feedback type="invalid">
                  {errors.trainingTitle}
                </Form.Control.Feedback>
              )}
              </div>
            </Form.Group>

            <Form.Group controlId="trainingDescription">
            <div className="it-admin-training-description-add">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                value={trainingDescription}
                onChange={(e) => setTrainingDescription(e.target.value)}
                isInvalid={!!errors.trainingDescription}
              />
              {errors.trainingDescription && (
                <Form.Control.Feedback type="invalid">
                  {errors.trainingDescription}
                </Form.Control.Feedback>
              )}
              </div>
            </Form.Group>

            <Form.Group controlId="trainingDate">
            <div className="it-admin-training-trainingdate-add">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={trainingDate}
                onChange={(e) => setTrainingDate(e.target.value)}
                isInvalid={!!errors.trainingDate}
              />
              {errors.trainingDate && (
                <Form.Control.Feedback type="invalid">
                  {errors.trainingDate}
                </Form.Control.Feedback>
              )}
              </div>
            </Form.Group>

            <Form.Group controlId="trainingTime">
            <div className="it-admin-training-trainingtime-add">
              <Form.Label>Time</Form.Label>
                <Form.Control
                  type="time"
                  value={trainingTime}
                  onChange={(e) => setTrainingTime(e.target.value)}
                  isInvalid={!!errors.trainingTime}
                />
              
              {errors.trainingTime && (
                <Form.Control.Feedback type="invalid">
                  {errors.trainingTime}
                </Form.Control.Feedback>
              )}
              </div>
            </Form.Group>

            {/* Prerequisite Certificate Dropdown */}
            <Form.Group controlId="prerequisiteCertificate">
            <div className="it-admin-training-preqrequisite-add">
              <Form.Label>Prerequisite Certificate</Form.Label>
              <Form.Control
                as="select"
                value={selectedCertificate}
                onChange={(e) => setSelectedCertificate(e.target.value)}
              >
                <option value="">-- Select Certificate --</option>
                {certificates.map((certificate) => (
                  <option key={certificate.id} value={certificate.id}>
                    {certificate.certificateTitle}
                  </option>
                ))}
              </Form.Control>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="it-admin-training-footer-modal">
          <Button className="btn-submit-addtraining" onClick={handleAddSubmit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

{/* Modal for Editing Training */}
  <Modal show={showEditModal} onHide={handleEditModalClose} centered>
    <Modal.Header className="it-admin-edit-training-header-modal">
      <Modal.Title>Edit Training</Modal.Title>
      <button type="button" className="it-admin-training-closebutton" onClick={handleEditModalClose}>
            <img src={CloseIcon} alt="Close"/>
            </button>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group controlId="trainingTitle">
        <div className="it-admin-training-title-add">
          <Form.Label>Training Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter training title"
            value={trainingTitle || selectedTraining?.trainingTitle || ''}
            onChange={(e) => setTrainingTitle(e.target.value)}
            isInvalid={!!errors.trainingTitle}
          />
          {errors.trainingTitle && (
            <Form.Control.Feedback type="invalid">
              {errors.trainingTitle}
            </Form.Control.Feedback>
          )}
          </div>
        </Form.Group>

        <Form.Group controlId="trainingDescription">
        <div className="it-admin-training-description-add">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter description"
            value={trainingDescription}
            onChange={(e) => setTrainingDescription(e.target.value)}
            isInvalid={!!errors.trainingDescription}
          />
          {errors.trainingDescription && (
            <Form.Control.Feedback type="invalid">
              {errors.trainingDescription}
            </Form.Control.Feedback>
          )}
          </div>
        </Form.Group>

        <Form.Group controlId="trainingDate">
        <div className="it-admin-training-trainingdate-add">
          <Form.Label>Date</Form.Label>
          <Form.Control
            type="date"
            value={trainingDate}
            onChange={(e) => setTrainingDate(e.target.value)}
            isInvalid={!!errors.trainingDate}
          />
          {errors.trainingDate && (
            <Form.Control.Feedback type="invalid">
              {errors.trainingDate}
            </Form.Control.Feedback>
          )}
          </div>
        </Form.Group>

        <Form.Group controlId="trainingTime">
        <div className="it-admin-training-trainingtime-add">
          <Form.Label>Time</Form.Label>
            <Form.Control
              type="time"
              value={trainingTime}
              onChange={(e) => setTrainingTime(e.target.value)}
              isInvalid={!!errors.trainingTime}
            />
      
          {errors.trainingTime && (
            <Form.Control.Feedback type="invalid">
              {errors.trainingTime}
            </Form.Control.Feedback>
          )}
          </div>
        </Form.Group>

        {/* Prerequisite Certificate Dropdown */}
        <Form.Group controlId="prerequisiteCertificate">
        <div className="it-admin-training-preqrequisite-add">
          <Form.Label>Prerequisite Certificate</Form.Label>
          <Form.Control
            as="select"
            value={selectedCertificate}
            onChange={(e) => setSelectedCertificate(e.target.value)}
          >
            <option value="">-- Select Certificate --</option>
            {certificates.map((certificate) => (
              <option key={certificate.id} value={certificate.id}>
                {certificate.certificateTitle}
              </option>
            ))}
          </Form.Control>
          </div>
        </Form.Group>
        </Form>
          </Modal.Body>

          <Modal.Footer className="it-admin-training-footer-modal">
            <Button className="btn-update-edittraining" onClick={handleEditSubmit}>Update</Button>
          </Modal.Footer>
        </Modal>

       {/* Modal for View Attendance */}
       <Modal show={showAttendanceModal} onHide={handleAttendanceModalClose} centered>
        <Modal.Header className="it-admin-edit-training-header-modal">
          <Modal.Title>Attendance</Modal.Title>
          <button type="button" className="it-admin-training-closebutton" onClick={handleAttendanceModalClose}>
            <img src={CloseIcon} alt="Close" />
          </button>
        </Modal.Header>
        <Modal.Body>
          {/* List of Enrolled Users */}
          <div className="it-admin-training-container">
            <div className="it-admin-training-search-bar-container-attendance">
              <input
                type="text"
                className="it-admin-training-search-input"
                placeholder="Search by Fullname or Email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // Update search term on input
              />
              <select
                className="it-admin-training-sort-dropdown"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)} // Update sort order on change
              >
                <option value="newest">Sort by: Newest</option>
                <option value="oldest">Sort by: Oldest</option>
              </select>
            </div>

            <div className="it-admin-training-list it-admin-training-list-header">
              <p>Full Name</p>
              <p>Department</p>
              <p>Category</p>
              <p>Date</p>
              <p>Email</p>
              <p>Attendance</p>
            </div>

  {enrolledUsers.length > 0 ? (
  enrolledUsers.map((user, index) => (
    <div key={index} className="it-admin-training-list it-admin-training-list-item">
      <p>{user.fullName}</p>
      <p>{user.department ? `${user.department} Department` : "Department"}</p>
      <p>{user.category || "General"}</p>
      <p>{new Date(user.enrolledDate).toLocaleDateString()}</p>
      <p className="center-email">{user.email}</p>
      <div className="attendance-section">
        <select
          className={`it-admin-training-attendance-dropdown ${user.attendance === "present" ? "present" : "absent"}`}
          value={user.attendance || "absent"}
          onChange={(e) => handleAttendanceChange(user.userId, e.target.value)}
        >
          <option value="absent">Absent</option>
          <option value="present">Present</option>
        </select>
      </div>
    </div>
  ))
) : (
  <p>No users enrolled yet.</p>
)}
<div className="pagination-controls">
      <button className="previous-attendance" onClick={handlePrevPage}  disabled={currentPage === 0 || enrolledUsers.length <= usersPerPage}
      >
        Previous
      </button>
      <button className="next-attendance" onClick={handleNextPage} disabled={(currentPage + 1) * usersPerPage >= enrolledUsers.length}>
        Next
      </button>
    </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="it-admin-training-footer-modal">
          <Button className="btn-update-edittraining" onClick={handleAttendanceSubmit}>Update</Button>
        </Modal.Footer>
      </Modal>
      </div>
  );
};

export default HRAdminTrainingDashboardForm;