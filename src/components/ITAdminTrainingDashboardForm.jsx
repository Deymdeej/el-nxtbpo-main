import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"; // Firestore methods
import { db } from "../firebase"; // Firestore configuration
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import './css/ITAdminTraining.css';

const ITAdminTrainingDashboardForm = ({ selectedNav }) => {
  const [showAddModal, setShowAddModal] = useState(false); // For adding new training
  const [showEditModal, setShowEditModal] = useState(false); // For editing existing training
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingDescription, setTrainingDescription] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [trainingTime, setTrainingTime] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [errors, setErrors] = useState({});
  const [trainings, setTrainings] = useState([]);
  const [enrolledUsers, setEnrolledUsers] = useState([]);

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
    fetchCertificates();
    fetchTrainings();
  }, []);

  // Handle modal close and reset
  const handleAddModalClose = () => {
    setShowAddModal(false);
    resetFormFields();
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    resetFormFields();
    setSelectedTraining(null);
    setEnrolledUsers([]);
  };

  // Handle form reset
  const resetFormFields = () => {
    setTrainingTitle("");
    setTrainingDescription("");
    setTrainingDate("");
    setTrainingTime("");
    setSelectedCertificate("");
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
  const handleAddSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      try {
        await addDoc(collection(db, "trainings"), {
          trainingTitle,
          trainingDescription,
          trainingDate,
          trainingTime,
          prerequisiteCertificate: selectedCertificate,
          enrolledUsers: [],
        });
        alert("Training added successfully!");
        handleAddModalClose();
        fetchTrainings();
      } catch (e) {
        console.error("Error adding document: ", e);
        alert("Failed to add training. Please try again.");
      }
    } else {
      setErrors(validationErrors);
    }
  };

  // Fetch enrolled users for a specific training
  const fetchEnrolledUsers = async (trainingId) => {
    try {
      const docRef = doc(db, "trainings", trainingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const trainingData = docSnap.data();
        setEnrolledUsers(trainingData.enrolledUsers || []);
      }
    } catch (error) {
      console.error("Error fetching enrolled users: ", error);
    }
  };

  // Handle form submission to update training
  const handleEditSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      try {
        const trainingDocRef = doc(db, "trainings", selectedTraining.id);
        await updateDoc(trainingDocRef, {
          trainingTitle,
          trainingDescription,
          trainingDate,
          trainingTime,
          prerequisiteCertificate: selectedCertificate,
        });
        alert("Training updated successfully!");
        handleEditModalClose();
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

  // Handle training card click to open edit modal
  const handleTrainingClick = async (training) => {
    resetFormFields(); // Reset before opening a new one
    setTrainingTitle(training.trainingTitle);
    setTrainingDescription(training.trainingDescription);
    setTrainingDate(training.trainingDate);
    setTrainingTime(training.trainingTime);
    setSelectedCertificate(training.prerequisiteCertificate);
    setSelectedTraining(training);
    await fetchEnrolledUsers(training.id);
    setShowEditModal(true);
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
                <p>{training.trainingTime}</p>
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
