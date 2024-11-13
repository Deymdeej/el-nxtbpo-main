import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storage, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Modal } from "react-bootstrap";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import './css/ITadminCertificate.css';
import CloseIcon from '../assets/closebtn.svg';
import TrainingDefault from '../assets/trainingdefault.png';
import CertDefault from '../assets/certdefault.png';

const ITAdminCertificateForm = ({ selectedNav }) => {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768); // Initialize based on screen size
  const [selectedSection, setSelectedSection] = useState('certificate');

  const [certificateTitle, setCertificateTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [dateUploaded, setDateUploaded] = useState("");
  const [selectedCertificateId, setSelectedCertificateId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCertificatesFromFirestore();
  }, []);

  const handleLogout = () => {
    navigate("/login");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (fileType === "application/pdf" || fileType.startsWith("image/")) {
        setFile(selectedFile);
        setErrorMessage("");
        if (fileType === "application/pdf") {
          const objectURL = URL.createObjectURL(selectedFile);
          setPreviewURL(objectURL);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewURL(reader.result);
          };
          reader.readAsDataURL(selectedFile);
        }
      } else {
        setErrorMessage("Please upload a PDF or an image file (PNG/JPEG) only.");
        setFile(null);
        setPreviewURL("");
      }
    }
  };

  const fetchCertificatesFromFirestore = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "certificates"));
      const certificatesData = [];
      querySnapshot.forEach((doc) => {
        certificatesData.push({ id: doc.id, ...doc.data() });
      });
      setCertificates(certificatesData);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };
  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth > 768); // Show sidebar if screen is larger than 768px
    };

    // Attach the event listener
    window.addEventListener('resize', handleResize);

    // Clean up the event listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      const currentTimestamp = new Date().toISOString();

      await addDoc(collection(db, "certificates"), {
        title: certificateTitle,
        category: courseCategory,
        dateUploaded: currentTimestamp,
        fileUrl: url,
      });

      fetchCertificatesFromFirestore();
      toast.success("Certificate added successfully!");
      setShowAddModal(false);
      resetFileInput();
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

      if (file) {
        const fileName = `${file.name}-${Date.now()}`;
        const storageRef = ref(storage, `uploads/${fileName}`);

        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        await updateDoc(docRef, {
          fileUrl: url,
        });
      }

      fetchCertificatesFromFirestore();
      toast.success("Certificate edited successfully!");
      setShowEditModal(false);
      resetFileInput();
    } catch (error) {
      console.error("Error updating certificate:", error);
      setErrorMessage("Error updating certificate. Please try again.");
    }
  };

  const resetFileInput = () => {
    setFile(null);
    setPreviewURL("");
    setErrorMessage("");
    setCertificateTitle("");
    setCourseCategory("");
    setDateUploaded("");
    setSelectedCertificateId(null);
  };

  const handleDelete = async (id, fileUrl) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const docRef = doc(db, "certificates", id);
          await deleteDoc(docRef);

          if (fileUrl) {
            const fileRef = ref(storage, fileUrl);
            await deleteObject(fileRef);
          }

          fetchCertificatesFromFirestore();
          toast.success("Certificate deleted successfully!");
          setShowEditModal(false);
        } catch (error) {
          console.error("Error deleting certificate:", error);
          toast.error("Error deleting certificate. Please try again.");
        }
      }
    });
  };

  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);

    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });

    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';

    const formattedTime = `${hours % 12 || 12}:${minutes} ${period}`;

    return `${formattedDate} - ${formattedTime}`;
  };

  const handleModalClose = () => {
    if (previewURL && file?.type === 'application/pdf') {
      URL.revokeObjectURL(previewURL);
    }
    resetFileInput();
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
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
            onClick={() => handleSectionChange('certificate')}
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

        <h11>Upload Certificate</h11>
        <p>Click the button below to upload a PDF or PNG/JPEG file.</p>

        <div className="admin-certificate-add-file-section">
          <div className="certificate-grid">
            {/* Render existing certificates */}
            {certificates.length > 0 ? (
              <>
                {certificates.map((certificate, index) => (
                  <div key={index} className="certificate-preview-card" onClick={() => {
                    setCertificateTitle(certificate.title);
                    setCourseCategory(certificate.category);
                    setDateUploaded(certificate.dateUploaded);
                    setPreviewURL(certificate.fileUrl);
                    setSelectedCertificateId(certificate.id);
                    setShowEditModal(true);
                  }}>
                    <div className="certificate-image-container">
                      {certificate.fileUrl && certificate.fileUrl.endsWith(".pdf") ? (
                        <div className="pdf-preview">
                          <iframe
                            src={certificate.fileUrl}
                            title={`PDF Viewer ${index + 1}`}
                            width="100%"
                            height="240px"
                            frameBorder="0"
                          />
                        </div>
                      ) : (
                        <img
                          src={certificate.fileUrl || 'path/to/default-image.png'}
                          alt={`Certificate ${index}`}
                          className="certificate-image-full"
                        />
                      )}
                    </div>
                    <div className="certificate-details">
                      <h4>{certificate.title || 'Certificate Title'}</h4>
                      <span className="course-category-badge">{certificate.category || 'Course Category'}</span>
                    </div>
                  </div>
                ))}
                {/* "Add Certificate" button */}
                <div className="admin-certificate-add-file-button" onClick={() => {
                  resetFileInput();
                  setShowAddModal(true);
                }}>

                  <div className="admin-certificate-add-icon">+</div>
         
                  <span>Add Certificate</span>
                </div>
              </>
            ) : (
              <div className="admin-certificate-add-file-button" onClick={() => {
                resetFileInput();
                setShowAddModal(true);
              }}>
                 <div className="admin-certificate-add-icon">+</div>
                <span>Add Certificate</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Adding Certificate */}
      <Modal 
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          resetFileInput();
        }}
        dialogClassName="modal-dialog-centered"
        size="lg"
        centered
      >
        <Modal.Header className="admin-certificate-modal-header-custom">
          <h4 className="modal-title">Add Certificate</h4>
          <img
            src={CloseIcon}
            alt="Close"
            className="close-button-certificate"
            onClick={() => setShowAddModal(false)}
          />
        </Modal.Header>

        <Modal.Body className="admin-certificate-modal-body">
          {/* Certificate Details */}
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
            <p>Select your file or drag and drop</p>
          </div>

          {/* Preview */}
          {previewURL && (
            <div className="admin-certificate-file-preview-box">
              <h9>File Preview:</h9>
              {file?.type === 'application/pdf' ? (
                <iframe
                  src={previewURL}
                  title="PDF Preview"
                  style={{ width: "100%", height: "70vh" }}
                />
              ) : (
                <img src={previewURL} alt="Preview" className="admin-certificate-preview-image" />
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="admin-certificate-add-footer-reconstructed">
          <button className="add-certificate-btn" onClick={uploadFileToFirebase}>
            Add Certificate
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Editing Certificate */}
      <Modal
  show={showEditModal}
  onHide={handleModalClose}
  dialogClassName="modal-dialog-centered"
>
  <Modal.Header className="admin-certificate-modal-header-custom">
    <h4 className="modal-title">Edit Certificate</h4>
    <img
      src={CloseIcon}
      alt="Close"
      className="close-button-certificate"
      onClick={handleModalClose}
    />
  </Modal.Header>

  <Modal.Body className="admin-certificate-modal-body-scrollable">
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
      <p>Select your file or drag and drop</p>
    </div>

    {/* Preview */}
    {previewURL && (
      <div className="admin-certificate-file-preview-box">
        <h5>PDF Preview:</h5>
        {file?.type === 'application/pdf' ? (
          <iframe
            src={previewURL}
            title="PDF Preview"
            style={{ width: "100%", height: "90vh" }}  // Increased height for better visibility
          />
        ) : (
          <img src={previewURL} alt="Preview" className="admin-certificate-preview-image" />
        )}
      </div>
    )}
  </Modal.Body>

  <Modal.Footer className="admin-certificate-modal-footer-reconstructed">
    <button className="save-certificate-button" onClick={handleEdit}>Save Changes</button>
    <button className="delete-certificate-button" onClick={() => handleDelete(selectedCertificateId, previewURL)}>Delete</button>
  </Modal.Footer>
</Modal>
      <ToastContainer />
    </div>
  );
};

export default ITAdminCertificateForm;
