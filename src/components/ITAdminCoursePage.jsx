import React, { useEffect, useState } from "react";
import { db, storage } from "../firebase";
import { getAuth, signOut } from "firebase/auth";
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
import editIcon from '../assets/edit.svg';
import SortIcon from '../assets/filter.svg'
import addIcon from '../assets/add-course.svg'
import CloseIcon from '../assets/closebtn.svg'


 
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
  const [prerequisite, setPrerequisite] = useState(""); // State for the prerequisite course

 
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(''); // Certificate
  const [questionErrors, setQuestionErrors] = useState([]);
  const auth = getAuth();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setDropdownOpen(false); // Close the dropdown after selecting a filter
  };

  const [quizDuration, setQuizDuration] = useState(""); // Duration in minutes


  const [activeDropdown, setActiveDropdown] = useState(null);

const toggleDropdown = (courseId) => {
  if (activeDropdown === courseId) {
    setActiveDropdown(null); // Close the dropdown if it's already open
  } else {
    setActiveDropdown(courseId); // Open the dropdown for the selected course
  }
};

  

 
  const handleToggleVideoLink = () => {
    setIsVideoLinkEnabled(!isVideoLinkEnabled);
  };
 
  const navigate = useNavigate();


  const [dropdownOpen, setDropdownOpen] = useState(false);

const admintoggleDropdown = () => {
  setDropdownOpen(!dropdownOpen);
};
 
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
 
  const handleOpenModal = (isNewCourse = true) => {
    setCourseTitle('');
    setCourseDescription('');
    setCategory('');
    setVideoLink('');
    setPrerequisites([]);
    setQuestions([{ question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
    setUploadedFiles([]);
    setIsVideoLinkEnabled(false);
    setErrors({});
  
    setSelectedCertificate('');
    
    if (isNewCourse) {
      // Reset duration only for a new course
      setQuizDuration("");
    }
  
    setIsModalOpen(true);
  };
  ;
 
 
 
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
 
 
  const handleDeleteFile = (fileName) => {
    // Ask for confirmation before deleting the PDF
    const confirmDelete = window.confirm("Are you sure you want to delete this PDF?");
 
    if (confirmDelete) {
      try {
        // Update the uploadedFiles state to remove the deleted file
        setUploadedFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
        window.alert("PDF deleted from the page successfully!");
      } catch (error) {
        console.error("Error deleting PDF from the page:", error);
        window.alert("An error occurred while deleting the PDF from the page. Please try again.");
      }
    }
  };
  const confirmDelete = (courseId) => {
    console.log("Attempting to delete course with ID:", courseId); // Debugging line
    if (window.confirm("Are you sure you want to delete this course?")) {
      deleteCourse(courseId);
    }
  };
  const deleteCourse = async (courseId) => {
    try {
      const course = courses.find(c => c.id === courseId); // Find the course by ID
      if (!course) throw new Error("Course not found");
   
      const collectionName = course.category === "General" ? "GeneralCourses" : "ITCourses";
      const docRef = doc(db, collectionName, courseId); // Ensure correct collection
      await deleteDoc(docRef); // Deleting from Firestore
   
      // Update state to remove the course from the list
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
   
      window.alert("Course deleted successfully!");
    } catch (error) {
      console.error("Error deleting course:", error);
      window.alert("Failed to delete course. Please try again.");
    }
  };
  const handleDeleteFileforFirebase = async (pdfUrl) => {
    // Ask for confirmation before deleting the PDF
    const confirmDelete = window.confirm("Are you sure you want to delete this PDF?");
   
    if (confirmDelete) {
      try {
        // Create a reference to the file in Firebase Storage
        const storageRef = ref(storage, pdfUrl);
   
        // Delete the file from Firebase Storage
        await deleteObject(storageRef);
        window.alert("PDF deleted successfully!");
 
        // First, update your local state to remove the PDF URL
        setSelectedCourse((prevCourse) => {
          const updatedPdfURLs = prevCourse.pdfURLs.filter((url) => url !== pdfUrl);
         
          return {
            ...prevCourse,
            pdfURLs: updatedPdfURLs
          };
        });
 
        // Determine the collection based on the course category
        const collectionName = selectedCourse.category === "General" ? "GeneralCourses" : "ITCourses";
        const docRef = doc(db, collectionName, selectedCourse.id);
 
        // Update Firestore document to remove the PDF URL from the course
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
    let validationErrors = {};
  
    // Validate if at least one PDF is uploaded
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one PDF file.");
      setErrors({ pdfFile: "Please upload at least one PDF file." });
      return;
    }
  
    // Validate required fields
    if (!courseTitle) validationErrors.courseTitle = "Course Title is required.";
    if (!courseDescription) validationErrors.courseDescription = "Course Description is required.";
    if (!category) validationErrors.category = "Category is required.";
    if (!selectedCertificate) validationErrors.selectedCertificate = "Certificate is required.";
    if (!quizDuration || isNaN(quizDuration) || quizDuration <= 0) {
      validationErrors.quizDuration = "Valid quiz duration (in minutes) is required.";
    }
  
    // Display validation errors if any
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      alert("Please fill out all required fields.");
      return;
    }
  
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
        quizDuration: parseInt(quizDuration, 10), // Store quizDuration as an integer in minutes
        createdAt: new Date(),
      });
  
      alert("Course added successfully!");
      handleCloseModal();
    } catch (error) {
      console.error("Error uploading files or adding course:", error);
      alert("Error uploading files or adding course. Please try again.");
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
        prerequisites: prerequisite ? [prerequisite] : [], // Store as an array
        quizDuration: parseInt(quizDuration, 10),
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
      <div className="admin-sidebar">
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
      <div className="it-admin-main-content">
  <div className="row">
    <div className="col-md-12">
      <h10>All Courses</h10>

      {/* Search Bar and Filter By Category */}
      <div className="itadmin-search-filter-container">
  <div className="itadmin-search-bar-wrapper">
    <input 
      type="text" 
      placeholder="Search course title" 
      value={searchQuery} 
      onChange={(e) => setSearchQuery(e.target.value)}
      className="itadmin-search-bar"
    />
      </div>
      <div className="filter-wrapper">
          <button onClick={admintoggleDropdown} className="filter-button-admin">
          <span className="filter-label">Filter by: {selectedFilter}</span>
          <img src={SortIcon} alt="Sort/Filter Icon" className="filter-icon-2" />
          </button>

          {dropdownOpen && (
          <div className="dropdown-content">
          <div onClick={() => handleFilterSelect('All')}>All</div>
          <div onClick={() => handleFilterSelect('General')}>General</div>
          <div onClick={() => handleFilterSelect('IT')}>IT</div>
        </div>
        )}
    </div>
    </div>
      {/* Courses Grid */}
      <div className="course-grid-horizontal">
  {filteredCourses.length === 0 ? (
    <p1>No courses available</p1>
  ) : (
    <>
      {filteredCourses.map((course) => (
        <div
          key={course.id}
          className="course-card-horizontal"
          onClick={() => openCourseModal(course)}
          style={{ cursor: "pointer" }}
        >
          <div className="course-card-header">
            <h5 className="course-title-admin">{course.courseTitle}</h5>
            <div className="dropdown-container">
              <img
                src={editIcon}
                alt="More options"
                className="dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown(course.id);
                }}
              />
              {activeDropdown === course.id && (
                <div className="dropdown-menu">
                  <div
                    className="dropdown-item edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(course);
                    }}
                  >
                    Edit
                  </div>
                  <div
                  ITAdminCoursePage className="dropdown-item delete"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents the dropdown from closing immediately
                    confirmDelete(course.id); // Calls the delete function with the course id
                  }}
                >
                  Delete
                </div>
                </div>
              )}
            </div>
          </div>
          <p className="course-description-admin">{course.courseDescription}</p>

          <div className="category-tag-wrapper">
            <span className="category-tag">{course.category}</span>
          </div>

          <div className="course-footer">
            <p className="enrolled-users">
              Enrolled Users: {enrollmentCounts[course.id] || 0}
            </p>
          </div>
        </div>
      ))}
    </>
  )}

  {/* Add Course Button (Only when courses are available) */}
  {filteredCourses.length > 0 && (
    <div className="course-card-horizontal add-course-card" onClick={handleOpenModal}>
      <div className="add-icon">
        <img src={addIcon} alt="Add" className="add-course-icon" />
      </div>
      <p>Add Course</p>
    </div>
  )}
</div>
          </div>
        </div>
         {/* Modal for Course Details */}
          {selectedCourse && (
        <Modal show={showCourseModal} onHide={closeCourseModal}>
        <div className="modal-header-admin">
        <h7 className="course-title-header-admin">{selectedCourse.courseTitle}</h7>
        <button className="close-button-admin" onClick={closeCourseModal}>
        <img src={CloseIcon} alt="Close" />
        </button>
      </div>

    <Modal.Body className="modal-body-course">
      {/* Description */}
      <p className="description-text">
        <strong>Description:</strong> {selectedCourse.courseDescription}
      </p>
      {/* Category */}
      <p>
        <strong>Category:</strong> {selectedCourse.category}
      </p>
      {/* Prerequisites */}
      <p>
      {selectedCourse.quizDuration && (
        <p>
          <strong>Quiz Duration:</strong> {selectedCourse.quizDuration} minutes
        </p>
      )}
        <strong>Prerequisites:</strong>{' '}
        {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0
          ? selectedCourse.prerequisites.map((prereqId) => {
              const prereqCourse = courses.find((course) => course.id === prereqId);
              return prereqCourse ? prereqCourse.courseTitle : 'Unknown';
            }).join(', ')
          : 'None'}
      </p>


      
      {/* Quiz Questions */}
      {selectedCourse.questions?.length > 0 && (
        <div className="quiz-section">
          <h5>Quiz Questions:</h5>
          {selectedCourse.questions.map((question, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <h6 className="quiz-question">Question {index + 1}: {question.question}</h6>
              <div className="choices">
                {question.choices.map((choice, choiceIndex) => (
                  <div key={choiceIndex} className="choice-item">
                    <strong>{String.fromCharCode(65 + choiceIndex)}:</strong> {choice}
                  </div>
                ))}
              </div>
              <p className="correct-answer"><strong>Correct Answer:</strong> {question.correctAnswer}</p>
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
      {/* Video Link */}
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
      {/* Certificate Display */}
      {selectedCourse.certificateFileUrl && (
        <div style={{ marginTop: '20px' }}>
          <h5>Certificate:</h5>
          <p><strong>Title:</strong> {selectedCourse.certificateTitle || "No title available"}</p>
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
            <img
              src={selectedCourse.certificateFileUrl}
              alt="Certificate Image"
              style={{ width: "90%", height: "auto", border: "1px solid #ddd", borderRadius: "8px" }}
            />
          )}
        </div>
      )}
    </Modal.Body>

  </Modal>
)}

       {/* Modal for Editing Course */}
{selectedCourse && (
  <Modal show={showEditModal} onHide={closeEditModal}>
    {/* Modal Header */}
    <div className="modal-header-admin">
    <h13 className="course-edit-header-admin">Edit Course</h13>
      <button className="close-button-admin" onClick={closeEditModal}>
        <img src={CloseIcon} alt="Close"/>
        </button>
    </div>  

    <Modal.Body>  
      {/* Course Form */}
      <div className="it-admin-form-group">
        <label>Course Title</label>
        <input
          type="text"
          value={courseTitle}
          onChange={(e) => setCourseTitle(e.target.value)}
          placeholder="Enter course title"
          className="form-control"
        />
      </div>

      <div className="it-admin-form-group">
        <label>Course Description</label>
        <textarea
          value={courseDescription}
          onChange={(e) => setCourseDescription(e.target.value)}
          placeholder="Enter course description"
          className="form-control"
        />
      </div>

      <div className="it-admin-form-group">
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
        
  <div className="it-admin-form-group">
    <label>Prerequisite Course</label>
    <select
      value={prerequisite}
      onChange={(e) => setPrerequisite(e.target.value)}
      className="form-control"
    >
      <option value="">None</option>
      {courses.map((course) => (
        <option key={course.id} value={course.id}>
          {course.courseTitle}
        </option>
      ))}
    </select>
  </div>

      {/* Video Link Section for Editing */}
      <div className="it-admin-form-group">
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
      <div className="it-admin-form-group">
        <h4>Upload Files</h4>
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
            Select files....
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
      <div className="it-admin-form-group">
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
      <div className="it-admin-form-group">
    <label>Quiz Duration (in minutes)</label>
    <input
      type="number"
      value={quizDuration}
      onChange={(e) => setQuizDuration(e.target.value)}
      placeholder="Enter quiz duration in minutes"
      className="form-control"
    />
  </div>
 


      {/* Edit Quiz Questions */}
      <div className="it-admin-form-group">
        <h4>Edit Quiz Questions</h4>
        {selectedCourse.questions.map((question, index) => (
          <div key={index}>
            <label>Question {index + 1}:</label>
            <input
              type="text"
              name="question"
              value={question.question}
              onChange={(e) => handleChangeQuestion(index, e)}
              placeholder="Enter question"
              className="form-control mb-2"
            />

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

    <Modal.Footer className="custom-modal-footer">
  <Button className="update-course update-course-primary" onClick={handleUpdateCourse}>Update</Button>
  
</Modal.Footer>
  </Modal>
)}
        {/* Modal for Adding New Course */}
        {isModalOpen && (
          <CustomModal isModalOpen={isModalOpen} handleClose={handleCloseModal} handleSubmit={handleSubmit} title="Add New Course">
            <div className="it-admin-form-group">
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
              <div className="it-admin-form-group">
              <label>Course Title</label>
                <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Enter course title"
              className={`form-control ${errors.courseTitle ? 'is-invalid' : ''}`}
                     />
              </div>

              <div className="it-admin-form-group">
                  <label>Course Description</label>
                  <textarea
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                placeholder="Enter course description"
                className={`form-control ${errors.courseDescription ? 'is-invalid' : ''}`}
                />
                </div>

            {/* Certificate Dropdown */}
            <div className="it-admin-form-group">
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
  <h4>Upload Files</h4>
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
      Drop files here to upload, or click here to browse
    </label>
  </div>
  

  {/* Uploaded files table structure */}
  <div className="uploaded-files-section">
    <h4>Files ready to upload</h4>
    <table className="files-table">
      <thead>
        <tr>
          <th>File name</th>
          <th>File size</th> {/* New column for file size */}
          <th></th> {/* Empty column for delete icon */}
        </tr>
      </thead>
      <tbody>
        {uploadedFiles.map((file, index) => (
          <tr key={index} className="file-row">
            <td>{file.name}</td>
            <td>{(file.size / 1024).toFixed(2)} KB</td> {/* Display file size in KB */}
            <td>
              <button className="delete-file-pdf" onClick={() => handleDeleteFile(file.name)}>
                <img src={trashIcon} alt="Delete" className="delete-icon" />
              </button>
            </td>
          </tr>
          

          
        ))}
      </tbody>
    </table>
  </div>
</div>

            {/* Video Link Input */}
            <div>
            <div className="it-admin-form-group-switch">
            <div className="switch-container">
                        <input
                        type="checkbox"
                        id="toggle-switch"
                        className="switch-input"
                          checked={isVideoLinkEnabled}
                        onChange={handleToggleVideoLink}
                          />
                        <label htmlFor="toggle-switch" className="switch-label">
                        <span className="switch-button"></span>
                        </label>
                        <span className="switch-text">Add Video Link</span>
                        </div>
            </div>
              {isVideoLinkEnabled && (
                <div className="it-admin-form-group">
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

            <div className="it-admin-form-group">
              <label22>Prerequisite Course</label22>
              <select
                value={prerequisites.length > 0 ? prerequisites[0] : ""}
                onChange={(e) => setPrerequisites(e.target.value ? [e.target.value] : [])}
                className="form-control-prerequisite"
              >
                <option value="">Choose your course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseTitle}
                  </option>
                ))}
              </select>
            </div>
            <div className="it-admin-form-group">
  <label>Quiz Duration (in minutes)</label>
  <input
    type="number"
    value={quizDuration}
    onChange={(e) => setQuizDuration(e.target.value)}
    placeholder="Enter duration in minutes"
    className={`form-control ${errors.quizDuration ? 'is-invalid' : ''}`}
  />
</div>


            <div className="quiz-section">
            <h4>Add Quiz Questions</h4>
            {questions.map((question, index) => (
            <div key={index} className="quiz-question">
            <div className="question-number">Question {index + 1}</div>
            <input
          type="text"
          name="question"
          value={question.question}
          onChange={(e) => handleChangeQuestion(index, e)}
          placeholder="Enter question"
          className="form-control-addquestions"
                  />
                  <h5>Choices</h5>
        <div className="choices">
          {question.choices.map((choice, cIndex) => (
            <div key={cIndex} className="choice">
              <label>{String.fromCharCode(65 + cIndex)}.</label>
              <input
                type="text"
                value={choice}
                onChange={(e) => handleChangeChoice(index, cIndex, e)}
                placeholder={`Choice ${cIndex + 1}`}
                className="form-control-choices"
              />
            </div>
                    ))}

                   </div>
                   
                   <label24>Correct Answer</label24>
<select
  name="correctAnswer"
  value={question.correctAnswer || ''} // Ensure it defaults to an empty value if no answer is selected
  onChange={(e) => handleCorrectAnswerChange(index, e)}
  className="form-control-correctanswers"
>
  <option value="" disabled>Select Correct Answer</option> {/* Blank option */}
  <option value="A">A</option>
  <option value="B">B</option>
  <option value="C">C</option>
  <option value="D">D</option>
</select>
</div>
))}
    <Button variant="secondary" onClick={handleAddQuestion} className="addquestion-button">
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
