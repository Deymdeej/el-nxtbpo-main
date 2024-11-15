import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/AdminFormSuper.css';
import BPOLOGO from '../assets/bpo-logo.png';
import UserDefault from '../assets/userdefault.png';
import CourseDefault from '../assets/coursedefault.png';
import LogoutDefault from '../assets/logoutdefault.png';

function AdminForm() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState('userlist');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'Users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleResize = () => {
    if (window.innerWidth > 768) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/login'));
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (updatedUser) => {
    try {
      const userRef = doc(db, 'Users', updatedUser.id);
      await updateDoc(userRef, {
        fullName: updatedUser.fullName,
        department: updatedUser.department,
        role: updatedUser.role,
      });
      console.log('User updated:', updatedUser);
      
      // Display success toast notification
      toast.success('Changes saved successfully!');
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating user: ', error);
      toast.error('Failed to save changes.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'Users', userId));
        console.log(`User with ID: ${userId} has been deleted`);


        toast.success(`Deleted successfully!`);
      } catch (error) {
        console.error('Error deleting user: ', error);
      }
    }
  };

  return (
    <div className="admin-super-container">
      
      <nav className={`sidebar-super ${isOpen ? 'open-super' : ''}`}>
        <div className="logo-super">
          <img src={BPOLOGO} alt="Company Logo" />
        </div>
        <ul className="nav-links-super">
          <li>
            <button
              onClick={() => handleSectionChange('userlist')}
              className={`nav-button-super ${selectedSection === 'userlist' ? 'active-super' : ''}`}
            >
              <img src={UserDefault} alt="User Icon" className="nav-icon-super" />
              <span>User List</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/adminSuperCourse')}
              className={`nav-button-super ${selectedSection === 'courses' ? 'active-super' : ''}`}
            >
              <img src={CourseDefault} alt="Courses Icon" className="nav-icon-super" />
              <span>Courses</span>
            </button>
          </li>
        </ul>
        <div className="logout-super">
          <button className="nav-button-super" onClick={handleLogout}>
            <img src={LogoutDefault} alt="Logout Icon" className="nav-icon-super" />
            Logout
          </button>
        </div>
      </nav>

      <button className="hamburger-super" onClick={toggleSidebar}>
        ☰
      </button>

      <div className="content-super">
        <h1 style={{ fontSize: '22px', marginLeft: '25px' }}>
          <strong><span style={{ color: '#48887B' }}>Hello</span></strong>, <em>head admin</em>!
        </h1>

        {selectedSection === 'userlist' && (
          <div id="userlist" className="user-list-super-section">
            <h2>USER LIST</h2>
            <table className="user-super-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users
                    .filter((user) => user.fullName !== 'head admin')
                    .map((user) => (
                      <tr key={user.id}>
                        <td>{user.fullName}</td>
                        <td>{user.department}</td>
                        <td>{user.role}</td>
                        <td>
                          <button onClick={() => handleEditUser(user)} className="icon-button-super">
                            ✎
                          </button>
                          <button2
                            onClick={() => handleDeleteUser(user.id)}
                            className="icon-button-super delete-icon-super"
                          >
                            🗑
                          </button2>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="4">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="modal-super-overlay">
            <div className="modal-super">
              <h2>Edit User</h2>
              <div className="modal-super-body">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                />
                <label>Department</label>
                <select
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                >
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                </select>
                <label>Role</label>
                <div className="role-selection">
                  <span>
                    <input
                      type="radio"
                      id="admin"
                      value="Admin"
                      checked={editingUser.role === 'admin'}
                      onChange={() => setEditingUser({ ...editingUser, role: 'admin' })}
                    />
                    <label htmlFor="admin">Admin</label>
                  </span>
                  <span>
                    <input
                      type="radio"
                      id="user"
                      value="User"
                      checked={editingUser.role === 'user'}
                      onChange={() => setEditingUser({ ...editingUser, role: 'user' })}
                    />
                    <label htmlFor="user">User</label>
                  </span>
                </div>
              </div>
              <div className="modal-super-footer">
                <button className="modal-super-button remove" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="modal-super-button save"
                  onClick={() => handleSaveUser(editingUser)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminForm;
