import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // This ensures the styles for the toast are applied
import { db, auth } from "../firebase"; // Import Firestore and Firebase auth
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"; // Firestore methods
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0); // State for combined total courses
  const [courses, setCourses] = useState([]); // Store fetched courses for preview
  const [users, setUsers] = useState([]); // Store users list for master list
  const navigate = useNavigate();

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses from GeneralCourses collection
        const generalCoursesSnapshot = await getDocs(collection(db, "GeneralCourses"));
        const totalGeneralCourses = generalCoursesSnapshot.size;

        // Fetch courses from ITCourses collection
        const itCoursesSnapshot = await getDocs(collection(db, "ITCourses"));
        const totalITCourses = itCoursesSnapshot.size;

        // Fetch courses from HRCourses collection
        const hrCoursesSnapshot = await getDocs(collection(db, "HRCourses"));
        const totalHRCourses = hrCoursesSnapshot.size;

        // Combine all courses for display in preview
        const combinedCourses = [
          ...generalCoursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ...itCoursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ...hrCoursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        ];
        setCourses(combinedCourses);

        // Calculate and set total courses
        const total = totalGeneralCourses + totalITCourses + totalHRCourses;
        setTotalCourses(total); // Set combined total courses

        // Fetch users from Firestore
        const usersSnapshot = await getDocs(collection(db, "Users"));
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

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  // Render the Admin page
  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
      <h2>Admin Dashboard</h2>

      {/* Total Courses Section */}
      <div>
        <h4>Total Courses Available</h4>
        <p>{totalCourses}</p> {/* Display combined total number of courses */}
      </div>

      {/* Master List of Users */}
      <div>
        <h3>Master List of Users</h3>
        <div style={{ maxHeight: "300px", overflowY: "scroll", border: "1px solid #ddd", padding: "10px" }}>
          {users
            .filter(user => user.department) // Exclude users without a department
            .map((user) => (
              <div key={user.id} style={{ marginBottom: "10px" }}>
                <h5>{user.firstName} {user.lastName}</h5>
                <p>Email: {user.email}</p>
                <p>Department: {user.department || 'Unknown'}</p>
                <p>
                  Role: 
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Course Preview Section */}
      <div>
        <h3>Course Preview</h3>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {courses.length === 0 ? (
            <p>No courses available for preview</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "5px", width: "200px" }}>
                <h4>{course.courseTitle}</h4>
                <p>{course.courseDescription}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
