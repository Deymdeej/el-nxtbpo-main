import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // This ensures the styles for the toast are applied
import { db, auth } from "../firebase"; // Import Firestore and Firebase auth
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"; // Firestore methods
import { useNavigate } from "react-router-dom";
import AdminForm from "./AdminForm"; // Import the AdminForm component

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0); // State for total courses
  const [totalUsers, setTotalUsers] = useState(0); // State for total users
  const [date, setDate] = useState(new Date()); // State for selected date
  const [courses, setCourses] = useState([]); // Store fetched courses for preview
  const [users, setUsers] = useState([]); // Store users list for master list
  const navigate = useNavigate();

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses from Firestore
        const coursesSnapshot = await getDocs(collection(db, "Courses"));
        setTotalCourses(coursesSnapshot.size); // Set total courses based on snapshot size
        const courseList = coursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCourses(courseList); // Store courses for preview

        // Fetch users from Firestore
        const usersSnapshot = await getDocs(collection(db, "Users"));
        setTotalUsers(usersSnapshot.size); // Set total users based on snapshot size
        const userList = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(userList); // Store users for master list

        setLoading(false); // Stop loading once data is fetched
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Update the user's role in Firestore
      const userRef = doc(db, "Users", userId);
      await updateDoc(userRef, { role: newRole });
      toast.success(`Role updated to ${newRole} for user ${userId}`);

      // Update state to reflect changes
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );
    } catch (error) {
      toast.error("Failed to update role. Please try again.");
      console.error("Error updating role:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const onChange = (date) => setDate(date);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  // Pass props to the presentational component
  return (
    <AdminForm
      handleLogout={handleLogout}
      totalCourses={totalCourses}
      date={date}
      onChange={onChange}
      courses={courses}
      users={users}
      handleRoleChange={handleRoleChange} // Pass role change handler
    />
  );
}

export default AdminPage;
