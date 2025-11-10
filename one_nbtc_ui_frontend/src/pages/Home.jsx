import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { parseExcelToArray } from '../utils/excelParser';

const Home = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '', employeeId: null });
  const [importModal, setImportModal] = useState({ isOpen: false, results: null, mode: 'test' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, excelData: null });
  const navigate = useNavigate();

  // Add useRef at the top with other useState
  const fileInputRef = useRef();

  // Add the handleImportClick function
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
      showModal('error', 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type, message, employeeId = null) => {
    setModal({ isOpen: true, type, message, employeeId });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', message: '', employeeId: null });
  };

  const closeImportModal = () => {
    setImportModal({ isOpen: false, results: null, mode: 'test' });
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
    navigate(`/employee/${employeeId}`);
  };

  const handleDelete = (employeeId) => {
    showModal('confirm', 'Are you sure you want to delete this employee?', employeeId);
  };

  const confirmDelete = async () => {
    if (!modal.employeeId) return;
    
    try {
      await axios.delete(`/api/employees/${modal.employeeId}`);
      fetchEmployees(currentPage, search);
      showModal('success', 'Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      showModal('error', 'Failed to delete employee');
    }
  };

  const handleAddEmployee = () => {
    navigate('/employee');
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showModal('error', 'Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Frontend: Starting Excel import...');
      
      // Parse Excel to array
      const excelData = await parseExcelToArray(file);
      
      // Show confirmation modal instead of alert
      setConfirmModal({
        isOpen: true,
        excelData: excelData
      });
      
    } catch (error) {
      console.error('Frontend: Import error:', error);
      showModal('error', 'Failed to process Excel file: ' + error.message);
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

    // Add function to handle import confirmation
  const handleImportConfirm = async (shouldImport) => {
    setConfirmModal({ isOpen: false, excelData: null });
    
    if (!confirmModal.excelData) return;
    
    setLoading(true);
    
    try {
      let response;
      if (shouldImport) {
        console.log('Frontend: Starting REAL import...');
        response = await axios.post('/api/employees/import', { excelData: confirmModal.excelData });
      } else {
        console.log('Frontend: Starting TEST import...');
        response = await axios.post('/api/employees/test-import', { excelData: confirmModal.excelData });
      }
      
      if (response.data.success) {
        setImportModal({
          isOpen: true,
          results: response.data,
          mode: shouldImport ? 'import' : 'test'
        });
        
        // Refresh employee list if it was a real import
        if (shouldImport && response.data.savedCount > 0) {
          fetchEmployees(currentPage, search);
        }
        
        console.log('Frontend: Operation completed successfully');
      } else {
        showModal('error', `Operation failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Frontend: Import error:', error);
      showModal('error', 'Failed to process Excel file: ' + error.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, []);

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Hidden file input */}
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleImportExcel}
      accept=".xlsx,.xls"
      style={{ display: 'none' }}
    />
      
      <main className="app-main">
        <section className="employees-section">
          <div className="section-header">
            <h2>Employees ({totalEmployees})</h2>
            <button onClick={handleAddEmployee} className="add-btn">
              Add Employee
            </button>
            <button onClick={handleImportClick} disabled={loading} className="import-btn">
              {loading ? 'Processing...' : 'Import Excel'}
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

      {/* Modal for messages */}
      <Modal 
        isOpen={modal.isOpen && ['success', 'error'].includes(modal.type)} 
        onClose={closeModal}
        title={modal.type === 'success' ? 'Success' : 'Error'}
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={closeModal} className="modal-btn primary">OK</button>
        </div>
      </Modal>

      {/* Modal for confirmation */}
      <Modal 
        isOpen={modal.isOpen && modal.type === 'confirm'} 
        onClose={closeModal}
        title="Confirm Delete"
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={confirmDelete} className="modal-btn danger">Delete</button>
          <button onClick={closeModal} className="modal-btn secondary">Cancel</button>
        </div>
      </Modal>

      {/* Confirm Import Modal */}
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, excelData: null })}
        title="Import Confirmation"
      >
        <div className="confirm-import">
          <p><strong>Do you want to IMPORT data to database?</strong></p>
          <div className="import-options">
            <div className="option">
              <h4>✅ Import to Database</h4>
              <p>Save employees to database (cannot be undone)</p>
            </div>
            <div className="option">
              <h4>🔍 Test Only</h4>
              <p>Validate data and show results without saving</p>
            </div>
          </div>
          <div className="modal-actions">
            <button 
              onClick={() => handleImportConfirm(true)} 
              className="modal-btn danger"
            >
              Import to Database
            </button>
            <button 
              onClick={() => handleImportConfirm(false)} 
              className="modal-btn secondary"
            >
              Test Only
            </button>
            <button 
              onClick={() => setConfirmModal({ isOpen: false, excelData: null })} 
              className="modal-btn primary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/*import modal*/}
      <Modal 
        isOpen={importModal.isOpen} 
        onClose={closeImportModal}
        title={importModal.mode === 'import' ? 'Excel Import Results' : 'Excel Test Results'}
      >
        {importModal.results && (
          <div className="import-results">
            <div className="import-summary">
              <p><strong>Total Rows:</strong> {importModal.results.totalRows}</p>
              <p className={importModal.mode === 'import' ? 'success-text' : 'info-text'}>
                <strong>{importModal.mode === 'import' ? 'Successfully Saved:' : 'Valid Rows:'}</strong> {importModal.mode === 'import' ? importModal.results.savedCount : importModal.results.validRows}
              </p>
              <p className="error-text">
                <strong>Errors:</strong> {importModal.mode === 'import' ? importModal.results.errorCount : importModal.results.errorRows}
              </p>
            </div>
            
            {importModal.results.errors && importModal.results.errors.length > 0 && (
              <div className="import-errors">
                <h4>Errors ({importModal.results.errors.length}):</h4>
                <div className="error-list scroll-box">
                  {importModal.results.errors.map((error, index) => (
                    <div key={index} className="error-item">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {importModal.mode === 'import' && importModal.results.saved && importModal.results.saved.length > 0 && (
              <div className="import-success">
                <h4>Successfully Imported ({importModal.results.saved.length}):</h4>
                <div className="success-list scroll-box">
                  {importModal.results.saved.slice(0, 10).map((item, index) => (
                    <div key={index} className="success-item">
                      <strong>Row {item.rowNumber}:</strong> {item.emp_name} - {item.dept_name} - {item.position_name}
                    </div>
                  ))}
                  {importModal.results.saved.length > 10 && (
                    <div className="more-items">
                      ... and {importModal.results.saved.length - 10} more employees
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {importModal.mode === 'test' && importModal.results.data && importModal.results.data.length > 0 && (
              <div className="import-preview">
                <h4>Preview (First 5 rows):</h4>
                <div className="preview-table scroll-box">
                  {importModal.results.data.slice(0, 5).map((item, index) => (
                    <div key={index} className="preview-item">
                      <strong>Row {item.rowNumber}:</strong> {item.emp_name} - {item.dept_name} - {item.position_name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <button onClick={closeImportModal} className="modal-btn primary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;