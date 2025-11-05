import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';

const EmployeeInput = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    emp_name: '',
    position_id: '',
    dept_id: ''
  });
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
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
    fetchDropdownData();
    if (isEditMode) {
      fetchEmployeeData();
    } else {
      setPageLoading(false);
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [posRes, deptRes] = await Promise.all([
        axios.get('/api/employees/positions'),
        axios.get('/api/employees/departments')
      ]);
      setPositions(posRes.data);
      setDepartments(deptRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showModal('error', 'Failed to load dropdown data');
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get(`/api/employees/single/${id}`);
      setFormData({
        emp_name: response.data.emp_name || '',
        position_id: response.data.position_id || '',
        dept_id: response.data.dept_id || ''
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      alert('Failed to load employee data');
      showModal('error', 'Failed to load employee data');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEditMode) {
        await axios.put(`/api/employees/${id}`, formData);
        showModal('success', 'Employee updated successfully');
      } else {
        await axios.post('/api/employees', formData);
        showModal('success', 'Employee created successfully');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      showModal('error', 'Failed to save employee: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleModalClose = () => {
    closeModal();
    if (modal.type === 'success') {
      navigate('/');
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
          <h2>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h2>
          
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-group">
              <label>Employee Name:</label>
              <input
                type="text"
                name="emp_name"
                value={formData.emp_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Position:</label>
              <select
                name="position_id"
                value={formData.position_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Position</option>
                {positions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.position_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department:</label>
              <select
                name="dept_id"
                value={formData.dept_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Saving...' : (isEditMode ? 'Update Employee' : 'Add Employee')}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/')}
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

export default EmployeeInput;