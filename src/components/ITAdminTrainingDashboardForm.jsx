import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"; // Firestore methods
import { db } from "../firebase"; // Firestore configuration
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import './css/ITAdminTraining.css';
import './css/AdminFormSuper.css';

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


  const navigate = useNavigate();

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

  


  // Convert 24-hour time to 12-hour format
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


const getPaginatedUsers = () => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return enrolledUsers.slice(start, end);
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
        const formattedTime = formatTimeTo12Hour(trainingTime); // Convert to 12-hour format with AM/PM
        await addDoc(collection(db, "trainings"), {
          trainingTitle,
          trainingDescription,
          trainingDate,
          trainingTime: formattedTime,
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

  // Handle form submission to update training
  const handleEditSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      try {
        const formattedTime = formatTimeTo12Hour(trainingTime); // Convert to 12-hour format with AM/PM
        const trainingDocRef = doc(db, "trainings", selectedTraining.id);
        await updateDoc(trainingDocRef, {
          trainingTitle,
          trainingDescription,
          trainingDate,
          trainingTime: formattedTime,
          prerequisiteCertificate: selectedCertificate,
        });
        alert("Training updated successfully!");
        setShowEditModal(false); // Close Edit modal after successful submission
        fetchTrainings();
      } catch (e) {
        console.error("Error updating document: ", e);
        alert("Failed to update training. Please try again.");
      }
    } else {
      setErrors(validationErrors);
    }
  };
  // Handle delete training
  const handleDelete = async (trainingId) => {
    if (window.confirm("Are you sure you want to delete this training?")) {
      try {
        await deleteDoc(doc(db, "trainings", trainingId));
        alert("Training deleted successfully!");
        fetchTrainings();
        handleEditModalClose();
      } catch (error) {
        console.error("Error deleting training:", error);
      }
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
  

  // Handle training card click to open edit modal and fetch enrolled users
  const handleTrainingClick = async (training) => {
    resetFormFields(); // Reset before opening a new one
    setTrainingTitle(training.trainingTitle);
    setTrainingDescription(training.trainingDescription);
    setTrainingDate(training.trainingDate);
    setTrainingTime(training.trainingTime); // No need to format since it's stored correctly
    setSelectedCertificate(training.prerequisiteCertificate);
    setEnrolledUsers(training.enrolledUsers || []); // Ensure enrolledUsers is set
    setSelectedTraining(training);
    setShowEditModal(true);
    const users = training.enrolledUsers || [];
    setEnrolledUsers(users);
  };

  return (
    <div className="it-admin-training-dashboard-container">
      {/* Sidebar */}
      <div className="it-admin-training-sidebar">
        <div className="it-admin-training-header">
          <img className="it-admin-training-logo" alt="BPO Logo" src={BPOLOGO} />
        </div>
        <nav className="it-admin-training-nav">
          <div
            className={`it-admin-training-nav-item ${selectedNav === "overview" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-dashboard")}
          >
            <img src={UserDefault} alt="User" className="it-admin-training-nav-icon" />
            Overview
          </div>
          <div
            className={`it-admin-training-nav-item ${selectedNav === "courses" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-courses")}
          >
            <img src={CourseDefault} alt="Courses" className="it-admin-training-nav-icon" />
            Courses
          </div>
          <div
            className={`it-admin-training-nav-item ${selectedNav === "training" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-training")}
          >
            <img src={UserDefault} alt="Training" className="it-admin-training-nav-icon" />
            Training
          </div>
          <div
            className={`it-admin-training-nav-item ${selectedNav === "certificate" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-certificates")}
          >
            <img src={UserDefault} alt="Certificate" className="it-admin-training-nav-icon" />
            Certificate
          </div>
        </nav>
        <div className="it-admin-training-nav-logout" role="button" onClick={() => navigate("/login")}>
          <img src={LogoutDefault} alt="Logout" className="it-admin-training-nav-icon" />
          Logout
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="it-admin-training-dashboard-content">
        <h2 className="it-admin-training-title">Schedule Training</h2>

        <div className="it-admin-training-grid">
          {/* Existing Training Cards */}
          {trainings.map((training) => (
            <div
              key={training.id}
              className="it-admin-training-card"
              onClick={() => handleTrainingClick(training)} // Open Edit modal
            >
              <h3>{training.trainingTitle}</h3>
              <p>{training.trainingDescription}</p>
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

      {/* Modal for Adding Training */}
      <Modal show={showAddModal} onHide={handleAddModalClose} centered>
        <Modal.Header>
          <Modal.Title>Add Training</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="trainingTitle">
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
            </Form.Group>

            <Form.Group controlId="trainingDescription" className="mt-3">
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
            </Form.Group>

            <Form.Group controlId="trainingDate" className="mt-3">
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
            </Form.Group>

            <Form.Group controlId="trainingTime" className="mt-3">
              <Form.Label>Time</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Form.Control
                  type="time"
                  value={trainingTime}
                  onChange={(e) => setTrainingTime(e.target.value)}
                  isInvalid={!!errors.trainingTime}
                  style={{ flex: 1, marginRight: '10px' }} // Ensure time input takes more space
                />
                <Form.Control
                  as="select"
                  value={amPm}
                  onChange={(e) => handleAmPmChange(e.target.value)} // Handle AM/PM change
                  style={{ flexBasis: '80px' }} // Fix width for AM/PM dropdown
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </Form.Control>
              </div>
              {errors.trainingTime && (
                <Form.Control.Feedback type="invalid">
                  {errors.trainingTime}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {/* Prerequisite Certificate Dropdown */}
            <Form.Group controlId="prerequisiteCertificate" className="mt-3">
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
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleAddModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAddSubmit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Editing Training */}
      <Modal show={showEditModal} onHide={handleEditModalClose} centered>
        <Modal.Header>
          <Modal.Title>Edit Training</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="trainingTitle">
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
            </Form.Group>

            <Form.Group controlId="trainingDescription" className="mt-3">
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
            </Form.Group>

            <Form.Group controlId="trainingDate" className="mt-3">
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
            </Form.Group>

            <Form.Group controlId="trainingTime" className="mt-3">
              <Form.Label>Time</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Form.Control
                  type="time"
                  value={trainingTime}
                  onChange={(e) => setTrainingTime(e.target.value)}
                  isInvalid={!!errors.trainingTime}
                  style={{ flex: 1, marginRight: '10px' }} // Ensure time input takes more space
                />
                <Form.Control
                  as="select"
                  value={amPm}
                  onChange={(e) => handleAmPmChange(e.target.value)} // Handle AM/PM change
                  style={{ flexBasis: '80px' }} // Fix width for AM/PM dropdown
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </Form.Control>
              </div>
              {errors.trainingTime && (
                <Form.Control.Feedback type="invalid">
                  {errors.trainingTime}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {/* Prerequisite Certificate Dropdown */}
            <Form.Group controlId="prerequisiteCertificate" className="mt-3">
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
            </Form.Group>
            <div className="it-admin-training-container">
 <div className="it-admin-training-search-bar-container">
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

{enrolledUsers && enrolledUsers.length > 0 ? (
  enrolledUsers.map((user, index) => (
    <div className="it-admin-training-list it-admin-training-list-item" key={index}>
      <p>{user.fullName}</p>
      <p>{user.department ? `${user.department} Department` : "Department"}</p>
      <p>General</p> {/* Assuming you are hardcoding the category */}
      <p>{new Date(user.enrolledDate).toLocaleDateString()}</p>
      <p className="center-email">{user.email}</p>
      <div className="attendance-section">
        {/* Dropdown for attendance */}
        <select className="it-admin-training-attendance-dropdown" defaultValue="">
          <option value="" disabled>Action</option> {/* Default label */}
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      </div>
    </div>
  ))
) : (
  <p>No users enrolled yet.</p>
)}

  
   {/* Pagination */}
   <div className="it-admin-training-pagination">
        {[...Array(totalPages)].map((_, pageIndex) => (
          <button
            key={pageIndex}
            className={`it-admin-training-pagination-button ${currentPage === pageIndex + 1 ? 'active' : ''}`}
            onClick={() => handlePageChange(pageIndex + 1)}
          >
            {pageIndex + 1}
          </button>
        ))}
      </div>
    </div>




          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleEditModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleEditSubmit}>
            Update
          </Button>
          <Button variant="danger" onClick={() => handleDelete(selectedTraining.id)}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ITAdminTrainingDashboardForm;
