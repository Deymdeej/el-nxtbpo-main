import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Ensure the correct import path for Firebase config
import { collection, getDocs } from 'firebase/firestore';
import './css/AdminViewResults.css'; // Custom CSS for styling (optional)

const AdminViewResults = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const resultsSnapshot = await getDocs(collection(db, 'quizResults'));
                const fetchedResults = resultsSnapshot.docs.map(doc => doc.data());
                setResults(fetchedResults);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching quiz results: ", error);
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    if (loading) {
        return <p>Loading quiz results...</p>;
    }

    return (
        <div className="results-container">
            <h2>Quiz Results</h2>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Score</th>
                        <th>Attempts Left</th>
                    </tr>
                </thead>
                <tbody>
                    {results.length > 0 ? (
                        results.map((result, index) => (
                            <tr key={index}>
                                <td>{result.userId}</td>
                                <td>{result.score}</td>
                                <td>{result.attemptsLeft}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3">No results found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AdminViewResults;
