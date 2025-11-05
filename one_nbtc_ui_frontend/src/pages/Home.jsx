import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Home = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const navigate = useNavigate();

  const fetchEmployees = async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 20
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await axios.get(`/api/employees?${params}`);
      setEmployees(response.data.employees || []);
      setTotalPages(response.data.totalPages);
      setTotalEmployees(response.data.total);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEmployees(1, search);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchEmployees(newPage, search);
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
    fetchEmployees(1);
  }, []);

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="employees-section">
          <div className="section-header">
            <h2>Employees ({totalEmployees})</h2>
            <button onClick={handleAddEmployee} className="add-btn">
              Add Employee
            </button>
          </div>
          
          <div className="controls">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search employees by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button type="submit" disabled={loading} className="search-btn">
                Search
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                  fetchEmployees(1);
                }}
                className="clear-btn"
              >
                Clear
              </button>
            </form>
            
            <button onClick={() => fetchEmployees(currentPage, search)} disabled={loading} className="refresh-btn">
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {employees.length > 0 ? (
            <>
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
              
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  Previous
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p>No employees found.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;