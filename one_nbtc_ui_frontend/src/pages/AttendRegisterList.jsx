import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { getEnumValue } from '../utils/enum_config';
import { formatDateTime } from '../utils/datetime_display_config';
import { exportToExcel } from '../utils/excelExport';

const AttendRegisterList = ({ user, onLogout }) => {
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegisters, setTotalRegisters] = useState(0);
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '', registerId: null });
  const navigate = useNavigate();

  const fetchRegisters = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 10
      });
      
      const response = await axios.get(`/api/registers?${params}`);
      setRegisters(response.data.registers || []);
      setTotalPages(response.data.totalPages);
      setTotalRegisters(response.data.total);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error('Error fetching registers:', error);
      setRegisters([]);
      showModal('error', 'Failed to fetch registers');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type, message, registerId = null) => {
    setModal({ isOpen: true, type, message, registerId });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', message: '', registerId: null });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchRegisters(newPage);
  };

  const handleEdit = (registerId) => {
    navigate(`/attendance/edit/${registerId}`);
  };

  const handleAddRegister = () => {
    navigate('/attendance/edit');
  };

  const handleDelete = (registerId) => {
    showModal('confirm', 'Are you sure you want to delete this registration?', registerId);
  };

  const confirmDelete = async () => {
    if (!modal.registerId) return;
    
    try {
      await axios.delete(`/api/registers/${modal.registerId}`);
      fetchRegisters(currentPage);
      showModal('success', 'Registration deleted successfully');
    } catch (error) {
      console.error('Error deleting register:', error);
      showModal('error', 'Failed to delete registration');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get('/api/registers/export-data');
      
      if (response.data.success) {
        exportToExcel(response.data.registers, response.data.unregisteredEmployees);
        showModal('success', 'Excel file exported successfully!');
      } else {
        showModal('error', 'Failed to export data: ' + response.data.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      showModal('error', 'Failed to export Excel file: ' + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisters(1);
  }, []);

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="registers-section">
          <div className="section-header">
            <h2>Attendance Registrations ({totalRegisters})</h2>
            <button onClick={() => fetchRegisters(currentPage)} disabled={loading} className="refresh-btn">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
            <button onClick={handleAddRegister} className="add-btn">
              Add Registration
            </button>
            <button 
                onClick={handleExportExcel} 
                disabled={exportLoading || totalRegisters === 0}
                className="export-btn"
              >
                {exportLoading ? 'Exporting...' : 'Export Excel'}
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
          
          {registers.length > 0 ? (
            <>
              <div className="table-container horizontal-scroll">
                <table className="registers-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employee Name</th>
                      <th>Phone Number</th>
                      <th>Attendance</th>
                      <th>Van Service</th>
                      <th>Van Round</th>
                      <th>Food Preference</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registers.map((register) => (
                      <tr key={register.id}>
                        <td>{register.id}</td>
                        <td>{register.emp_name}</td>
                        <td>{register.phone_number}</td>
                        <td>{getEnumValue('is_attend', register.is_attend)}</td>
                        <td>{getEnumValue('take_van_id', register.take_van_id)}</td>
                        <td>{getEnumValue('van_round_id', register.van_round_id)}</td>
                        <td>{getEnumValue('take_food', register.take_food)}</td>
                        <td>{formatDateTime(register.sys_datetime)}</td>
                        <td className="actions">
                          <button 
                            onClick={() => handleEdit(register.id)}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(register.id)}
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
            <p>No registrations found.</p>
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
    </div>
  );
};

export default AttendRegisterList;