import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storage, db } from "../firebase"; // Firebase imports
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore"; // Firestore methods
import { Modal } from "react-bootstrap";
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for Toastify
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import './css/ITadminCertificate.css';
import { getAuth, signOut } from "firebase/auth";

const ITAdminCertificateForm = ({ selectedNav }) => {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [certificates, setCertificates] = useState([]);

  // New states for certificate details
  const [certificateTitle, setCertificateTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [dateUploaded, setDateUploaded] = useState("");
  const [selectedCertificateId, setSelectedCertificateId] = useState(null); // Store the ID of the selected certificate for editing
  const auth = getAuth();

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch certificates when component loads
    fetchCertificatesFromFirestore();
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (fileType === "application/pdf" || fileType.startsWith("image/")) {
        setFile(selectedFile);
        setErrorMessage("");
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewURL(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setErrorMessage("Please upload a PDF or an image file (PNG/JPEG) only.");
        setFile(null);
        setPreviewURL("");
      }
    }
  };

  // Fetch certificates from Firestore
  const fetchCertificatesFromFirestore = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "certificates"));
      const certificatesData = [];
      querySnapshot.forEach((doc) => {
        certificatesData.push({ id: doc.id, ...doc.data() }); // Add doc.id for deletion
      });
      setCertificates(certificatesData);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  const uploadFileToFirebase = async () => {
    if (!file) {
      setErrorMessage("Please select a valid file to upload.");
      return;
    }

    const fileName = `${file.name}-${Date.now()}`;
    const storageRef = ref(storage, `uploads/${fileName}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      // Store metadata in Firestore with the certificateId
      const docRef = await addDoc(collection(db, "certificates"), {
        title: certificateTitle,
        category: courseCategory,
        dateUploaded: dateUploaded,
        fileUrl: url,
      });

      // Fetch and store the document ID (certificateId)
      const certificateId = docRef.id;

      // You can now store certificateId in another collection or make it part of the document data
      await updateDoc(doc(db, "certificates", certificateId), {
        certificateId: certificateId,
      });

      fetchCertificatesFromFirestore(); // Refresh certificates after upload
      toast.success("Certificate added successfully!"); // Toast notification for successful addition
      setShowAddModal(false); // Close the add modal
      resetFileInput(); // Clear modal inputs
    } catch (error) {
      setErrorMessage("Error uploading file. Please try again.");
      console.error("Error uploading file:", error);
    }
  };

  const handleEdit = async () => {
    if (!selectedCertificateId) return;

    const docRef = doc(db, "certificates", selectedCertificateId);
    try {
      await updateDoc(docRef, {
        title: certificateTitle,
        category: courseCategory,
        dateUploaded: dateUploaded,
      });

      // If a new file is uploaded, handle the file upload
      if (file) {
        const fileName = `${file.name}-${Date.now()}`;
        const storageRef = ref(storage, `uploads/${fileName}`);

        // Upload the file and update the URL in Firestore
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        await updateDoc(docRef, {
          fileUrl: url, // Update the file URL
        });
      }

      fetchCertificatesFromFirestore(); // Refresh certificates after update
      toast.success("Certificate edited successfully!"); // Toast notification for successful editing
      setShowEditModal(false); // Close the edit modal
      resetFileInput(); // Clear inputs
    } catch (error) {
      console.error("Error updating certificate:", error);
      setErrorMessage("Error updating certificate. Please try again.");
    }
  };

  const resetFileInput = () => {
    setFile(null);
    setPreviewURL("");
    setErrorMessage("");
    setUploadProgress(0);
    setCertificateTitle("");
    setCourseCategory("");
    setDateUploaded("");
    setSelectedCertificateId(null); // Reset selected certificate ID
  };

  const handleDelete = async (id, fileUrl) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this certificate?");
    if (confirmDelete) {
      try {
        // Create a reference to the document to be deleted
        const docRef = doc(db, "certificates", id);
        await deleteDoc(docRef); // Delete the document from Firestore

        // Optionally, delete the file from storage
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef); // Delete the file from storage (if needed)

        fetchCertificatesFromFirestore(); // Refresh the certificates list
      } catch (error) {
        console.error("Error deleting certificate:", error);
      }
    }
  };

  return (
    <div className="admin-certificate-container">
      {/* Sidebar */}
      <div className="admin-certificate-sidebar">
        <div className="admin-certificate-header">
          <img className="admin-certificate-logo" alt="BPO Logo" src={BPOLOGO} />
        </div>
        <nav className="admin-certificate-nav">
          <div className={`admin-certificate-nav-item ${selectedNav === "overview" ? "active" : ""}`} role="button" onClick={() => navigate("/it-admin-dashboard")}>
            <img src={UserDefault} alt="User" className="admin-certificate-nav-icon" />
            Overview
          </div>
          <div className={`admin-certificate-nav-item ${selectedNav === "courses" ? "active" : ""}`} role="button" onClick={() => navigate("/it-admin-courses")}>
            <img src={CourseDefault} alt="Courses" className="admin-certificate-nav-icon" />
            Courses
          </div>
          <div className={`admin-certificate-nav-item ${selectedNav === "training" ? "active" : ""}`} role="button" onClick={() => navigate("/it-admin-training")}>
            <img src={UserDefault} alt="Training" className="admin-certificate-nav-icon" />
            Training
          </div>
          <div className={`admin-certificate-nav-item ${selectedNav === "certificate" ? "active" : ""}`} role="button" onClick={() => navigate("/it-admin-certificates")}>
            <img src={UserDefault} alt="Certificate" className="admin-certificate-nav-icon" />
            Certificate
          </div>
        </nav>
        <div className="admin-certificate-nav-logout" role="button" onClick={handleLogout}>
          <img src={LogoutDefault} alt="Logout" className="admin-certificate-nav-icon" />
          Logout
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="admin-certificate-dashboard-content">
        <h2>Upload Certificate</h2>
        <p>Click the button below to upload a PDF or PNG/JPEG file to Firebase.</p>

        <div className="admin-certificate-add-file-section">
          <div className="admin-certificate-add-file-button" onClick={() => setShowAddModal(true)}>
            <span>+ Add File</span>
          </div>

          <div className="certificate-grid">
            {certificates.map((certificate, index) => (
              <div key={index} className="certificate-preview-card" onClick={() => {
                setCertificateTitle(certificate.title);
                setCourseCategory(certificate.category);
                setDateUploaded(certificate.dateUploaded);
                setPreviewURL(certificate.fileUrl); // Set preview URL to show in modal
                setSelectedCertificateId(certificate.id); // Set the selected certificate ID
                setShowEditModal(true); // Show the edit modal
              }}>
                <div className="certificate-image-container">
                  {/* Check if the file is a PDF or an image */}
                  {certificate.fileUrl && certificate.fileUrl.endsWith(".pdf") ? (
                    <div>
                      <h5>PDF View</h5>
                      <iframe
                        src={certificate.fileUrl}
                        title={`PDF Viewer ${index + 1}`}
                        width="100%"
                        height="300px"
                        frameBorder="0"
                        style={{ border: "1px solid #ddd", borderRadius: "8px" }}
                      />
                    </div>
                  ) : (
                    <img
                      src={certificate.fileUrl}
                      alt={`Certificate ${index}`}
                      className="certificate-image"
                      style={{ width: "100%", height: "auto", borderRadius: "8px" }} // Adjust for image styling
                    />
                  )}
                </div>
                <div className="certificate-details">
                  <h4>{certificate.title || 'Certificate Title'}</h4>
                  <p>{certificate.category || 'Course Category'}</p>
                  <p>Date Created: {certificate.dateUploaded || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Alert */}
      </div>

      {/* Modal for Adding Certificate */}
      <Modal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          resetFileInput();
        }}
        dialogClassName="modal-dialog-centered"
      >
        <Modal.Body className="admin-certificate-modal-body">
          {/* Certificate Details for Add */}
          <div className="certificate-details-input">
            <label>Certificate Title:</label>
            <input
              type="text"
              value={certificateTitle}
              onChange={(e) => setCertificateTitle(e.target.value)}
              placeholder="Enter certificate title"
            />

            <label>Course Category:</label>
            <input
              type="text"
              value={courseCategory}
              onChange={(e) => setCourseCategory(e.target.value)}
              placeholder="Enter course category"
            />

            <label>Date Uploaded:</label>
            <input
              type="date"
              value={dateUploaded}
              onChange={(e) => setDateUploaded(e.target.value)}
            />
          </div>

          {/* File Input */}
          <div className="admin-certificate-file-upload-box" onClick={() => document.getElementById('fileInput').click()}>
            <input
              type="file"
              id="fileInput"
              accept=".pdf, .png, .jpeg"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <p>Select your PDF files or drag and drop</p>
          </div>

          {/* Preview */}
          {previewURL && (
            <div className="admin-certificate-file-preview-box">
              <h5>File Preview:</h5>
              {previewURL.endsWith('.pdf') ? (
                <iframe
                  src={previewURL}
                  title="PDF Preview"
                  style={{ width: "100%", height: "400px" }}
                />
              ) : (
                <img src={previewURL} alt="Preview" className="admin-certificate-preview-image" />
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && <p>Upload Progress: {uploadProgress}%</p>}
        </Modal.Body>
        <Modal.Footer className="admin-certificate-modal-footer">
          <button onClick={uploadFileToFirebase}>
            Add Certificate
          </button>
          <button
            onClick={() => {
              setShowAddModal(false);
              resetFileInput();
            }}
            className="btn btn-secondary"
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Editing Certificate */}
      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          resetFileInput();
        }}
        dialogClassName="modal-dialog-centered"
      >
        <Modal.Body className="admin-certificate-modal-body">
          {/* Certificate Details for Edit */}
          <div className="certificate-details-input">
            <label>Certificate Title:</label>
            <input
              type="text"
              value={certificateTitle}
              onChange={(e) => setCertificateTitle(e.target.value)}
              placeholder="Enter certificate title"
            />

            <label>Course Category:</label>
            <input
              type="text"
              value={courseCategory}
              onChange={(e) => setCourseCategory(e.target.value)}
              placeholder="Enter course category"
            />

            <label>Date Uploaded:</label>
            <input
              type="date"
              value={dateUploaded}
              onChange={(e) => setDateUploaded(e.target.value)}
            />
          </div>

          {/* File Input */}
          <div className="admin-certificate-file-upload-box" onClick={() => document.getElementById('fileInput').click()}>
            <input
              type="file"
              id="fileInput"
              accept=".pdf, .png, .jpeg"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <p>Select your PDF files or drag and drop</p>
          </div>

          {/* Preview */}
          {previewURL && (
            <div className="admin-certificate-file-preview-box">
              <h5>File Preview:</h5>
              {previewURL.endsWith('.pdf') ? (
                <iframe
                  src={previewURL}
                  title="PDF Preview"
                  style={{ width: "100%", height: "400px" }}
                />
              ) : (
                <img src={previewURL} alt="Preview" className="admin-certificate-preview-image" />
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && <p>Upload Progress: {uploadProgress}%</p>}
        </Modal.Body>
        <Modal.Footer className="admin-certificate-modal-footer">
          <button onClick={handleEdit}>
            Save Changes
          </button>
          <button
            onClick={() => {
              handleDelete(selectedCertificateId, previewURL); // Call handleDelete to delete the selected certificate
            }}
            className="btn btn-danger"
          >
            Delete
          </button>
          <button
            onClick={() => {
              setShowEditModal(false);
              resetFileInput();
            }}
            className="btn btn-secondary"
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      <ToastContainer /> {/* Add ToastContainer for notifications */}
    </div>
  );
};

export default ITAdminCertificateForm;
