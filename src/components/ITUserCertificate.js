// Imports Section
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Firebase configuration
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify"; // Notification library
import ITUserCertificateForm from "./ITUserCertificateForm"; // Form component import

// Main Functional Component
function ITUserCertificate() {
  // State Declarations
  const [certificates, setCertificates] = useState([]); // Store certificate data
  const [certificateTitle, setCertificateTitle] = useState(""); // Store certificate title input
  const [certificateDescription, setCertificateDescription] = useState(""); // Store certificate description input
  const [issueDate, setIssueDate] = useState(""); // Store certificate issue date input
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [issuedBy, setIssuedBy] = useState(""); // Store issued by information

  // useEffect Hook to Fetch Data
  useEffect(() => {
    // Async Function to Fetch Certificates and User Info
    const fetchCertificates = async () => {
      // Fetch all certificates from Firestore
      const certificatesSnapshot = await getDocs(collection(db, "Certificates"));
      const certificates = certificatesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCertificates(certificates);

      // Fetch current user information
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, "Users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIssuedBy(userData.fullName || "Unknown User");
        } else {
          setIssuedBy("Unknown User");
        }
      }
    };

    // Call the Fetch Function
    fetchCertificates();
  }, []); // Dependency array is empty to run only once

  // Form Validation Function
  const validateForm = () => {
    if (!certificateTitle.trim()) {
      toast.error("Certificate Title is required");
      return false;
    }
    if (!certificateDescription.trim()) {
      toast.error("Certificate Description is required");
      return false;
    }
    if (!issueDate.trim()) {
      toast.error("Issue Date is required");
      return false;
    }
    return true;
  };

  // Handle Submit Function to Add New Certificate
  const handleSubmit = async () => {
    // Validate the form before submission
    if (!validateForm()) return;

    try {
      // Add new certificate to Firestore
      const docRef = await addDoc(collection(db, "Certificates"), {
        certificateTitle,
        certificateDescription,
        issueDate,
        issuedBy,
        issuedAt: new Date(),
      });

      // Create new certificate object and update state
      const newCertificate = {
        id: docRef.id,
        certificateTitle,
        certificateDescription,
        issueDate,
        issuedBy,
        issuedAt: new Date(),
      };
      setCertificates((prevCertificates) => [...prevCertificates, newCertificate]);

      // Reset form fields
      setCertificateTitle("");
      setCertificateDescription("");
      setIssueDate("");

      // Provide success feedback
      toast.success("Certificate added successfully!");
      setShowModal(false); // Close modal after successful addition
    } catch (error) {
      // Provide error feedback
      toast.error("Error adding certificate: " + error.message);
    }
  };

  // Render the Form Component
  return (
    <ITUserCertificateForm
      showModal={showModal}
      setShowModal={setShowModal}
      certificates={certificates}
      certificateTitle={certificateTitle}
      setCertificateTitle={setCertificateTitle}
      certificateDescription={certificateDescription}
      setCertificateDescription={setCertificateDescription}
      issueDate={issueDate}
      setIssueDate={setIssueDate}
      handleSubmit={handleSubmit}
    />
  );
}

// Export the Component
export default ITUserCertificate;
