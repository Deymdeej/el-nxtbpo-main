import React, { useEffect, useState } from "react";
import { db, storage } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, getDocs } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import CustomModal from './CustomModal';
import './css/ITAdminCoursePage.css';
import { Button, Modal } from 'react-bootstrap';
import Switch from "react-switch";

import { auth } from "../firebase";
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import pdfIcon from '../assets/pdf.png';
import trashIcon from '../assets/trash.png';
import editIcon from '../assets/edit.png';

const ITAdminCoursePage = ({ courses, setCourses, enrollmentCounts, selectedNav }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [category, setCategory] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [prerequisites, setPrerequisites] = useState([]);
  const [questions, setQuestions] = useState([{ question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isVideoLinkEnabled, setIsVideoLinkEnabled] = useState(false);

  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(''); // Certificate

  const handleToggleVideoLink = () => {
    setIsVideoLinkEnabled(!isVideoLinkEnabled);
  };

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch GeneralCourses and ITCourses
    const unsubscribeGeneralCourses = onSnapshot(collection(db, 'GeneralCourses'), (snapshot) => {
      const generalCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: 'General',
        ...doc.data(),
      }));
      setCourses((prevCourses) => {
        const otherCourses = prevCourses.filter((course) => course.category !== 'General');
        return [...otherCourses, ...generalCourses];
      });
    });
  
    const unsubscribeITCourses = onSnapshot(collection(db, 'ITCourses'), (snapshot) => {
      const itCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: 'IT',
        ...doc.data(),
      }));
      setCourses((prevCourses) => {
        const otherCourses = prevCourses.filter((course) => course.category !== 'IT');
        return [...otherCourses, ...itCourses];
      });
    });
  
    // Fetch Certificates
    const fetchCertificates = async () => {
      try {
        const certificatesSnapshot = await getDocs(collection(db, "certificates"));
        const certificatesData = certificatesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCertificates(certificatesData);
      } catch (error) {
        console.error("Error fetching certificates:", error);
      }
    };
  
    fetchCertificates(); // Fetch certificates only once
  
    // Clean up function to unsubscribe from onSnapshot when component unmounts
    return () => {
      unsubscribeGeneralCourses();
      unsubscribeITCourses();
    };
  }, [setCourses, setCertificates]); // Ensure useEffect depends on setCourses and setCertificates
  
  // Fetch certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const certificatesSnapshot = await getDocs(collection(db, "certificates"));
        const certificatesData = certificatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched Certificates:", certificatesData);  // Check if certificates are fetched
        setCertificates(certificatesData);
      } catch (error) {
        console.error("Error fetching certificates:", error);
      }
    };
  
    fetchCertificates();
  }, []);
  

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleOpenModal = () => {
    setCourseTitle('');
    setCourseDescription('');
    setCategory('');
    setVideoLink('');
    setPrerequisites([]);
    setQuestions([{ question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
    setUploadedFiles([]);
    setIsVideoLinkEnabled(false);
    setErrors({});
    
    // Initialize certificateId for the dropdown
    setSelectedCertificate('');
  
    setIsModalOpen(true);
  };
  
  

  const handleCloseModal = () => {
    setErrors({});
    setCourseTitle('');
    setCourseDescription('');
    setCategory('');
    setVideoLink('');
    setPrerequisites([]);
    setQuestions([{ question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
    setUploadedFiles([]);
    setIsModalOpen(false);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type === "application/pdf");
    if (validFiles.length > 0) {
      setUploadedFiles([...uploadedFiles, ...validFiles.map(file => ({
        name: file.name,
        size: file.size,
        file,
      }))]);
      setErrors({});
    } else {
      setErrors({ pdfFile: "Please select valid PDF files." });
    }
  };

  const handleCertificateChange = (field, value) => {
    setSelectedCourse((prevCourse) => ({
      ...prevCourse,
      certificate: {
        ...prevCourse.certificate,
        [field]: value,
      },
    }));
  };



  const openEditModal = (course) => {
    // Find the certificate for this specific course
    const certificate = certificates.find((cert) => cert.id === course.certificateId);
    
    // Set the selected course data
    setSelectedCourse({
      ...course,
      certificate: certificate ? { title: certificate.title, id: certificate.id } : { title: "", id: "" },
    });
  
    // Populate modal fields with course data
    setCourseTitle(course.courseTitle);
    setCourseDescription(course.courseDescription);
    setCategory(course.category);
    setVideoLink(course.videoLink);
    setSelectedCertificate(course.certificateId); // Set the selected certificateId
    
    // Open the edit modal
    setShowEditModal(true);
  };
  

  const handleDeleteFile = async (pdfUrl) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this PDF?");
    
    if (confirmDelete) {
      try {
        // Create a reference to the file to delete
        const storageRef = ref(storage, pdfUrl);
  
        // Delete the file
        await deleteObject(storageRef);
        window.alert("PDF deleted successfully!");
  
        // Update your state to remove the file locally as well (if needed)
        setSelectedCourse((prevCourse) => ({
          ...prevCourse,
          pdfURLs: prevCourse.pdfURLs.filter((url) => url !== pdfUrl),
        }));
  
        // Optionally, update Firestore if you're storing the PDF URLs in a document
        const collectionName = selectedCourse.category === "General" ? "GeneralCourses" : "ITCourses";
        const docRef = doc(db, collectionName, selectedCourse.id);
        await updateDoc(docRef, {
          pdfURLs: selectedCourse.pdfURLs.filter((url) => url !== pdfUrl),
        });
  
      } catch (error) {
        console.error("Error deleting PDF:", error);
        window.alert("An error occurred while deleting the PDF. Please try again.");
      }
    }
  };
  

  const handleChangeQuestion = (index, event) => {
    const { name, value } = event.target;
    const updatedQuestions = [...questions];
    updatedQuestions[index][name] = value;
    setQuestions(updatedQuestions);
  };

  const handleChangeChoice = (qIndex, cIndex, event) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].choices[cIndex] = event.target.value;
    setQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
  };

  const handleCorrectAnswerChange = (index, event) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].correctAnswer = event.target.value;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setErrors({ pdfFile: "Please upload at least one PDF file." });
      return;
    }

    let validationErrors = {};
    if (!courseTitle) validationErrors.courseTitle = "Course Title is required.";
    if (!courseDescription) validationErrors.courseDescription = "Course Description is required.";
    if (!category) validationErrors.category = "Category is required.";
    if (!selectedCertificate) validationErrors.selectedCertificate = "Certificate is required.";

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const uploadedFileURLs = await Promise.all(
        uploadedFiles.map(async (fileData) => {
          const storageRef = ref(storage, `courses/${fileData.name}`);
          const uploadTask = uploadBytesResumable(storageRef, fileData.file);

          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null,
              (error) => reject(error),
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              }
            );
          });
        })
      );

      const collectionName = category === "General" ? "GeneralCourses" : "ITCourses";
      await addDoc(collection(db, collectionName), {
        courseTitle,
        courseDescription,
        category,
        videoLink,
        prerequisites,
        questions,
        pdfURLs: uploadedFileURLs,
        certificateId: selectedCertificate,
        createdAt: new Date(),
      });

      window.alert("Course added successfully!");
      handleCloseModal();
    } catch (error) {
      console.error("Error uploading files or adding course:", error);
    }
  };

  const handleUpdateCourse = async () => {
    try {
      const collectionName = category === "General" ? "GeneralCourses" : "ITCourses";
      const docRef = doc(db, collectionName, selectedCourse.id);

      if (!docRef) {
        throw new Error("Invalid document reference");
      }

      let updatedPDFURLs = selectedCourse.pdfURLs ? [...selectedCourse.pdfURLs] : [];

      if (uploadedFiles.length > 0) {
        const uploadPromises = uploadedFiles.map((fileData) => {
          const storageRef = ref(storage, `courses/${fileData.name}`);
          const uploadTask = uploadBytesResumable(storageRef, fileData.file);

          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null,
              (error) => {
                console.error("Upload error:", error);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              }
            );
          });
        });

        const newPDFURLs = await Promise.all(uploadPromises);
        updatedPDFURLs = [...updatedPDFURLs, ...newPDFURLs];
      }

      await updateDoc(docRef, {
        courseTitle,
        courseDescription,
        category,
        videoLink,
        pdfURLs: updatedPDFURLs,
        certificateId: selectedCertificate,
      });

      window.alert("Course updated successfully!");
      handleCloseModal();
    } catch (error) {
      console.error("Error updating course:", error);
      window.alert("Error updating course. Please try again.");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      const collectionName = selectedCourse.category === "General" ? "GeneralCourses" : "ITCourses";
      const docRef = doc(db, collectionName, courseId);
      await deleteDoc(docRef);
      window.alert("Course deleted successfully!");
      closeCourseModal();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const closeCourseModal = () => {
    setShowCourseModal(false);
    setSelectedCourse(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCourse(null);
    setUploadedFiles([]);
  };
  const openCourseModal = (course) => {
    const certificate = certificates.find((cert) => cert.id === course.certificateId);
    setSelectedCourse({
      ...course,
      certificateTitle: certificate ? certificate.title : "No certificate available",
      certificateFileUrl: certificate ? certificate.fileUrl : null,
    });
    setShowCourseModal(true);
  };
  

  const filteredCourses = courses.filter((course) => {
    const matchesTitle = course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || course.category === filterCategory;
    return matchesTitle && matchesCategory;
  });

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="header">
          <img className="logo" alt="BPO Logo" src={BPOLOGO} />
        </div>
        <nav className="nav">
          <div
            className={`nav-item ${selectedNav === "overview" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-dashboard")}
          >
            <img src={UserDefault} alt="User" className="nav-icon" />
            Overview
          </div>
          <div
            className={`nav-item ${selectedNav === "courses" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-courses")}
          >
            <img src={CourseDefault} alt="Courses" className="nav-icon" />
            Courses
          </div>
          <div
            className={`nav-item ${selectedNav === "training" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-training")}
          >
            <img src={UserDefault} alt="Training" className="nav-icon" />
            Training
          </div>
          <div
            className={`nav-item ${selectedNav === "certificate" ? "active" : ""}`}
            role="button"
            onClick={() => navigate("/it-admin-certificates")}
          >
            <img src={UserDefault} alt="Certificate" className="nav-icon" />
            Certificate
          </div>
        </nav>
        <div className="nav-logout" role="button" onClick={handleLogout}>
          <img src={LogoutDefault} alt="Logout" className="nav-icon" />
          Logout
        </div>
      </div>

      {/* Main content area */}
      <div className="container main-content">
  <div className="row">
    <div className="col-md-12">
      <h4>All Courses</h4>

      {/* Search Bar and Filter By Category */}
      <div className="filter-section">
        <input
          type="text"
          placeholder="Search course title"
          className="search-bar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">Filter By: All</option>
          <option value="General">General</option>
          <option value="IT">IT</option>
        </select>
      </div>

      {/* Courses Grid */}
      <div className="course-grid-horizontal">
        {filteredCourses.length === 0 ? (
          <p>No courses available</p>
        ) : (
          filteredCourses.map((course, index) => (
            <div
              key={index}
              className="course-card-horizontal"
              onClick={() => openCourseModal(course)}
              style={{ cursor: "pointer" }}
            >
              <div className="course-card-header">
                <h5 className="course-title">{course.courseTitle}</h5>
              </div>
              <img
                src={editIcon}
                alt="Edit"
                className="edit-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(course);
                }}
              />
              <p className="course-description">{course.courseDescription}</p>
              <span className="category-tag">{course.category}</span>
              <div className="course-footer">
                <p>Enrolled Users: {enrollmentCounts[course.id] || 0}</p>
              </div>
            </div>
          ))
        )}

        {/* Add Course Button (Always Visible) */}
        <div className="course-card-horizontal add-course-card" onClick={handleOpenModal}>
          <div className="add-icon">+</div>
          <p>Add Course</p>
        </div>
              </div>
            
          </div>
        </div>

        {/* Modal for Course Details */}
        {selectedCourse && (
          <Modal show={showCourseModal} onHide={closeCourseModal}>
            <Modal.Body>
              <p><strong>Description:</strong> {selectedCourse.courseDescription}</p>
              <p><strong>Category:</strong> {selectedCourse.category}</p>
              <p><strong>Prerequisites:</strong> 
                {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 ? (
                  selectedCourse.prerequisites
                    .map(prereqId => {
                      const prereqCourse = courses.find(course => course.id === prereqId);
                      return prereqCourse ? prereqCourse.courseTitle : "Unknown";
                    })
                    .join(', ')
                ) : "None"}
              </p>

              {/* Quiz Questions */}
              {selectedCourse.questions?.length > 0 && (
                <div>
                  <h5>Quiz Questions:</h5>
                  {selectedCourse.questions.map((question, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                      <h6>Question {index + 1}: {question.question}</h6>
                      <div>
                        {question.choices.map((choice, choiceIndex) => (
                          <div key={choiceIndex}>
                            <strong>{String.fromCharCode(65 + choiceIndex)}:</strong> {choice}
                          </div>
                        ))}
                      </div>
                      <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* PDF View */}
              {selectedCourse.pdfURLs?.length > 0 && (
                <div>
                  <h5>PDF View:</h5>
                  {selectedCourse.pdfURLs.map((pdfUrl, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                      <h6>PDF {index + 1}</h6>
                      <iframe
                        src={pdfUrl}
                        title={`PDF Viewer ${index + 1}`}
                        width="90%"
                        height="500px"
                        frameBorder="0"
                        style={{ border: "1px solid #ddd", borderRadius: "8px" }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Display the YouTube video if the video link is available */}
              {selectedCourse.videoLink && (
                <div style={{ marginTop: '20px' }}>
                  <h5>Video:</h5>
                  <div className="video-container">
                    <iframe
                      width="100%"
                      height="400"
                      src={selectedCourse.videoLink.replace("watch?v=", "embed/")}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Display certificate */}
            
{/* Display certificate */}
{selectedCourse.certificateFileUrl && (
  <div style={{ marginTop: '20px' }}>
    <h5>Certificate:</h5>
    <p><strong>Title:</strong> {selectedCourse.certificateTitle || "No title available"}</p>

    {/* If the certificate is a PDF */}
    {selectedCourse.certificateFileUrl.endsWith('.pdf') ? (
      <iframe
        src={selectedCourse.certificateFileUrl}
        title="Certificate PDF"
        width="90%"
        height="500px"
        frameBorder="0"
        style={{ border: "1px solid #ddd", borderRadius: "8px" }}
      />
    ) : (
      // If the certificate is an image
      <img
        src={selectedCourse.certificateFileUrl}
        alt="Certificate Image"
        style={{ width: "90%", height: "auto", border: "1px solid #ddd", borderRadius: "8px" }}
      />
    )}
  </div>
)}



            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeCourseModal}>Close</Button>
            </Modal.Footer>
          </Modal>
        )}

        {/* Modal for Editing Course */}
        {selectedCourse && (
          <Modal show={showEditModal} onHide={closeEditModal}>
            <Modal.Body>
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Enter course title"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Course Description</label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Enter course description"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-control"
                >
                  <option value="General">General</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              {/* Video Link Section for Editing */}
              <div className="form-group">
                <label>Video Link</label>
                <input
                  type="text"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="Enter YouTube video link"
                  className="form-control"
                />
              </div>

              {/* Existing PDF Files */}
              {selectedCourse.pdfURLs?.length > 0 && (
                <div>
                  <h5>Existing PDF Files:</h5>
                  {selectedCourse.pdfURLs.map((pdfUrl, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                      <h6>PDF {index + 1}</h6>
                      <iframe
                        src={pdfUrl}
                        title={`PDF Viewer ${index + 1}`}
                        width="90%"
                        height="300px"
                        frameBorder="0"
                        style={{ border: "1px solid #ddd", borderRadius: "8px" }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteFile(pdfUrl)}
                      >
                        Delete PDF
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload new PDF files */}
              <div className="form-group">
                <h4>Upload New PDF Files</h4>
                <div className="upload-section">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    id="pdfUpload"
                    className="file-input"
                    multiple
                  />
                  <label htmlFor="pdfUpload" className="upload-label">
                    Select your PDF files or drag and drop
                  </label>
                </div>

                <div className="uploaded-files">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="file-info">
                      <img src={pdfIcon} alt="PDF Icon" className="file-type-icon" />
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                        <button className="delete-file-btn" onClick={() => handleDeleteFile(file.name)}>
                          <img src={trashIcon} alt="Delete" className="trash-icon" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificate Edit Section */}
  {/* Certificate Dropdown */}
{/* Certificate Dropdown */}
<div className="form-group">
  <label>Certificate</label>
  <select
    value={selectedCertificate} // This should now reflect the selected certificate's ID
    onChange={(e) => setSelectedCertificate(e.target.value)} // Update the selected certificate
    className="form-control"
  >
    <option value="">Select a Certificate</option>
    {certificates.map((certificate) => (
      <option key={certificate.id} value={certificate.id}>
        {certificate.title}
      </option>
    ))}
  </select>
</div>





              {/* Edit Quiz Questions */}
              <div className="form-group">
                <h4>Edit Quiz Questions</h4>
                {selectedCourse.questions.map((question, index) => (
                  <div key={index}>
                    {/* Display and Edit Question */}
                    <label>Question {index + 1}:</label>
                    <input
                      type="text"
                      name="question"
                      value={question.question}
                      onChange={(e) => handleChangeQuestion(index, e)}
                      placeholder="Enter question"
                      className="form-control mb-2"
                    />

                    {/* Display and Edit Choices */}
                    <h5>Choices</h5>
                    {question.choices.map((choice, cIndex) => (
                      <div key={cIndex}>
                        <label>{String.fromCharCode(65 + cIndex)}:</label>
                        <input
                          type="text"
                          value={choice}
                          onChange={(e) => handleChangeChoice(index, cIndex, e)}
                          placeholder={`Choice ${cIndex + 1}`}
                          className="form-control mb-1"
                        />
                      </div>
                    ))}

                    {/* Display and Edit Correct Answer */}
                    <label>Correct Answer</label>
                    <select
                      name="correctAnswer"
                      value={question.correctAnswer}
                      onChange={(e) => handleCorrectAnswerChange(index, e)}
                      className="form-control mb-3"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                ))}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="danger" onClick={() => handleDeleteCourse(selectedCourse.id)}>Delete</Button>
              <Button variant="primary" onClick={handleUpdateCourse}>Update</Button>
              <Button variant="secondary" onClick={closeEditModal}>Close</Button>
            </Modal.Footer>
          </Modal>
        )}

        {/* Modal for Adding New Course */}
        {isModalOpen && (
          <CustomModal isModalOpen={isModalOpen} handleClose={handleCloseModal} handleSubmit={handleSubmit} title="Add New Course">
            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`form-control ${errors.category ? 'is-invalid' : ''}`}
              >
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="IT">IT</option>
              </select>
            </div>

            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Enter course title"
                className={`form-control ${errors.courseTitle ? 'is-invalid' : ''}`}
              />
            </div>

            <div className="form-group">
              <label>Course Description</label>
              <textarea
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                placeholder="Enter course description"
                className={`form-control ${errors.courseDescription ? 'is-invalid' : ''}`}
              />
            </div>

            {/* Certificate Dropdown */}
            <div className="form-group">
              <label>Certificate</label>
              <select
                value={selectedCertificate}
                onChange={(e) => setSelectedCertificate(e.target.value)}
                className="form-control"
              >
                <option value="">Select a Certificate</option>
                {certificates.map((certificate) => (
                  <option key={certificate.id} value={certificate.id}>
                    {certificate.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="upload-container">
              <h4>Upload PDF</h4>
              <div className="upload-section">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  id="pdfUpload"
                  className="file-input"
                  multiple
                />
                <label htmlFor="pdfUpload" className="upload-label">
                  Select your PDF files or drag and drop
                </label>
              </div>

              <div className="uploaded-files">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="file-info">
                    <img src={pdfIcon} alt="PDF Icon" className="file-type-icon" />
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <div className="file-metadata">
                        <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                        <span className="dot-separator">•</span>
                        <span className="status">
                          <i className="status-icon">✔️</i> Ready
                        </span>
                      </div>
                    </div>
                    <button className="delete-file-btn" onClick={() => handleDeleteFile(file.name)}>
                      <img src={trashIcon} alt="Delete" className="trash-icon" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Link Input */}
            <div>
              <div className="form-group">
                <label>
                  <Switch
                    onChange={handleToggleVideoLink}
                    checked={isVideoLinkEnabled}
                    className="react-switch"
                  />
                  {" "} Add Video Link
                </label>
              </div>

              {isVideoLinkEnabled && (
                <div className="form-group">
                  <label>Video Link</label>
                  <input
                    type="text"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="Enter YouTube video link"
                    className="form-control mt-2"
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Prerequisite Course</label>
              <select
                value={prerequisites.length > 0 ? prerequisites[0] : ""}
                onChange={(e) => setPrerequisites(e.target.value ? [e.target.value] : [])}
                className="form-control"
              >
                <option value="">Choose your course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <h4>Quiz Questions</h4>
              {questions.map((question, index) => (
                <div key={index} className="mb-4">
                  <input
                    type="text"
                    name="question"
                    value={question.question}
                    onChange={(e) => handleChangeQuestion(index, e)}
                    placeholder="Enter question"
                    className="form-control mb-2"
                  />
                  <h5>Choices</h5>
                  <div className="row">
                    {question.choices.map((choice, cIndex) => (
                      <div className="col-6" key={cIndex}>
                        <label>{String.fromCharCode(65 + cIndex)}. </label>
                        <input
                          type="text"
                          value={choice}
                          onChange={(e) => handleChangeChoice(index, cIndex, e)}
                          placeholder={`Choice ${cIndex + 1}`}
                          className="form-control mb-1"
                        />
                      </div>
                    ))}
                  </div>

                  <label>Correct Answer</label>
                  <select
                    name="correctAnswer"
                    value={question.correctAnswer}
                    onChange={(e) => handleCorrectAnswerChange(index, e)}
                    className="form-control mb-3"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              ))}
              <Button variant="secondary" onClick={handleAddQuestion} className="mt-2">
                Add another question
              </Button>
            </div>

          </CustomModal>
        )}
      </div>
    </div>
  );
};

export default ITAdminCoursePage;
