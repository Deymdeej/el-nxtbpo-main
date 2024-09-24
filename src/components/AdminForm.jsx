import React from 'react';

function AdminForm({ handleLogout, totalCourses, date, onChange, courses, users, handleRoleChange }) {
  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', backgroundColor: '#d9534f', color: '#fff', border: 'none', borderRadius: '5px' }}>
          Logout
        </button>
      </div>

      <h2>Admin Dashboard</h2>

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={{ flex: 1, padding: "20px", border: "1px solid #ddd", borderRadius: "5px" }}>
          <h4>Total Courses</h4>
          <p>{totalCourses}</p> {/* Display total number of courses */}
        </div>
      </div>

      {/* Master List of Users Section */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Master List of Users</h3>
        <div style={{ maxHeight: "300px", overflowY: "scroll", border: "1px solid #ddd", padding: "10px" }}>
          {users.length === 0 ? (
            <p>No users available</p>
          ) : (
            users.map((user) => (
              <div key={user.id} style={{ marginBottom: "10px" }}>
                <h5>{user.fullName || "Unknown"} </h5>
                <p>Email: {user.email}</p>
                
                <label htmlFor={`role-select-${user.id}`}>Role: </label>
                <select
                  id={`role-select-${user.id}`}
                  value={user.role || "user"} // Default to "user" if no role
                  onChange={(e) => handleRoleChange(user.id, e.target.value)} // Handle role change
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Course Preview Section */}
      <div style={{ marginBottom: "30px" }}>
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

export default AdminForm;
