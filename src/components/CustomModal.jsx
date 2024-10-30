import React from 'react';
import './css/CustomModal.css'; // Updated CSS file with unique class names
import CloseIcon from '../assets/closebtn.svg'

function CustomModal({ isModalOpen, handleClose, handleSubmit, title, children }) {
  if (!isModalOpen) return null;

  return (
    <div className="itadminmodal-overlay">
      <div className="itadminmodal-container">
        <div className="itadminmodal-header">
          <h5>{title}</h5>
          <button className="itadminmodal-close-btn" onClick={handleClose}> 
          <img src={CloseIcon} alt="Close" />
          </button>
        </div>
        <div className="itadminmodal-body">
          {children}
        </div>
        <div className="itadminmodal-footer">
          <button onClick={handleSubmit} className="itadminmodal-btn itadminmodal-btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}

export default CustomModal;
