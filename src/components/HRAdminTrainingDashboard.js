// ITAdminTrainingDashboard.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Include Firebase storage
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify"; // For feedback
import HRAdminTrainingDashboardForm from "./HRAdminTrainingDashboardForm";

function HRAdminTrainingDashboard() {
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [createdBy, setCreatedBy] = useState("");

  useEffect(() => {
    const fetchTrainingSessions = async () => {
      const sessionsSnapshot = await getDocs(collection(db, "TrainingSessions"));

      const sessions = sessionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTrainingSessions(sessions);

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

    fetchTrainingSessions();
  }, []);

  const validateForm = () => {
    if (!sessionTitle.trim()) {
      toast.error("Session Title is required");
      return false;
    }
    if (!sessionDescription.trim()) {
      toast.error("Session Description is required");
      return false;
    }
    if (!trainerName.trim()) {
      toast.error("Trainer's Name is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const docRef = await addDoc(collection(db, "TrainingSessions"), {
        sessionTitle,
        sessionDescription,
        trainerName,
        createdBy,
        createdAt: new Date(),
      });

      const newSession = {
        id: docRef.id,
        sessionTitle,
        sessionDescription,
        trainerName,
        createdBy,
        createdAt: new Date(),
      };

      setTrainingSessions((prevSessions) => [...prevSessions, newSession]);
      setSessionTitle("");
      setSessionDescription("");
      setTrainerName("");

      toast.success("Training session added successfully!");
      setShowModal(false);
    } catch (error) {
      toast.error("Error adding session: " + error.message);
    }
  };

  return (
    <HRAdminTrainingDashboardForm
      showModal={showModal}
      setShowModal={setShowModal}
      trainingSessions={trainingSessions}
      sessionTitle={sessionTitle}
      setSessionTitle={setSessionTitle}
      sessionDescription={sessionDescription}
      setSessionDescription={setSessionDescription}
      trainerName={trainerName}
      setTrainerName={setTrainerName}
      handleSubmit={handleSubmit}
    />
  );
}

export default HRAdminTrainingDashboard;
