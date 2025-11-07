import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { registerEnums } from '../utils/enum_config';

const AttendeeInput = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    emp_name: '',
    emp_id: '',
    phone_number: '',
    is_attend: '1',
    take_van_id: '1',
    van_round_id: '1',
    take_food: '1'
  });
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '' });

  const showModal = (type, message) => {
    setModal({ isOpen: true, type, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', message: '' });
  };

  useEffect(() => {
    if (isEditMode) {
      fetchRegisterData();
    } else {
      setPageLoading(false);
    }
  }, [id]);

  const fetchRegisterData = async () => {
    try {
      const response = await axios.get(`/api/registers/single/${id}`);
      const register = response.data;
      
      setFormData({
        emp_name: register.emp_name || '',
        emp_id: register.emp_id || '',
        phone_number: register.phone_number || '',
        is_attend: register.is_attend?.toString() || '1',
        take_van_id: register.take_van_id?.toString() || '1',
        van_round_id: register.van_round_id?.toString() || '1',
        take_food: register.take_food?.toString() || '1'
      });
    } catch (error) {
      console.error('Error fetching register:', error);
      showModal('error', 'Failed to load registration data');
    } finally {
      setPageLoading(false);
    }
  };

  const searchEmployees = async (searchTerm) => {
    if (!searchTerm) {
      setEmployeeSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      const response = await axios.get(`/api/registers/employees/search?search=${encodeURIComponent(searchTerm)}`);
      setEmployeeSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching employees:', error);
    }
  };

  const handleEmployeeSearch = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      emp_name: value,
      emp_id: '' // Clear emp_id when user types new name
    }));
    
    // Debounce search
    clearTimeout(handleEmployeeSearch.timeout);
    handleEmployeeSearch.timeout = setTimeout(() => {
      searchEmployees(value);
    }, 300);
  };

  const selectEmployee = (employee) => {
    setFormData(prev => ({
      ...prev,
      emp_name: employee.emp_name,
      emp_id: employee.id
    }));
    setShowSuggestions(false);
    setEmployeeSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate employee selection
    if (!formData.emp_id) {
      showModal('error', 'Please select an employee from the suggestions');
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        emp_id: formData.emp_id,
        phone_number: formData.phone_number,
        is_attend: parseInt(formData.is_attend),
        take_van_id: parseInt(formData.take_van_id),
        van_round_id: parseInt(formData.van_round_id),
        take_food: parseInt(formData.take_food)
      };
      
      if (isEditMode) {
        await axios.put(`/api/registers/${id}`, submitData);
        showModal('success', 'Registration updated successfully');
      } else {
        await axios.post('/api/registers', submitData);
        showModal('success', 'Registration created successfully');
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      showModal('error', 'Failed to save registration: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleModalClose = () => {
    closeModal();
    if (modal.type === 'success') {
      navigate('/attendance');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (pageLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="form-section">
          <h2>{isEditMode ? 'Edit Registration' : 'Add New Registration'}</h2>
          
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-group">
              <label>Employee Name:</label>
              <div className="search-container">
                <input
                  type="text"
                  name="emp_name"
                  value={formData.emp_name}
                  onChange={handleEmployeeSearch}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => formData.emp_name && setShowSuggestions(true)}
                  placeholder="Type to search employees..."
                  required
                />
                {showSuggestions && employeeSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {employeeSuggestions.map(employee => (
                      <div
                        key={employee.id}
                        className="suggestion-item"
                        onClick={() => selectEmployee(employee)}
                      >
                        {employee.emp_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.emp_id && (
                <small className="form-hint">Employee selected: ID {formData.emp_id}</small>
              )}
            </div>

            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>Attendance:</label>
              <select
                name="is_attend"
                value={formData.is_attend}
                onChange={handleChange}
                required
              >
                {Object.entries(registerEnums.is_attend).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Van Service:</label>
              <select
                name="take_van_id"
                value={formData.take_van_id}
                onChange={handleChange}
                required
              >
                {Object.entries(registerEnums.take_van_id).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Van Round:</label>
              <select
                name="van_round_id"
                value={formData.van_round_id}
                onChange={handleChange}
                required
              >
                {Object.entries(registerEnums.van_round_id).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Food Preference:</label>
              <select
                name="take_food"
                value={formData.take_food}
                onChange={handleChange}
                required
              >
                {Object.entries(registerEnums.take_food).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Saving...' : (isEditMode ? 'Update Registration' : 'Add Registration')}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/attendance')}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={handleModalClose}
        title={modal.type === 'success' ? 'Success' : 'Error'}
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={handleModalClose} className="modal-btn primary">OK</button>
        </div>
      </Modal>
    </div>
  );
};

export default AttendeeInput;