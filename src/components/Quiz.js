import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Quiz({ courseId, userId }) {
  const [quiz, setQuiz] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      const docRef = doc(db, "Courses", courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuiz(docSnap.data().quiz);
      }

      const progressRef = doc(db, "UserProgress", userId, "courseProgress", courseId);
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        setAttempts(progressSnap.data().quizAttempts || 0);
      }
    };
    fetchQuiz();
  }, [courseId, userId]);

  const handleSubmitQuiz = async () => {
    let correct = 0;
    quiz.forEach((q, index) => {
      if (answers[index] === q.answer) correct += 1;
    });
    const score = (correct / quiz.length) * 100;
    setScore(score);

    if (attempts >= 1) {
      alert("No more attempts allowed");
      return;
    }

    const progressRef = doc(db, "UserProgress", userId, "courseProgress", courseId);
    await updateDoc(progressRef, {
      quizAttempts: attempts + 1,
      quizScore: score,
    });

    if (score >= 80) {
      navigate(`/certificate/${courseId}`);
    } else {
      alert(`You failed! Your score is ${score}%`);
    }
  };

  return (
    <div>
      <h2>Quiz</h2>
      {quiz.map((q, index) => (
        <div key={index}>
          <p>{q.question}</p>
          {q.options.map((option, i) => (
            <label key={i}>
              <input
                type="radio"
                name={`question-${index}`}
                value={option}
                onChange={() => setAnswers({ ...answers, [index]: option })}
              />
              {option}
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSubmitQuiz}>Submit Quiz</button>
    </div>
  );
}

export default Quiz;
