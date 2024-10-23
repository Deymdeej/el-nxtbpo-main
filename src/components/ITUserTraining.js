// Imports Section
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Firebase configuration
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify"; // Notification library
import ITUserTrainingForm from "./ITUserTrainingForm"; // Form component import

// Main Functional Component
function ITUserTrainingDashboard() {
  // State Declarations
  const [trainings, setTrainings] = useState([]); // Store training data
  const [trainingTitle, setTrainingTitle] = useState(""); // Store training title input
  const [trainingDescription, setTrainingDescription] = useState(""); // Store training description input
  const [schedule, setSchedule] = useState(""); // Store training schedule input
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [createdBy, setCreatedBy] = useState(""); // Store created by information

  // useEffect Hook to Fetch Data
  useEffect(() => {
    // Async Function to Fetch Trainings and User Info
    const fetchTrainings = async () => {
      // Fetch all trainings from Firestore
      const trainingsSnapshot = await getDocs(collection(db, "Trainings"));
      const trainings = trainingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrainings(trainings);

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
    fetchTrainings();
  }, []); // Dependency array is empty to run only once

  // Form Validation Function
  const validateForm = () => {
    if (!trainingTitle.trim()) {
      toast.error("Training Title is required");
      return false;
    }
    if (!trainingDescription.trim()) {
      toast.error("Training Description is required");
      return false;
    }
    if (!schedule.trim()) {
      toast.error("Training Schedule is required");
      return false;
    }
    return true;
  };

  // Handle Submit Function to Add New Training
  const handleSubmit = async () => {
    // Validate the form before submission
    if (!validateForm()) return;

    try {
      // Add new training to Firestore
      const docRef = await addDoc(collection(db, "Trainings"), {
        trainingTitle,
        trainingDescription,
        schedule,
        createdBy,
        createdAt: new Date(),
      });

      // Create new training object and update state
      const newTraining = {
        id: docRef.id,
        trainingTitle,
        trainingDescription,
        schedule,
        createdBy,
        createdAt: new Date(),
      };
      setTrainings((prevTrainings) => [...prevTrainings, newTraining]);

      // Reset form fields
      setTrainingTitle("");
      setTrainingDescription("");
      setSchedule("");

      // Provide success feedback
      toast.success("Training added successfully!");
      setShowModal(false); // Close modal after successful addition
    } catch (error) {
      // Provide error feedback
      toast.error("Error adding training: " + error.message);
    }
  };

  // Render the Form Component
  return (
    <ITUserTrainingForm
      showModal={showModal}
      setShowModal={setShowModal}
      trainings={trainings}
      trainingTitle={trainingTitle}
      setTrainingTitle={setTrainingTitle}
      trainingDescription={trainingDescription}
      setTrainingDescription={setTrainingDescription}
      schedule={schedule}
      setSchedule={setSchedule}
      handleSubmit={handleSubmit}
    />
  );
}

// Export the Component
export default ITUserTrainingDashboard;
