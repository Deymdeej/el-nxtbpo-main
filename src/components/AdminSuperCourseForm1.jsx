import React, { useEffect, useState, useRef } from "react";
import { db, storage } from "../firebase";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, getDocs, arrayRemove } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject} from "firebase/storage";
import CustomModal from './CustomModal';
import './css/ITAdminCoursePage.css';
import { Button, Modal } from 'react-bootstrap';
import Switch from "react-switch";
import TrainingDefault from '../assets/trainingdefault.png';
import CertDefault from '../assets/certdefault.png';
 

import { auth } from "../firebase";
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import pdfIcon from '../assets/pdf.png';
import trashIcon from '../assets/trash.svg';
import editIcon from '../assets/edit.svg';
import SortIcon from '../assets/filter.svg'
import addIcon from '../assets/add-course.svg'

import CloseIcon from '../assets/closebtn.svg'
 
const ITAdminCoursePage = ({ courses, setCourses, enrollmentCounts, selectedNav}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('course');
  const [isOpen, setIsOpen] = useState(true);
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
  const [quizDuration, setQuizDuration] = useState(""); // Duration in minutes
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showMenu, setShowMenu] = useState(null); // To track the active menu for each file
  const [showMenuIndex, setShowMenuIndex] = useState(null);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRefs = useRef([]);

  
  const handleFilterSelect = (filter) => {
    console.log('Filter selected:', filter);  // Check if this logs the selected filter
    setSelectedFilter(filter);
    setDropdownOpen(false);  // Close dropdown after selecting a filter
  };


  const handleViewFile = (file) => {
    // Make sure file.url is the full URL to the file in Firebase Storage
    if (!file.url) {
      window.alert('PDF URL is not available.');
      return;
    }
  
    // Open the PDF URL directly in a new tab
    window.open(file.url, '_blank');
  };
  
  
  const toggleMenu = (index) => {
    setShowMenu(showMenu === index ? null : index); // Toggle the menu for each file
    setShowMenuIndex(showMenuIndex === index ? null : index);
  };

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
 
  const admintoggleDropdown = () => {
    setDropdownOpen((prevState) => !prevState);  // Toggle dropdown visibility
    console.log('Dropdown open:', !dropdownOpen);  // Debug: check if it's toggling
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
 
  const handleDeleteFile = async (pdfUrl) => {
    // Check if the user is authenticated
    const user = auth.currentUser;
    if (!user) {
      console.error("User is not authenticated");
      window.alert("You need to be logged in to delete a file.");
      return;
    }
  
    const confirmDelete = window.confirm("Are you sure you want to delete this PDF?");
    if (confirmDelete) {
      try {
        const storageRef = ref(storage, pdfUrl);
        await deleteObject(storageRef);
        window.alert("PDF deleted successfully!");
      } catch (error) {
        console.error("Error deleting PDF:", error);
        window.alert("An error occurred while deleting the PDF. Please try again.");
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
  const handleDeleteFileForFirebase = async (pdfUrl, courseId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this PDF?");
    
    if (confirmDelete) {
      try {
        // Step 1: Delete from Firebase Storage
        const storageRef = ref(storage, pdfUrl);
        await deleteObject(storageRef); // Delete the PDF from Firebase Storage

        // Step 2: Update the selectedCourse state to remove the file from pdfURLs
        setSelectedCourse((prevCourse) => {
          // Filter out the deleted PDF from the pdfURLs array
          const updatedPdfURLs = prevCourse.pdfURLs.filter((file) => file.url !== pdfUrl);
          
          // Debugging line to check the updated list
          console.log("Updated PDF URLs (after delete):", updatedPdfURLs);
  
          return {
            ...prevCourse,
            pdfURLs: updatedPdfURLs, // Return the updated state
          };
        });
  
        // Step 3: Update Firestore to remove the deleted PDF URL
        const docRef = doc(db, "courses", courseId);
        await updateDoc(docRef, {
          pdfURLs: arrayRemove({ url: pdfUrl }),  // Remove the specific PDF from Firestore
        });
  
        window.alert("PDF deleted successfully!");
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
  
    // Validate required fields as before
    // ...
  
    try {
      const uploadedFileData = await Promise.all(
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
                resolve({
                  url: downloadURL,
                  name: fileData.name,
                  size: fileData.file.size // in bytes
                });
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
        pdfURLs: uploadedFileData, // Store as objects with url, name, and size
        certificateId: selectedCertificate,
        quizDuration: parseInt(quizDuration, 10),
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
    const matchesCategory = selectedFilter === 'All' || course.category === selectedFilter;
    return matchesCategory && matchesTitle;
  });

   // Close dropdown if clicked outside
   useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRefs.current.every((ref) => ref && !ref.contains(event.target))) {
        setActiveDropdown(null); // Close dropdown if clicked outside of all dropdowns
      }
    };

    // Add event listener to close dropdown if clicked outside
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="admin-super-container">
    <nav className={`sidebar-super ${isOpen ? 'open-super' : 'closed-super'}`}>
      <div className="logo-super">
        <img src={BPOLOGO} alt="Company Logo" />
      </div>
      <ul className="nav-links-super">
        <li>
          <button
            onClick={() => navigate('/admin')}
            className={`nav-button-super ${selectedSection === 'overview' ? 'active-super' : ''}`}
          >
            <img src={UserDefault} alt="Overview" className="nav-icon-super" />
            <span>User List</span>
          </button> 
        </li>
        <li>
          <button
            onClick={() => handleSectionChange('course')}
            className={`nav-button-super ${selectedSection === 'course' ? 'active-super' : ''}`}
          >
            <img src={CourseDefault} alt="Course" className="nav-icon-super" />
            <span>Course</span>
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


        {/* Main content area */}
        <div className="it-admin-main-content">

        {selectedSection === 'course' && (
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
          <button onClick= {admintoggleDropdown} className="filter-button-admin">
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
            <div className="dropdown-menu" ref={(el) => (dropdownRefs.current[course.id] = el)}>
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
                className="dropdown-item delete"
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

  {/* Add Course Button (Always visible) */}
  <div className="course-card-horizontal add-course-card" onClick={handleOpenModal}>
    <div className="add-icon">
      <img src={addIcon} alt="Add" className="add-course-icon" />
    </div>
    <p>Add Course</p>
  </div>
</div>
          </div>
        </div>

)}
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
        <strong1>Description:</strong1> {selectedCourse.courseDescription}
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
      return prereqCourse && prereqCourse.courseTitle ? prereqCourse.courseTitle : 'Unknown';
    }).join(', ')
  : 'None'}

      </p>
      
      {/* Quiz Questions */}
      {selectedCourse.questions?.length > 0 && (
        <div className="quiz-section">
          <h50>Quiz Questions:</h50>
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
      {/* PDF File Display */}
      {selectedCourse.pdfURLs?.length > 0 && (
  <div className="pdf-display-container">
    <h5>PDF Files:</h5>
    {selectedCourse.pdfURLs.map((file, index) => (
      <div key={index} className="pdf-file-card">
        <div className="pdf-file-details">
          <img src={pdfIcon} alt="PDF Icon" className="pdf-icon" />
          <div className="pdf-file-meta">
            <span className="pdf-file-name">{file.name || "Unknown File"}</span>
            <span className="pdf-file-size">
              {file.size ? `${(file.size / 1024).toFixed(2)} KB` : "Size not available"}
            </span>
          </div>
        </div>
         {/* Three-dot icon with menu */}
         <div className="pdf-file-options">
          <img
            src={editIcon}
            alt="Options"
            className="three-dot-icon"
            onClick={() => toggleMenu(index)}
          />
          {showMenuIndex === index && (
            <div className="pdf-options-menu">
              <button className="view-pdf-btn" onClick={() => handleViewFile(file)}>
                View
              </button>
              <button className="delete-pdf-btn" onClick={() => handleDeleteFileForFirebase(file.url, selectedCourse.id)}>
                Delete
              </button>
            </div>
          )}
        </div>
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
      <div className="pdf-display-container">
  <h5>PDF Files:</h5>
  {selectedCourse.pdfURLs.length === 0 ? (
    <p>No PDFs available.</p> // Show this message if the list is empty
  ) : (
    selectedCourse.pdfURLs.map((file, index) => (
      <div key={index} className="pdf-file-card">
        <div className="pdf-file-details">
          <img src={pdfIcon} alt="PDF Icon" className="pdf-icon" />
          <div className="pdf-file-meta">
            <span className="pdf-file-name">{file.name || "Unknown File"}</span>
            <span className="pdf-file-size">
              {file.size ? `${(file.size / 1024).toFixed(2)} KB` : "Size not available"}
            </span>
          </div>
        </div>
        {/* Three-dot icon with menu */}
        <div className="pdf-file-options">
          <img
            src={editIcon}
            alt="Options"
            className="three-dot-icon"
            onClick={() => toggleMenu(index)}
          />
          {showMenuIndex === index && (
            <div className="pdf-options-menu">
              <button className="view-pdf-btn" onClick={() => handleViewFile(file)}>
                View
              </button>
              <button className="delete-pdf-btn" onClick={() => handleDeleteFileForFirebase(file.url, selectedCourse.id)}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    ))
  )}
</div>

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
