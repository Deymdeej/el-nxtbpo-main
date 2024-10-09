import React from 'react';
import './css/ITAdminCoursePage.css' // Ensure you have a Modal.css file for custom styles

function CustomModal({ isModalOpen, handleClose, handleSubmit, title, children }) {
  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h4>{title}</h4>
          <button onClick={handleClose} className="close-button">X</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button onClick={handleClose} className="btn btn-secondary">Close</button>
          <button onClick={handleSubmit} className="btn btn-primary">Submit</button>
        </div>
      </div>
    </div>
  );
}

export default CustomModal;
