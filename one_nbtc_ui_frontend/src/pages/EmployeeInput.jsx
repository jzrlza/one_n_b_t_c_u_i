import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import NavbarAdmin from '../components/NavbarAdmin';
import Modal from '../components/Modal';

const EmployeeInput = ({ user, onLogout }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    emp_name: '',
    position_id: '',
    div_id: '',
    dept_id: ''
  });
  const [positions, setPositions] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
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
  }, [id]);

  // Filter departments when division changes
  useEffect(() => {
    if (formData.div_id) {
      const filtered = departments.filter(dept => dept.div_id == formData.div_id);
      setFilteredDepartments(filtered);
      
      // Clear department if current selection doesn't belong to selected division
      if (formData.dept_id) {
        const currentDept = departments.find(dept => dept.id == formData.dept_id);
        if (!currentDept || currentDept.div_id != formData.div_id) {
          setFormData(prev => ({ ...prev, dept_id: '' }));
        }
      }
    } else {
      setFilteredDepartments([]);
      setFormData(prev => ({ ...prev, dept_id: '' }));
    }
  }, [formData.div_id, departments]);

  const fetchDropdownData = async () => {
    try {
      const [posRes, divRes, deptRes] = await Promise.all([
        axios.get(`${API_URL}/api/employees/positions`),
        axios.get(`${API_URL}/api/employees/divisions`),
        axios.get(`${API_URL}/api/employees/departments`)
      ]);
      setPositions(posRes.data);
      setDivisions(divRes.data);
      setDepartments(deptRes.data);
      
      // After dropdowns are loaded, fetch employee data if in edit mode
      if (isEditMode) {
        await fetchEmployeeData(deptRes.data);
      } else {
        setPageLoading(false);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูล dropdown ได้');
      setPageLoading(false);
    }
  };

  const fetchEmployeeData = async (deptData = departments) => {
    try {
      const response = await axios.get(`${API_URL}/api/employees/single/${id}`);
      const employee = response.data;
      
      // Get division ID from department using the provided department data
      const dept = deptData.find(d => d.id == employee.dept_id);
      const divId = dept ? dept.div_id : '';
      
      setFormData({
        emp_name: employee.emp_name || '',
        position_id: employee.position_id || '',
        div_id: divId,
        dept_id: employee.dept_id || ''
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูลพนักงานได้');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate department selection
    if (formData.div_id && !formData.dept_id) {
      showModal('error', 'กรุณาเลือกสำนักสำหรับสายงานที่เลือก');
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        emp_name: formData.emp_name,
        position_id: formData.position_id,
        dept_id: formData.dept_id
      };
      
      if (isEditMode) {
        await axios.put(`${API_URL}/api/employees/${id}`, submitData, {
        headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Send token like a password
        }
      });
        showModal('success', 'บันทึกข้อมูลพนักงานเรียบร้อยแล้ว');
      } else {
        await axios.post(`${API_URL}/api/employees`, submitData, {
        headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Send token like a password
        }
      });
        showModal('success', 'เพิ่มพนักงานเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      showModal('error', 'ไม่สามารถบันทึกพนักงานได้: ' + (error.response?.data?.error || error.message));
      if (error.response?.status == 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'div_id') {
      // When division changes, clear department
      setFormData(prev => ({
        ...prev,
        [name]: value,
        dept_id: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleModalClose = () => {
    closeModal();
    if (modal.type === 'success') {
      navigate('/employee');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (pageLoading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="app">
      <NavbarAdmin user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="form-section app-main-form">
          <h2>{isEditMode ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}</h2>
          
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-group">
              <label>ชื่อ-นามสกุล</label>
              <input
                type="text"
                className="form-input"
                name="emp_name"
                value={formData.emp_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>ตำแหน่ง</label>
              <select
                name="position_id"
                className="form-input"
                value={formData.position_id}
                onChange={handleChange}
                required
              >
                <option value="">เลือกตำแหน่ง</option>
                {positions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.position_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>สายงาน</label>
              <select
                name="div_id"
                className="form-input"
                value={formData.div_id}
                onChange={handleChange}
                required
              >
                <option value="">เลือกสายงาน</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.div_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>สำนัก</label>
              <select
                name="dept_id"
                className="form-input"
                value={formData.dept_id}
                onChange={handleChange}
                required
                disabled={!formData.div_id}
              >
                <option value="">
                  {formData.div_id ? 'เลือกสำนัก' : 'เลือกสายงานก่อน'}
                </option>
                {filteredDepartments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
              {!formData.div_id && (
                <small className="form-hint">กรุณาเลือกสายงานก่อน</small>
              )}
            </div>

            <br/>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'กำลังบันทึก...' : (isEditMode ? 'อัพเดทพนักงาน' : 'เพิ่มพนักงาน')}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/employee')}
                className="cancel-btn"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </section>
      </main>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={handleModalClose}
        title={modal.type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={handleModalClose} className="modal-btn primary">ตกลง</button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeInput;