import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavbarAdmin from '../components/NavbarAdmin';
import Modal from '../components/Modal';
import { getEnumValue } from '../utils/enum_config';
import { formatDateTime } from '../utils/datetime_display_config';
import { exportToExcel } from '../utils/excelExport';

const AttendRegisterList = ({ user, onLogout }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegisters, setTotalRegisters] = useState(0);
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '', registerId: null });
  const navigate = useNavigate();

  const fetchRegisters = async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 10
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await axios.get(`${API_URL}/api/registers?${params}`);
      setRegisters(response.data.registers || []);
      setTotalPages(response.data.totalPages);
      setTotalRegisters(response.data.total);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error('Error fetching registers:', error);
      setRegisters([]);
      showModal('error', 'ไม่สามารถดึงข้อมูลการลงทะเบียนได้');
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

  const handleSearch = (search) => {
    setSearch(search);
    setCurrentPage(1);
    fetchRegisters(1, search);
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
    showModal('confirm', 'คุณแน่ใจหรือไม่ที่จะลบการลงทะเบียนนี้?', registerId);
  };

  const confirmDelete = async () => {
    if (!modal.registerId) return;
    
    try {
      await axios.delete(`${API_URL}/api/registers/${modal.registerId}`, {
        headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Send token like a password
        }
      });
      fetchRegisters(currentPage);
      showModal('success', 'ลบการลงทะเบียนเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error deleting register:', error);
      showModal('error', 'ไม่สามารถลบการลงทะเบียนได้');
      if (error.response?.status == 403) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/registers/export-data`, {
        headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Send token like a password
        }
      });
      
      if (response.data.success) {
        exportToExcel(response.data.registers, response.data.unregisteredEmployees);
        showModal('success', 'ส่งออกไฟล์ Excel สำเร็จ!');
      } else {
        showModal('error', 'ไม่สามารถส่งออกข้อมูลได้: ' + response.data.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      showModal('error', 'ไม่สามารถส่งออกไฟล์ Excel ได้: ' + error.message);
      if (error.response?.status == 403) {
        handleLogout();
      }
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisters(1);
  }, []);

  return (
    <div className="app">
      <NavbarAdmin user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="registers-section">
          <div className="section-header">
            <h2 className="section-header--header">การลงทะเบียน ({totalRegisters})</h2>
            <div className="section-header--btn-group">
            <button onClick={() => fetchRegisters(currentPage)} disabled={loading} className="refresh-btn">
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
            <button onClick={handleAddRegister} className="add-btn">
              เพิ่มการลงทะเบียน
            </button>
            <button 
                onClick={handleExportExcel} 
                disabled={exportLoading || totalRegisters === 0}
                className="export-btn"
              >
                {exportLoading ? 'กำลังส่งออก...' : 'ส่งออก Excel'}
              </button>
              </div>
          </div>
          
          <div className="filters-container">
              <div className="filters-row">
                <form onSubmit={handleSearch} className="search-form">
                  <input
                    type="text"
                    placeholder="ค้นหาการลงทะเบียนด้วย ชื่อ-นามสกุล ของผู้ลงทะเบียน..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                  />
                  
                </form>
              </div>
              
              <div className="active-filters">
                {(search) && (
                  <div className="filters-info">
                    <span className="filter-label">ตัวกรองที่ใช้งานอยู่: </span>
                    {search && (
                      <span className="filter-tag">
                        ค้นหาชื่อ: {search}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

          {registers.length > 0 ? <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || currentPage === 0}
                  className="page-btn"
                >
                  {"<"}
                </button>
                
                <span className="page-info">
                  หน้า {currentPage}/{totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  {">"}
                </button>
              </div> : ""}
          
          {registers.length > 0 ? (
            <>
              <div className="table-container horizontal-scroll">
                <table className="registers-table">
                  <thead>
                    <tr>
                      <th>รหัส</th>
                      <th className="name-in-table">ชื่อ-นามสกุล</th>
                      <th>เบอร์โต๊ะ</th>
                      <th>วันที่ลงทะเบียน</th>
                      <th>การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registers.map((register) => (
                      <tr key={register.id}>
                        <td>{register.id}</td>
                        <td className="name-in-table">{register.emp_name}</td>
                        <td>{register.table_number}</td>
                        <td>{formatDateTime(register.sys_datetime)}</td>
                        <td className="actions">
                          <button 
                            onClick={() => handleEdit(register.id)}
                            className="edit-btn"
                          >
                            แก้ไข
                          </button>
                          <button 
                            onClick={() => handleDelete(register.id)}
                            className="delete-btn"
                          >
                            ลบ
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
                  disabled={currentPage === 1 || currentPage === 0}
                  className="page-btn"
                >
                  {"<"}
                </button>
                
                <span className="page-info">
                  หน้า {currentPage}/{totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  {">"}
                </button>
              </div>
            </>
          ) : (
            <p>ไม่พบการลงทะเบียน</p>
          )}
        </section>
      </main>

      {/* Modal for messages */}
      <Modal 
        isOpen={modal.isOpen && ['success', 'error'].includes(modal.type)} 
        onClose={closeModal}
        title={modal.type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={closeModal} className="modal-btn primary">ตกลง</button>
        </div>
      </Modal>

      {/* Modal for confirmation */}
      <Modal 
        isOpen={modal.isOpen && modal.type === 'confirm'} 
        onClose={closeModal}
        title="ยืนยันการลบ"
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={confirmDelete} className="modal-btn danger">ลบ</button>
          <button onClick={closeModal} className="modal-btn secondary">ยกเลิก</button>
        </div>
      </Modal>
    </div>
  );
};

export default AttendRegisterList;