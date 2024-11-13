import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, setDoc, getDoc, query, where } from "firebase/firestore";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from 'react-router-dom';
import HRUser from './HRUser';

function HRUserDashboard() {
  const [selectedNav, setSelectedNav] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userId, setUserId] = useState(null);
  const [fullName, setFullName] = useState("User");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState(null);
  const [certificateUrl, setCertificateUrl] = useState(null);
  const navigate = useNavigate();

  const storage = getStorage();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("User is not authenticated. Please log in.");
        return;
      }
      setUserId(currentUser.uid);
      const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
      if (userDoc.exists()) setFullName(userDoc.data().fullName || "User");
      fetchCourses();
      fetchEnrolledCourses(currentUser.uid);
      fetchCompletedCourses(currentUser.uid);
    };
    fetchUserDetails();
  }, []);

  const fetchEnrolledCourses = async (userId) => {
    const enrollmentSnapshot = await getDocs(query(collection(db, "Enrollments"), where("userId", "==", userId)));
    setEnrolledCourses(enrollmentSnapshot.docs.map((doc) => doc.data().courseId));
  };

  const fetchCompletedCourses = async (userId) => {
    const resultsSnapshot = await getDocs(query(collection(db, "QuizResults"), where("userId", "==", userId), where("passed", "==", true)));
    setCompletedCourses(resultsSnapshot.docs.map((doc) => doc.data().courseId));
  };

  const fetchCourses = async () => {
    const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses"));
    const hrCoursesSnapshot = await getDocs(collection(db, "HRCourses"));
    const generalCourses = generalCoursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const hrCourses = hrCoursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCourses([...generalCourses, ...hrCourses]);
  };

  const handleSelectCourse = (course) => {
    if (!enrolledCourses.includes(course.id)) {
      toast.error("You must enroll in the course to view its content.");
      return;
    }
    setSelectedCourse(course);
  };

  const handleEnrollCourse = async (course) => {
    if (course.prerequisites?.some((preReqId) => !completedCourses.includes(preReqId))) {
      toast.error("You need to complete the prerequisite course(s) before accessing this one.");
      return;
    }
    setEnrollingCourse(course);
    setShowEnrollModal(true);
  };

  const confirmEnroll = async () => {
    try {
      await setDoc(doc(db, "Enrollments", `${userId}_${enrollingCourse.id}`), {
        userId, courseId: enrollingCourse.id, courseTitle: enrollingCourse.courseTitle, enrolledDate: new Date(),
      });
      toast.success(`You have been enrolled in ${enrollingCourse.courseTitle}!`);
      setEnrolledCourses([...enrolledCourses, enrollingCourse.id]);
    } catch (error) {
      toast.error("Failed to enroll in the course.");
    }
    setShowEnrollModal(false);
  };

  const generateCertificate = async (fullName, courseTitle) => {
    const doc = new jsPDF();
    doc.setFontSize(22).text("Certificate of Completion", 105, 50, null, null, "center");
    doc.setFontSize(16).text("This certifies that", 105, 70, null, null, "center");
    doc.setFontSize(20).text(fullName, 105, 90, null, null, "center");
    doc.setFontSize(16).text("has successfully completed the course", 105, 110, null, null, "center");
    doc.setFontSize(20).text(courseTitle, 105, 130, null, null, "center");
    doc.setFontSize(14).text(`Date: ${new Date().toLocaleDateString()}`, 105, 150, null, null, "center");
    const pdfBlob = doc.output("blob");
    const storageRef = ref(storage, `certificates/${userId}_${selectedCourse.id}.pdf`);
    await uploadBytes(storageRef, pdfBlob);
    const url = await getDownloadURL(storageRef);
    setCertificateUrl(url);
    toast.success("Certificate uploaded successfully!");
  };

  const handleNavClick = (navItem) => setSelectedNav(navItem);
  const handleLogout = () => navigate('/login');

  return (
    <HRUser
      selectedNav={selectedNav}
      handleNavClick={handleNavClick}
      handleLogout={handleLogout}
      courses={courses}
      handleEnrollCourse={handleEnrollCourse}
      handleSelectCourse={handleSelectCourse}
      showEnrollModal={showEnrollModal}
      confirmEnroll={confirmEnroll}
      setShowEnrollModal={setShowEnrollModal}
      selectedCourse={selectedCourse}
      enrolledCourses={enrolledCourses}
      fullName={fullName}
      userType={"HR"}
    />
  );
}

export default HRUserDashboard;
