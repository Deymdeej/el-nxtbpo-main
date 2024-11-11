import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, Timestamp } from "firebase/firestore"; // Firestore methods
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


const ITAdminTrainingDashboardForm = ({ selectedNav }) => {
  const [showAddModal, setShowAddModal] = useState(false); // For adding new training
  const [showEditModal, setShowEditModal] = useState(false); // For editing existing training
  const [selectedTraining, setSelectedTraining] = useState(null);
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
  const [selectedSection, setSelectedSection] = useState('training');
  const auth = getAuth();
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentTraining, setCurrentTraining] = useState(null); // Store current training for attendance modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false); // Attendance Modal visibility
  const [currentUser, setCurrentUser] = useState(null); // Store current user for editing/attendance


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


  const handleAttendanceModalShow = (user) => {
    setCurrentUser(user);
    setAttendanceStatus(user.attendanceStatus || 'absent'); // Set the current status or default to 'absent'
    setShowAttendanceModal(true); // Open the modal
  };

  // Function to handle opening the Edit Modal
  const handleEditModalOpen = (training) => {
    setTrainingTitle(training.trainingTitle);
    setTrainingDescription(training.trainingDescription);
    setTrainingDate(training.trainingDate);
    setTrainingTime(training.trainingTime);
    setSelectedCertificate(training.selectedCertificate);
    setShowEditModal(true);

  };

   // Function to close the Attendance Modal
   const handleAttendanceModalClose = () => {
    setShowAttendanceModal(false);
  };

  // Function to handle opening the Attendance Modal
  const handleAttendanceModalOpen = (training) => {
    console.log('Opening attendance for training:', training);
    setCurrentTraining(training);
    setShowAttendanceModal(true);
  };


  // Function to handle opening the attendance modal
  const handleViewAttendanceModalOpen = (training) => {
    // Handle the logic for opening attendance modal
    console.log('View Attendance for', training);
  };


  const handleEdit = (training) => {
    setTrainingTitle(training.title); // Set training title
    setTrainingDescription(training.description); // Set description
    setTrainingDate(training.date); // Set date
    setTrainingTime(training.time); // Set time
    setSelectedCertificate(training.certificateId); // Set certificate ID
    setShowEditModal(true); // Show the modal
  };

   // Function to toggle dropdown visibility
   const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id); // Toggle the dropdown open/close
  };

  // Function to close the dropdown
  const closeDropdown = () => {
    setActiveDropdown(null); // Close dropdown
  };

  // Fetch trainings
  const fetchTrainings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "trainings"));
      const trainingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrainings(trainingsData);
    } catch (error) {
      console.error("Error fetching trainings: ", error);
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
      await deleteDoc(doc(db, "trainings", trainingId));
      alert("Training deleted successfully!");
      fetchTrainings(); // Fetch the updated list of trainings after deletion
      handleEditModalClose(); // Close the modal after deletion
    } catch (error) {
      console.error("Error deleting training:", error);
      alert("Failed to delete the training. Please try again.");
    }
  }
};



const fetchEnrolledUsers = async (trainingId) => {
  try {
    const trainingDocRef = doc(db, "trainings", trainingId);
    const trainingSnapshot = await getDoc(trainingDocRef);

    if (trainingSnapshot.exists()) {
      const trainingData = trainingSnapshot.data();
      const enrolledUsers = trainingData.enrolledUsers || [];

      // Fetch attendance data for each user and additional user details
      const usersData = await Promise.all(
        enrolledUsers.map(async (user) => {
          const userDocRef = doc(db, "Users", user.userId);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            
            return {
              ...user,
              fullName: userData.fullName || "Anonymous",
              department: userData.department || "Unknown",
              email: userData.email || "No Email",
              attendanceStatus: user.attendance || "absent", // Include attendance status
            };
          }
          return null;
        })
      );

      setEnrolledUsers(usersData.filter(Boolean)); // Filter out null values
    } else {
      console.log("No such training!");
    }
  } catch (error) {
    console.error("Error fetching enrolled users:", error);
  }
};


useEffect(() => {
  const fetchEnrolledUsers = async (trainingId) => {
    try {
      const trainingDocRef = doc(db, "trainings", trainingId);
      const trainingSnapshot = await getDoc(trainingDocRef);

      if (trainingSnapshot.exists()) {
        const trainingData = trainingSnapshot.data();
        
        // Fetch the enrolled users from the training data
        const enrolledUsers = trainingData.enrolledUsers || [];

        // Get user details from the "Users" collection for each enrolled user
        const usersData = await Promise.all(
          enrolledUsers.map(async (user) => {
            const userDocRef = doc(db, "Users", user.userId);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              return {
                ...user,
                fullName: userData.fullName || "Anonymous",
                department: userData.department || "Unknown",
                email: userData.email || "No Email",
                attendanceStatus: user.attendance || "absent", // Default to absent if no attendance
              };
            }
            return null; // Return null if the user document doesn't exist
          })
        );

        // Filter out any null values (in case a user doesn't exist)
        setEnrolledUsers(usersData.filter(Boolean));
      } else {
        console.log("No such training!");
      }
    } catch (error) {
      console.error("Error fetching enrolled users:", error);
    }
  };

  if (currentTraining) {
    fetchEnrolledUsers(currentTraining.id);
  }

}, [currentTraining]); // Fetch users when `currentTraining` changes


useEffect(() => {
  if (selectedTraining && selectedTraining.id) {
    // Fetch enrolled users for the selected training when it changes
    fetchEnrolledUsers(selectedTraining.id);
  }
}, [selectedTraining]); // Fetch users when `selectedTraining` changes



// Call this function when loading the modal or when you want to fetch users' data
useEffect(() => {
  if (selectedTraining && selectedTraining.id) {
    fetchEnrolledUsers(selectedTraining.id);
  }
}, [selectedTraining]);
  


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

// You can use resetFormFields after a successful form submission, not when closing the modal.
const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};

const handleAttendanceChange = async (userId, newStatus) => {
  try {
    // Call an API to update the attendance status for the user
    const response = await fetch(`/api/updateAttendance?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attendanceStatus: newStatus }),
    });
    
    if (response.ok) {
      // Update the state after successful API call
      setEnrolledUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId ? { ...user, attendanceStatus: newStatus } : user
        )
      );
    } else {
      console.error("Failed to update attendance");
    }
  } catch (error) {
    console.error('Error updating attendance:', error);
  }
};

 // Handle update click
const handleUpdateSubmit = async () => {
  try {
    // Loop through enrolled users and update their attendance in Firestore
    await Promise.all(
      enrolledUsers.map(async (user) => {
        const attendanceStatus = attendance[user.userId] || "absent"; // Default to "absent" if no attendance is selected

        // Save the attendance record in Firestore
        await setDoc(doc(db, "attendance", `${selectedTraining.id}_${user.userId}`), {
          userId: user.userId,
          trainingId: selectedTraining.id,
          status: attendanceStatus,
          date: new Date(),
        });
      })
    );

    alert("Attendance updated successfully!");
    setShowEditModal(false); // Close the modal after updating
  } catch (error) {
    console.error("Error updating attendance:", error);
    alert("Failed to update attendance. Please try again.");
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
  };;

  





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
  const handleAddSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      try {
        await addDoc(collection(db, "trainings"), {
          trainingTitle,
          trainingDescription,
          trainingDate,
          trainingTime, // Save time in 24-hour format (no conversion needed)
          prerequisiteCertificate: selectedCertificate,
          enrolledUsers: [],
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
      try {
        const trainingDocRef = doc(db, "trainings", selectedTraining.id);
        
        // First, update the training information in Firestore
        await updateDoc(trainingDocRef, {
          trainingTitle,
          trainingDescription,
          trainingDate,
          trainingTime,
          prerequisiteCertificate: selectedCertificate,
        });

        // Update the attendance in the 'trainings' collection directly for each enrolled user
        const updatedEnrolledUsers = enrolledUsers.map(user => ({
          ...user,
          attendance: user.attendanceStatus || "absent" // Update attendance in the training document
        }));

        // Update the 'enrolledUsers' field in the 'trainings' collection with updated attendance
        await updateDoc(trainingDocRef, {
          enrolledUsers: updatedEnrolledUsers
        });

        // Loop through each enrolled user to update their attendance in the 'attendance' collection
        for (const user of enrolledUsers) {
          const status = user.attendanceStatus || "absent"; // Default to "absent"
          
          // Query to check if the user's attendance data already exists for this training
          const attendanceQuery = query(
            collection(db, "attendance"),
            where("userId", "==", user.userId),
            where("trainingId", "==", selectedTraining.id)
          );
          const querySnapshot = await getDocs(attendanceQuery);

          if (!querySnapshot.empty) {
            // Update the status if the document already exists
            querySnapshot.forEach(async (docSnapshot) => {
              const attendanceDocRef = doc(db, "attendance", docSnapshot.id);
              await updateDoc(attendanceDocRef, {
                status: status, // Update the status to 'present' or 'absent'
                date: Timestamp.now(), // Update the timestamp
              });
            });
          } else {
            // Create a new attendance document if it does not exist
            const newAttendanceDocRef = doc(collection(db, "attendance"));
            await setDoc(newAttendanceDocRef, {
              userId: user.userId,
              trainingId: selectedTraining.id,
              status: status,
              fullName: user.fullName,
              department: user.department,
              category: user.category || "General",
              email: user.email,
              date: Timestamp.now(), // Timestamp for when the attendance is recorded
            });
          }
        }

        alert("Training and attendance updated successfully!");
        setShowEditModal(false); // Close Edit modal after successful submission
        fetchTrainings(); // Refresh the training list

      } catch (error) {
        console.error("Error updating training or attendance:", error);
        alert("Failed to update training or attendance. Please try again.");
      }
    } else {
      setErrors(validationErrors);
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
  


  const handleUpdateAttendance = async () => {
    try {
      for (const user of enrolledUsers) {
        const status = attendanceStatus[user.userId] || "absent"; // Default to "absent"
        const attendanceDocRef = doc(collection(db, "attendance"));
  
        // Store the user's attendance data including full user details
        await setDoc(attendanceDocRef, {
          userId: user.userId,
          trainingId: selectedTraining.id, // Assuming selectedTraining contains training id
          status: status,
          fullName: user.fullName, // Store full name
          department: user.department, // Store department
          category: "General", // Assuming "General" is the category
          email: user.email, // Store email
          date: Timestamp.now(), // Store the current timestamp
        });
      }
      alert("Attendance updated and stored successfully!");
    } catch (error) {
      console.error("Error storing attendance data:", error);
      alert("Failed to store attendance data. Please try again.");
    }
  };

 // Function to fetch attendance status for each user
const fetchAttendanceStatus = async (trainingId) => {
  try {
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("trainingId", "==", trainingId)
    );
    const querySnapshot = await getDocs(attendanceQuery);

    const attendanceData = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attendanceData[data.userId] = data.status; // Store status keyed by userId
    });

    // Update enrolledUsers with attendance status
    const updatedEnrolledUsers = enrolledUsers.map((user) => ({
      ...user,
      attendanceStatus: attendanceData[user.userId] || "absent", // Default to "absent" if no record
    }));

    setEnrolledUsers(updatedEnrolledUsers);
  } catch (error) {
    console.error("Error fetching attendance status:", error);
  }
};
;
  
  

  
  

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
    console.log('Training clicked:', training); // Debugging log
    setSelectedTraining(training);
    setTrainingTitle(training.trainingTitle);
    setTrainingDescription(training.trainingDescription);
    setTrainingDate(training.trainingDate);
    setTrainingTime(training.trainingTime);
    setSelectedCertificate(training.prerequisiteCertificate);
    setEnrolledUsers(training.enrolledUsers || []);
    setAttendance({}); // Reset attendance tracking
    
    // Fetch attendance status from Firestore and update users
    await fetchAttendanceStatus(training.id);
    await fetchEnrolledUsers(training.id);
    
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
              onClick={() => handleSectionChange('overview')}
              className={`nav-button-super ${selectedSection === 'overview' ? 'active-super' : ''}`}
            >
              <img src={UserDefault} alt="Overview" className="nav-icon-super" />
              <span>Overview</span>
            </button> 
          </li>
          <li>
            <button
              onClick={() => navigate('/it-admin-courses')}
              className={`nav-button-super ${selectedSection === 'course' ? 'active-super' : ''}`}
            >
              <img src={CourseDefault} alt="Course" className="nav-icon-super" />
              <span>Course</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/it-admin-training')}
              className={`nav-button-super ${selectedSection === 'training' ? 'active-super' : ''}`}
            >
              <img src={TrainingDefault} alt="Training" className="nav-icon-super" />
              <span>Training</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/it-admin-certificates')}
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

        <div className="it-admin-training-grid">
          <div className="it-admin-training-header">
          {/* Existing Training Cards */}
          {trainings.map((training) => (
        <div key={training.id} className="it-admin-training-card">
          <div className="it-admin-training-header">
          <div className="it-admin-title-training">{training.trainingTitle}</div>
          <div className="dropdown-container">
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
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(training); // Call edit function
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
        </div>

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
  getPaginatedUsers().map((user, index) => (
    <div className="it-admin-training-list it-admin-training-list-item" key={index}>
      <p>{user.fullName}</p>
      <p>{user.department ? `${user.department} Department` : "Department"}</p>
      <p>{user.category || "General"}</p>
      <p>{new Date(user.enrolledDate).toLocaleDateString()}</p>
      <p className="center-email">{user.email}</p>
      <div className="attendance-section">
        <select
          className={`it-admin-training-attendance-dropdown ${user.attendanceStatus === "present" ? "present" : "absent"}`}
          value={user.attendanceStatus || "absent"} // Default to "absent" if undefined
          onChange={(e) => handleAttendanceChange(user.userId, e.target.value)} // Handle change of attendance
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
      <button onClick={handlePrevPage} disabled={currentPage === 0}>
        Previous
      </button>
      <button onClick={handleNextPage} disabled={(currentPage + 1) * usersPerPage >= enrolledUsers.length}>
        Next
      </button>
    </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleAttendanceModalClose}>Close</Button>
        </Modal.Footer>
      </Modal>
      </div>
  );
};

export default ITAdminTrainingDashboardForm;
