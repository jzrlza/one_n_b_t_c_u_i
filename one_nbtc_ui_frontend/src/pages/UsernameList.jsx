import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavbarAdmin from '../components/NavbarAdmin';
import Modal from '../components/Modal';
import { getEnumValue } from '../utils/enum_config';

const UsernameList = ({ user, onLogout }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '', userId: null });
  const navigate = useNavigate();

  const fetchUsers = async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 10
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await axios.get(`${API_URL}/api/users?${params}`);
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages);
      setTotalUsers(response.data.total);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      showModal('error', 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type, message, userId = null) => {
    setModal({ isOpen: true, type, message, userId });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', message: '', userId: null });
  };

  const handleSearch = (search) => {
    setSearch(search);
    setCurrentPage(1);
    fetchUsers(1, search);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchUsers(newPage, search);
  };

  const handleEdit = (userId) => {
    navigate(`/username/edit/${userId}`);
  };

  const handleAddUser = () => {
    navigate('/username/edit');
  };

  const handleDelete = (userId) => {
    showModal('confirm', parseInt(userId) === parseInt(user?.id) ? '*** คุณแน่ใจหรือไม่ที่จะลบตัวเอง!? ***' : 'คุณแน่ใจหรือไม่ที่จะลบผู้ใข้งานนี้?', userId);
  };

  const handle2FADelete = (userId) => {
    showModal('confirm-2fa', 'คุณแน่ใจหรือไม่ที่จะลบ 2FA ของผู้ใช้งานนี้?', userId);
  }

  const confirmDelete = async () => {
    if (!modal.userId) return;

    if (modal.type === "confirm-2fa") {
      try {
        await axios.delete(`${API_URL}/api/users/2fa/${modal.userId}`, {
          headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Send token like a password
          }
        });
        fetchUsers(currentPage);
        showModal('success', 'ลบ 2FA ของผู้ใข้งานแล้ว');
      } catch (error) {
        console.error('Error deleting user:', error);
        showModal('error', 'ไม่สามารถ 2FA ของผู้ใข้งานได้');
        if (error.response?.status == 403) {
          handleLogout();
        }
      }
    }
    else {
      try {
        const response = await axios.delete(`${API_URL}/api/users/${modal.userId}`, {
          headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Send token like a password
          }
        });
        if (response.self_delete) {
          handleLogout();
        } else {
          fetchUsers(currentPage);
          showModal('success', 'ลบผู้ใข้งานแล้ว');
        }
        
      } catch (error) {
        console.error('Error deleting user:', error);
        showModal('error', 'ไม่สามารถผู้ใข้งานได้');
        if (error.response?.status == 403) {
          handleLogout();
        }
      }
    }
    
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  useEffect(() => {
    fetchUsers(1, '');
  }, []);

  return (
    <div className="app">
      <NavbarAdmin user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="registers-section">
          <div className="section-header">
            <h2 className="section-header--header">ผู้ใช้งาน ({totalUsers})</h2>
            <div className="section-header--btn-group">
            <button onClick={() => fetchUsers(currentPage)} disabled={loading} className="refresh-btn">
                    {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                  </button>
            <button onClick={handleAddUser} className="add-btn">
              เพิ่มผู้ใข้งาน
            </button>
            </div>
          </div>
          
          <div className="filters-container">
              <div className="filters-row">
                <form onSubmit={handleSearch} className="search-form">
                  <input
                    type="text"
                    placeholder="ค้นหาผู้ใช้งานด้วยชื่อ Username..."
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
                        ค้นหา: {search}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

          {users.length > 0 ? <div className="pagination">
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
          
          {users.length > 0 ? (
            <>
              <div className="table-container horizontal-scroll">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>รหัส</th>
                      <th className="subname-in-table">ชื่อ Username</th>
                      <th className="name-in-table">ชื่อพนักงาน</th>
                      <th>ประเภท</th>
                      <th>เปิดใช้งาน 2FA</th>
                      <th>ทำ 2FA ไว้แล้ว</th>
                      <th>การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userobj) => (
                      <tr key={userobj.id} className={parseInt(userobj.id) === parseInt(user?.id) ? "self-row" : ""}>
                        <td>{userobj.id}</td>
                        <td className="subname-in-table">{userobj.username} {parseInt(userobj.id) === parseInt(user?.id) ? "**" : ""}</td>
                        <td className="name-in-table">{userobj.emp_name ? userobj.emp_name : "-"}</td>
                        <td className="subname-in-table">{userobj.type == 1 ? "Super Admin" : "Regular Admin"}</td>
                        <td>{userobj.is_2fa_enabled ? "ใช่" : "ไม่ใช่"}</td>
                        <td>{userobj.has_two_password ? "ใช่" : "ไม่ใช่"}</td>
                        <td className="actions">
                          <button 
                            onClick={() => handle2FADelete(userobj.id)}
                            className="delete-btn"
                            disabled={!userobj.has_two_password}
                          >
                            เอา 2FA ออก
                          </button>
                          <button 
                            onClick={() => handleEdit(userobj.id)}
                            className="edit-btn"
                          >
                            แก้ไข
                          </button>
                          <button 
                            onClick={() => handleDelete(userobj.id)}
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
            <p>ไม่พบผู้ใช้งาน</p>
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
        isOpen={modal.isOpen && (modal.type === 'confirm' || modal.type === 'confirm-2fa')} 
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

export default UsernameList;