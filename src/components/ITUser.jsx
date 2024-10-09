import React, { useState, useEffect } from 'react';
import { db, auth } from "../firebase"; // Ensure Firebase is properly configured
import { setDoc, doc, getDocs, query, where, collection } from "firebase/firestore"; // Firestore methods
import BPOLOGO from '../assets/bpo-logo.png';
import CoursePick from '../assets/coursepick.png';
import LogoutPick from '../assets/logoutpick.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';
import CertDefault from '../assets/certdefault.png';
import CertPick from '../assets/certpick.png';
import TrainingPick from '../assets/trainingpick.png';
import TrainingDefault from '../assets/trainingdefault.png';
import SortFilter from '../assets/sort.png'; // Import filter icon
import './css/ITUserCourse.css';
import Category_IT from '../assets/Category_IT.png'; // Import the image here
import { toast } from 'react-toastify'; // Toast for notifications

const ITUser = ({
  handleLogout,
  courses,
  fullName,
  userType // Added userType to determine whether the user is HR or IT
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedNav, setSelectedNav] = useState('courses'); // Set default navigation to "courses"
  const [selectedCourse, setSelectedCourse] = useState(null); // For handling selected course
  const [isModalOpen, setIsModalOpen] = useState(false); // For handling modal visibility
  const [showConfirmModal, setShowConfirmModal] = useState(false); // For showing confirm modal
  const [enrolledCourses, setEnrolledCourses] = useState([]); // State for enrolled courses (fetched from Firebase)
  const [myCourses, setMyCourses] = useState([]); // State for enrolled courses (My Courses)

  const userId = auth.currentUser?.uid; // Assuming the user is authenticated, get the user ID

  // Fetch enrolled courses from Firebase when the component mounts
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        if (userId) {
          // Query to get enrolled courses from Firebase for the current user
          const enrollmentQuery = query(collection(db, "Enrollments"), where("userId", "==", userId));
          const enrollmentSnapshot = await getDocs(enrollmentQuery);

          const enrolledCoursesFromFirebase = enrollmentSnapshot.docs.map((doc) => ({
            id: doc.data().courseId,
            courseTitle: doc.data().courseTitle,
            courseDescription: "This is a description fetched from Firebase", // You might want to fetch the full course details separately
            category: "IT" // You can replace with actual category fetched from Firebase
          }));

          setMyCourses(enrolledCoursesFromFirebase); // Update the myCourses state
          setEnrolledCourses(enrolledCoursesFromFirebase.map(course => course.id)); // Update the enrolledCourses state with just the course IDs
        }
      } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        toast.error("Failed to fetch enrolled courses.");
      }
    };

    fetchEnrolledCourses(); // Fetch the user's enrolled courses from Firebase
  }, [userId]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Filter available courses based on the search query, selected filter, and enrollment status
  const filteredAvailableCourses = (courses || []).filter(course =>
    !enrolledCourses.includes(course.id) && // Exclude courses the user is enrolled in
    course.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedFilter === 'All' || course.category === selectedFilter)
  );

  const handleFilterSelect = (category) => {
    setSelectedFilter(category);
    setDropdownOpen(false); // Close dropdown after selection
  };

  const handleNavClick = (navItem) => {
    setSelectedNav(navItem); // Update selectedNav when clicking a nav item
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleConfirmEnroll = () => {
    setShowConfirmModal(true); // Open the confirm modal
  };

  const handleCancelEnroll = () => {
    setShowConfirmModal(false); // Close the confirm modal
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourse || !userId) {
      toast.error("No course selected or user not authenticated");
      return;
    }

    try {
      const enrollmentRef = doc(db, "Enrollments", `${userId}_${selectedCourse.id}`); // Create a unique enrollment document based on user ID and course ID
      await setDoc(enrollmentRef, {
        userId,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.courseTitle,
        enrolledDate: new Date(),
      });
      toast.success(`You have been successfully enrolled in ${selectedCourse.courseTitle}!`);

      // Move the enrolled course to the "My Courses" section
      setMyCourses((prevMyCourses) => [...prevMyCourses, selectedCourse]); // Add to My Courses
      setEnrolledCourses((prevEnrolledCourses) => [...prevEnrolledCourses, selectedCourse.id]); // Update the enrolledCourses state to reflect the new enrollment

      // Optional: Close the modal after enrollment and reset the state
      setIsModalOpen(false);
      setShowConfirmModal(false); // Close confirmation modal
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast.error("Failed to enroll in the course. Please try again.");
    }
  };

  return (
    <div className="IT-user-course-layout">
      <div className="IT-user-course-sidebar">
        <div className="IT-user-course-header">
          <img className="IT-user-course-logo" alt="Group" src={BPOLOGO} />
        </div>
        <nav className="IT-user-course-nav">
          <div
            className={`IT-user-course-nav-item ${selectedNav === 'courses' ? 'active' : ''}`}
            role="button"
            tabIndex="1"
            onClick={() => handleNavClick('courses')}
          >
            <div className="IT-user-course-icon-container">
              <img
                className="IT-user-course-icon2"
                alt="Courses Icon"
                src={selectedNav === 'courses' ? CoursePick : CourseDefault}
              />
            </div>
            Courses
          </div>

          <div
            className={`IT-user-course-nav-item ${selectedNav === 'training' ? 'active' : ''}`}
            role="button"
            tabIndex="2"
            onClick={() => handleNavClick('training')}
          >
            <div className="IT-user-course-icon-container">
              <img
                className="IT-user-course-icon3"
                alt="Training Icon"
                src={selectedNav === 'training' ? TrainingPick : TrainingDefault}
              />
            </div>
            Training
          </div>

          <div
            className={`IT-user-course-nav-item ${selectedNav === 'certificates' ? 'active' : ''}`}
            role="button"
            tabIndex="3"
            onClick={() => handleNavClick('certificates')}
          >
            <div className="IT-user-course-icon-container">
              <img
                className="IT-user-course-icon4"
                alt="Certificates Icon"
                src={selectedNav === 'certificates' ? CertPick : CertDefault}
              />
            </div>
            Certificates
          </div>
        </nav>
        <div
          className={`IT-user-course-nav-logout ${selectedNav === 'logout' ? 'active' : ''}`}
          role="button"
          tabIndex="4"
          onClick={handleLogout}
        >
          <div className="IT-user-course-icon-container">
            <img
              className="IT-user-course-icon4"
              alt="Logout Icon"
              src={selectedNav === 'logout' ? LogoutPick : LogoutDefault}
            />
          </div>
          Logout
        </div>
      </div>
      <div className="IT-user-course-content">
        <h1>Hi, {fullName}</h1>

        {selectedNav === 'courses' && (
          <>
            {/* My Courses Section */}
            <div className="IT-user-course-my-courses-section">
              <h2>My Courses</h2>
              <div className="IT-user-course-course-container">
                {myCourses.length > 0 ? (
                  myCourses.map((course) => (
                    <div className="IT-user-course-course-card" key={course.id}>
                      <h3>{course.courseTitle}</h3>
                      <p className="IT-user-course-course-description">{course.courseDescription}</p>
                      <div className="IT-user-course-category-text">Category</div>
                      <div className="IT-user-course-category-label">{course.category}</div>
                    </div>
                  ))
                ) : (
                  <p>No courses enrolled yet.</p>
                )}
              </div>
            </div>

            {/* Available Courses Section */}
            <div className="IT-user-course-available-section">
              <h2>Available Courses</h2>
              <div className="IT-user-course-course-container">
                {filteredAvailableCourses.length > 0 ? (
                  filteredAvailableCourses.map((course) => (
                    <div className="IT-user-course-course-card" key={course.id} onClick={() => handleCourseClick(course)}>
                      <h3>{course.courseTitle}</h3>
                      <p className="IT-user-course-course-description">{course.courseDescription}</p>
                      <div className="IT-user-course-category-text">Category</div>
                      <div className="IT-user-course-category-label">{course.category}</div>
                    </div>
                  ))
                ) : (
                  <p>No available courses found.</p>
                )}
              </div>
            </div>
          </>
        )}

        {isModalOpen && selectedCourse && (
          <div className="IT-user-course-modal">
            <div className="IT-user-course-modal-content">
              <div className="IT-user-course-modal-header">
                <h2>{selectedCourse.courseTitle}</h2>
                <button className="IT-user-course-close-button" onClick={() => setIsModalOpen(false)}>X</button>
              </div>

              <div className="IT-user-course-modal-body">
                <img src={Category_IT} alt="Course visual" className="IT-user-course-modal-image" />
                <p>{selectedCourse.courseDescription}</p>
                <div className="IT-user-course-course-details">
                  <h4>Prerequisite: <span className="IT-user-course-prerequisite">None</span></h4>
                  <h5>Category: <span className="IT-user-course-category">{selectedCourse.category}</span></h5>
                </div>
              </div>

              <div className="IT-user-course-modal-footer">
                <button className="IT-user-course-enroll-button" onClick={handleConfirmEnroll}>Enroll Course</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Enroll Modal */}
        {showConfirmModal && (
          <div className="IT-user-course-confirm-overlay">
            <div className="IT-user-course-confirm-modal">
              <div className="IT-user-course-modal-header">
                Confirm Enrollment
              </div>

              <div className="IT-user-course-modal-body">
                <p>Are you sure you want to enroll in {selectedCourse?.courseTitle}?</p>
              </div>

              <div className="IT-user-course-modal-footer">
                <button className="IT-user-course-cancel-button" onClick={handleCancelEnroll}>
                  No
                </button>
                <button className="IT-user-course-confirm-button" onClick={handleEnrollCourse}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ITUser;
