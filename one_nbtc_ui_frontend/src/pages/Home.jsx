import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { parseExcelToArray } from '../utils/excelParser';
import loadImage from '../res/loading.gif';

const Home = ({ user, onLogout }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '', employeeId: null });
  const [importModal, setImportModal] = useState({ isOpen: false, results: null, mode: 'test' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, excelData: null });
  const [excelLoadModal, setExcelLoadModal] = useState({ isOpen: false });
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
      
      const response = await axios.get(`${API_URL}/api/employees?${params}`);
      setEmployees(response.data.employees || []);
      setTotalPages(response.data.totalPages);
      setTotalEmployees(response.data.total);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
      showModal('error', 'ไม่สามารถดึงข้อมูลพนักงานได้');
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
    showModal('confirm', 'คุณแน่ใจหรือไม่ที่จะลบพนักงานคนนี้?', employeeId);
  };

  const confirmDelete = async () => {
    if (!modal.employeeId) return;
    
    try {
      await axios.delete(`${API_URL}/api/employees/${modal.employeeId}`);
      fetchEmployees(currentPage, search);
      showModal('success', 'ลบพนักงานเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error deleting employee:', error);
      showModal('error', 'ไม่สามารถลบพนักงานได้');
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
      showModal('error', 'กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)');
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
      showModal('error', 'ไม่สามารถประมวลผลไฟล์ Excel ได้: ' + error.message);
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
    setExcelLoadModal({ isOpen: true });
    
    try {
      let response;
      if (shouldImport) {
        console.log('Frontend: Starting REAL import...');
        response = await axios.post(`${API_URL}/api/employees/import`, { excelData: confirmModal.excelData });
      } else {
        console.log('Frontend: Starting TEST import...');
        response = await axios.post(`${API_URL}/api/employees/test-import`, { excelData: confirmModal.excelData });
      }
      
      if (response.data.success) {
        setExcelLoadModal({ isOpen: false });
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
        showModal('error', `การดำเนินการล้มเหลว: ${response.data.error}`);
      }
    } catch (error) {
      setExcelLoadModal({ isOpen: false });
      console.error('Frontend: Import error:', error);
      showModal('error', 'ไม่สามารถประมวลผลไฟล์ Excel ได้: ' + error.message);
    } finally {
      setExcelLoadModal({ isOpen: false });
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
            <h2>พนักงาน ({totalEmployees})</h2>
            <button onClick={handleAddEmployee} className="add-btn">
              เพิ่มพนักงาน
            </button>
            <button onClick={handleImportClick} disabled={loading} className="import-btn">
              {loading ? 'กำลังประมวลผล...' : 'นำเข้า Excel'}
            </button>
          </div>
          
          <div className="controls">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="ค้นหาพนักงานด้วยชื่อ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button type="submit" disabled={loading} className="search-btn">
                ค้นหา
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
                ล้าง
              </button>
            </form>
            
            <button onClick={() => fetchEmployees(currentPage, search)} disabled={loading} className="refresh-btn">
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          </div>

          <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  ก่อนหน้า
                </button>
                
                <span className="page-info">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  ถัดไป
                </button>
              </div>
          
          {employees.length > 0 ? (
            <>
              <div className="table-container">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>รหัส</th>
                      <th>ชื่อ-นามสกุล</th>
                      <th>ตำแหน่ง</th>
                      <th>สำนัก</th>
                      <th>สายงาน</th>
                      <th>การดำเนินการ</th>
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
                            แก้ไข
                          </button>
                          <button 
                            onClick={() => handleDelete(employee.id)}
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
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  ก่อนหน้า
                </button>
                
                <span className="page-info">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  ถัดไป
                </button>
              </div>
            </>
          ) : (
            <p>ไม่พบพนักงาน</p>
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

      {/* Modal for import loading */}
      <Modal 
        isOpen={excelLoadModal.isOpen} 
        title={'Loading...'}
      >
      <h1><img src={loadImage} 
            alt={
              `กำลังโหลด`
            } style={{
              width: '40px',
              height: '40px',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
            /></h1>
        <p>กำลังประมวลผล...</p>
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

      {/* Confirm Import Modal */}
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, excelData: null })}
        title="ยืนยันการนำเข้า"
      >
        <div className="confirm-import">
          <p><strong>คุณต้องการนำเข้าข้อมูลไปยังฐานข้อมูลหรือไม่?</strong></p>
          <div className="import-options">
            <div className="option">
              <h4>✅ นำเข้าสู่ฐานข้อมูล</h4>
              <p>บันทึกพนักงานลงฐานข้อมูล (ไม่สามารถย้อนกลับได้)</p>
            </div>
            <div className="option">
              <h4>🔍 ทดสอบเท่านั้น</h4>
              <p>ตรวจสอบความถูกต้องของข้อมูลและแสดงผลลัพธ์โดยไม่บันทึก</p>
            </div>
          </div>
          <div className="modal-actions">
            <button 
              onClick={() => handleImportConfirm(true)} 
              className="modal-btn danger"
            >
              นำเข้าสู่ฐานข้อมูล
            </button>
            <button 
              onClick={() => handleImportConfirm(false)} 
              className="modal-btn secondary"
            >
              ทดสอบเท่านั้น
            </button>
            <button 
              onClick={() => setConfirmModal({ isOpen: false, excelData: null })} 
              className="modal-btn primary"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </Modal>

      {/*import modal*/}
      <Modal 
        isOpen={importModal.isOpen} 
        onClose={closeImportModal}
        title={importModal.mode === 'import' ? 'ผลการนำเข้า Excel' : 'ผลการทดสอบ Excel'}
      >
        {importModal.results && (
          <div className="import-results">
            <div className="import-summary">
              <p><strong>จำนวนแถวทั้งหมด:</strong> {importModal.results.totalRows}</p>
              <p className={importModal.mode === 'import' ? 'success-text' : 'info-text'}>
                <strong>{importModal.mode === 'import' ? 'เพิ่มสำเร็จ:' : 'แถวที่น่าเพิ่ม:'}</strong> {importModal.mode === 'import' ? importModal.results.createdCount : importModal.results.createdCount}
              </p>
              <p className={importModal.mode === 'import' ? 'success-text' : 'info-text'}>
                <strong>{importModal.mode === 'import' ? 'แก้ไขสำเร็จ:' : 'แถวที่น่าแก้ไข:'}</strong> {importModal.mode === 'import' ? importModal.results.updatedCount : importModal.results.updatedCount}
              </p>
              <p className="error-text">
                <strong>ไม่มีการเปลี่ยนแปลง:</strong> {importModal.mode === 'import' ? importModal.results.unchangedCount : importModal.results.unchangedCount}
              </p>
              <p className="error-text">
                <strong>ข้อผิดพลาด:</strong> {importModal.mode === 'import' ? importModal.results.errorCount : importModal.results.errorCount}
              </p>
            </div>
            
            {importModal.results.errors && importModal.results.errors.length > 0 && (
              <div className="import-errors">
                <h4>ข้อผิดพลาด ({importModal.results.errors.length}):</h4>
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
                <h4>นำเข้าสำเร็จ ({importModal.results.saved.length + importModal.results.updated.length}):</h4>
                <div className="success-list scroll-box">
                  {importModal.results.saved.slice(0, 10).map((item, index) => (
                    <div key={index} className="success-item">
                      <strong>แถวที่ {item.rowNumber}:</strong> {item.emp_name} - {item.dept_name} - {item.position_name}
                    </div>
                  ))}
                  {importModal.results.saved.length > 10 && (
                    <div className="more-items">
                      ... และอีก {importModal.results.saved.length - 10} พนักงาน
                    </div>
                  )}

                  {importModal.results.updated.slice(0, 10).map((item, index) => (
                    <div key={index} className="success-item">
                      <strong>แถวที่ {item.rowNumber}:</strong> {item.emp_name} - {item.dept_name} - {item.position_name}
                    </div>
                  ))}
                  {importModal.results.updated.length > 10 && (
                    <div className="more-items">
                      ... และอีก {importModal.results.updated.length - 10} พนักงาน
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {importModal.mode === 'test' && importModal.results.data && importModal.results.data.length > 0 && (
              <div className="import-preview">
                <h4>ตัวอย่าง (5 แถวแรก):</h4>
                <div className="preview-table scroll-box">
                  {importModal.results.data.slice(0, 5).map((item, index) => (
                    <div key={index} className="preview-item">
                      <strong>แถวที่ {item.rowNumber}:</strong> {item.emp_name} - {item.dept_name} - {item.position_name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <button onClick={closeImportModal} className="modal-btn primary">
                ปิด
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;