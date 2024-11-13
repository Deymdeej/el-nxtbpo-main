import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase"; // Include Firebase storage
import { collection, addDoc, getDocs, doc, getDoc, query, where } from "firebase/firestore"; // Firestore methods
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage methods
import { toast } from "react-toastify"; // For feedback
import ITAdminCoursePage from "./AdminSuperCourseForm1"; // Import the form

function ITAdminCoursePage1() {
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]); // State for certificates
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [disableVideoLink, setDisableVideoLink] = useState(false);
  const [prerequisites, setPrerequisites] = useState([]);
  const [questions, setQuestions] = useState([{ question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
  const [firstCourseId, setFirstCourseId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCourseDetailsModal, setShowCourseDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [section, setSection] = useState("general");
  const [createdBy, setCreatedBy] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    const fetchCoursesAndEnrollments = async () => {
      const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses"));
      const itCoursesSnapshot = await getDocs(collection(db, "ITCourses"));

      const generalCourses = generalCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(), // Include all course data including category
      }));

      const itCourses = itCoursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(), // Include all course data including category
      }));

      const allCourses = [...generalCourses, ...itCourses];
      setCourses(allCourses);

      // Fetching enrollment counts
      const enrollmentCounts = {};
      for (let course of allCourses) {
        const enrollmentsSnapshot = await getDocs(query(collection(db, "Enrollments"), where("courseId", "==", course.id)));
        enrollmentCounts[course.id] = enrollmentsSnapshot.size;
      }
      setEnrollmentCounts(enrollmentCounts);

      if (generalCourses.length > 0) {
        setFirstCourseId(generalCourses[0].id);
      }

      // Fetching user information
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, "Users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCreatedBy(userData.fullName || "Unknown User");
        } else {
          setCreatedBy("Unknown User");
        }
      }
    };

    const fetchCertificates = async () => {
      const certificatesSnapshot = await getDocs(collection(db, "Certificates"));
      const fetchedCertificates = certificatesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCertificates(fetchedCertificates);
    };

    fetchCoursesAndEnrollments();
    fetchCertificates(); // Call the function to fetch certificates
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
  };

  const handleChangeQuestion = (index, event) => {
    const { name, value } = event.target;
    const newQuestions = [...questions];
    newQuestions[index][name] = value;
    setQuestions(newQuestions);
  };

  const handleChangeChoice = (qIndex, cIndex, event) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices[cIndex] = event.target.value;
    setQuestions(newQuestions);
  };

  const handlePrerequisiteChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setPrerequisites(selectedOptions);
  };

  const handlePdfChange = (e) => {
    if (e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const uploadPdfToStorage = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file to upload.");
      return null;
    }

    const storageRef = ref(storage, `course-pdfs/${pdfFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, pdfFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {},
        (error) => {
          toast.error("Error uploading PDF: " + error.message);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          toast.success("PDF uploaded successfully!");
          resolve(downloadUrl);
        }
      );
    });
  };

  const validateForm = () => {
    if (!courseTitle.trim()) {
      toast.error("Course Title is required");
      return false;
    }
    if (!courseDescription.trim()) {
      toast.error("Course Description is required");
      return false;
    }
    if (questions.some((q) => !q.question.trim())) {
      toast.error("All questions must have a question text");
      return false;
    }
    if (questions.some((q) => q.choices.some((c) => !c.trim()))) {
      toast.error("All choices must be filled for each question");
      return false;
    }
    if (questions.some((q) => !q.correctAnswer.trim())) {
      toast.error("Each question must have a correct answer");
      return false;
    }
    if (questions.some((q) => !q.choices.includes(q.correctAnswer))) {
      toast.error("Correct answer must be one of the choices for each question");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const pdfDownloadUrl = await uploadPdfToStorage();

      const coursePrerequisites =
        prerequisites.length === 0 && firstCourseId
          ? [firstCourseId]
          : prerequisites.length > 0
          ? prerequisites
          : [];

      const collectionPath = section === "general" ? "GeneralCourses" : "ITCourses";

      const docRef = await addDoc(collection(db, collectionPath), {
        courseTitle,
        courseDescription,
        videoLink: disableVideoLink ? "" : videoLink,
        questions,
        prerequisites: coursePrerequisites.length > 0 ? coursePrerequisites : [],
        createdBy,
        createdAt: new Date(),
        pdfUrl: pdfDownloadUrl || "",
        category: section === "general" ? "General" : "IT", // Adding category
      });

      const newCourse = {
        id: docRef.id,
        courseTitle,
        courseDescription,
        videoLink: disableVideoLink ? "" : videoLink,
        questions,
        prerequisites: coursePrerequisites,
        createdBy,
        createdAt: new Date(),
        pdfUrl: pdfDownloadUrl || "",
        category: section === "general" ? "General" : "IT", // Adding category
      };

      setCourses((prevCourses) => [...prevCourses, newCourse]);
      setCourseTitle("");
      setCourseDescription("");
      setVideoLink("");
      setQuestions([{ question: "", choices: ["", "", "", ""], correctAnswer: "" }]);
      setPrerequisites([]);
      setDisableVideoLink(false);
      setPdfFile(null);

      toast.success("Course added successfully!");
      setShowModal(false);
    } catch (error) {
      toast.error("Error adding course: " + error.message);
    }
  };

  return (
    <ITAdminCoursePage
      showModal={showModal}
      setShowModal={setShowModal}
      showCourseDetailsModal={showCourseDetailsModal}
      setShowCourseDetailsModal={setShowCourseDetailsModal}
      selectedCourse={selectedCourse}
      setSelectedCourse={setSelectedCourse}
      handleSubmit={handleSubmit}
      courses={courses}
      enrollmentCounts={enrollmentCounts}
      courseTitle={courseTitle}
      setCourseTitle={setCourseTitle}
      courseDescription={courseDescription}
      setCourseDescription={setCourseDescription}
      videoLink={videoLink}
      setVideoLink={setVideoLink}
      disableVideoLink={disableVideoLink}
      setDisableVideoLink={setDisableVideoLink}
      prerequisites={prerequisites}
      setPrerequisites={setPrerequisites}
      questions={questions}
      setQuestions={setQuestions}
      handleAddQuestion={handleAddQuestion}
      handleChangeQuestion={handleChangeQuestion}
      handleChangeChoice={handleChangeChoice}
      handlePrerequisiteChange={handlePrerequisiteChange}
      pdfFile={pdfFile}
      handlePdfChange={handlePdfChange}
      setCourses={setCourses}
      certificates={certificates} // Pass certificates to the ITAdminCoursePage
    />
  );
}

export default ITAdminCoursePage1;
