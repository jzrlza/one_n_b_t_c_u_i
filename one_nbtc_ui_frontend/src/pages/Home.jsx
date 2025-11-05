import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Home = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employeeId) => {
    console.log('Edit employee:', employeeId);
  };

  const handleDelete = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      console.log('Delete employee:', employeeId);
    }
  };

  const handleAddEmployee = () => {
    console.log('Add new employee');
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="employees-section">
          <div className="section-header">
            <h2>Employees</h2>
            <button onClick={handleAddEmployee} className="add-btn">
              Add Employee
            </button>
          </div>
          
          <button onClick={fetchEmployees} disabled={loading} className="fetch-btn">
            {loading ? 'Loading...' : 'Refresh Employees'}
          </button>
          
          {employees.length > 0 ? (
            <div className="table-container">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Division</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.id}</td>
                      <td>{employee.emp_name}</td>
                      <td>{employee.position_name}</td>
                      <td>{employee.dept_name}</td>
                      <td>{employee.div_name}</td>
                      <td className="actions">
                        <button 
                          onClick={() => handleEdit(employee.id)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(employee.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No employees data available.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;