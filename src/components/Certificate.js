import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

function Certificate({ courseId, userId }) {
  const [certificateUrl, setCertificateUrl] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      const docRef = doc(db, "Certificates", `${userId}_${courseId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCertificateUrl(docSnap.data().certificateUrl);
      }
    };
    fetchCertificate();
  }, [courseId, userId]);

  return (
    <div>
      <h2>Congratulations! You passed the quiz.</h2>
      {certificateUrl ? (
        <img src={certificateUrl} alt="Certificate" />
      ) : (
        <p>Loading your certificate...</p>
      )}
    </div>
  );
}

export default Certificate;
