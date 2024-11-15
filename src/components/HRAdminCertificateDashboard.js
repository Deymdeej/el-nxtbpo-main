// Imports Section
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Firebase configuration
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify"; // Notification library
import ITAdminCertificateForm from "./ITAdminCertificateForm"; // Form component import

// Main Functional Component
function HRAdminCertificateDashboard() {
  // State Declarations
  const [certificates, setCertificates] = useState([]); // Store certificates data
  const [certificateTitle, setCertificateTitle] = useState(""); // Store certificate title input
  const [certificateDescription, setCertificateDescription] = useState(""); // Store certificate description input
  const [issuerName, setIssuerName] = useState(""); // Store issuer name input
  const [showModal, setShowModal] = useState(false); // State to control the modal visibility
  const [createdBy, setCreatedBy] = useState(""); // Store created by information

  // useEffect Hook to Fetch Data
  useEffect(() => {
    // Async Function to Fetch Certificates and User Info
    const fetchCertificates = async () => {
      // Fetch all certificates from Firestore
      const certificatesSnapshot = await getDocs(collection(db, "HRCertificates"));
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
          setCreatedBy(userData.fullName || "Unknown User");
        } else {
          setCreatedBy("Unknown User");
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
    if (!issuerName.trim()) {
      toast.error("Issuer's Name is required");
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
      const docRef = await addDoc(collection(db, "HRCertificates"), {
        certificateTitle,
        certificateDescription,
        issuerName,
        createdBy,
        createdAt: new Date(),
      });

      // Create new certificate object and update state
      const newCertificate = {
        id: docRef.id,
        certificateTitle,
        certificateDescription,
        issuerName,
        createdBy,
        createdAt: new Date(),
      };
      setCertificates((prevCertificates) => [...prevCertificates, newCertificate]);

      // Reset form fields
      setCertificateTitle("");
      setCertificateDescription("");
      setIssuerName("");

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
    <ITAdminCertificateForm
      showModal={showModal}
      setShowModal={setShowModal}
      certificates={certificates}
      certificateTitle={certificateTitle}
      setCertificateTitle={setCertificateTitle}
      certificateDescription={certificateDescription}
      setCertificateDescription={setCertificateDescription}
      issuerName={issuerName}
      setIssuerName={setIssuerName}
      handleSubmit={handleSubmit}
    />
  );
}

// Export the Component
export default HRAdminCertificateDashboard;
