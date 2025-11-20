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
  
  // New state for hierarchical selection
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
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
    fetchDivisions();
    if (isEditMode) {
      fetchRegisterData();
    } else {
      setPageLoading(false);
    }
  }, [id]);

  // Fetch divisions on component mount
  const fetchDivisions = async () => {
    try {
      const response = await axios.get('/api/registers/divisions');
      setDivisions(response.data);
    } catch (error) {
      console.error('Error fetching divisions:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูลสายงานได้');
    }
  };

  // Fetch departments based on selected division
  const fetchDepartments = async (divId) => {
    try {
      const response = await axios.get(`/api/registers/departments?div_id=${divId}`);
      setDepartments(response.data);
      setSelectedDepartment('');
      setEmployees([]);
      setSelectedEmployee('');
    } catch (error) {
      console.error('Error fetching departments:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูลสำนักได้');
    }
  };

  // Fetch employees based on selected department
  const fetchEmployees = async (deptId) => {
    try {
      const response = await axios.get(`/api/registers/employees?dept_id=${deptId}`);
      setEmployees(response.data);
      setSelectedEmployee('');
    } catch (error) {
      console.error('Error fetching employees:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูลพนักงานได้');
    }
  };

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

      // If editing, we need to fetch the employee's division and department
      if (register.emp_id) {
        try {
          const employeeInfo = await axios.get(`/api/registers/employee-info/${register.emp_id}`);
          const { division_id, department_id } = employeeInfo.data;
          
          setSelectedDivision(division_id?.toString() || '');
          if (division_id) {
            await fetchDepartments(division_id);
            setSelectedDepartment(department_id?.toString() || '');
            if (department_id) {
              await fetchEmployees(department_id);
            }
          }
          setSelectedEmployee(register.emp_id.toString());
        } catch (error) {
          console.error('Error fetching employee info:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching register:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูลการลงทะเบียนได้');
    } finally {
      setPageLoading(false);
    }
  };

  const handleDivisionChange = (e) => {
    const divisionId = e.target.value;
    setSelectedDivision(divisionId);
    setSelectedDepartment('');
    setSelectedEmployee('');
    setEmployees([]);
    
    if (divisionId) {
      fetchDepartments(divisionId);
    } else {
      setDepartments([]);
    }

    // Clear employee selection
    setFormData(prev => ({
      ...prev,
      emp_name: '',
      emp_id: ''
    }));
  };

  const handleDepartmentChange = (e) => {
    const departmentId = e.target.value;
    setSelectedDepartment(departmentId);
    setSelectedEmployee('');
    
    if (departmentId) {
      fetchEmployees(departmentId);
    } else {
      setEmployees([]);
    }

    // Clear employee selection
    setFormData(prev => ({
      ...prev,
      emp_name: '',
      emp_id: ''
    }));
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);
    
    if (employeeId) {
      const employee = employees.find(emp => emp.id.toString() === employeeId);
      if (employee) {
        setFormData(prev => ({
          ...prev,
          emp_name: employee.emp_name,
          emp_id: employee.id.toString()
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        emp_name: '',
        emp_id: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate employee selection
    if (!formData.emp_id) {
      showModal('error', 'กรุณาเลือกพนักงาน');
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        emp_id: formData.emp_id,
        phone_number: formData.phone_number,
        is_attend: parseInt(formData.is_attend),
        take_van_id: parseInt(formData.take_van_id),
        // Only include van_round_id if take_van_id is 1 or 2
        van_round_id: (formData.take_van_id === '1' || formData.take_van_id === '2') 
          ? parseInt(formData.van_round_id) 
          : null,
        take_food: parseInt(formData.take_food)
      };
      
      if (isEditMode) {
        await axios.put(`/api/registers/${id}`, submitData);
        showModal('success', 'อัพเดทการลงทะเบียนเรียบร้อยแล้ว');
      } else {
        await axios.post('/api/registers', submitData);
        showModal('success', 'เพิ่มการลงทะเบียนเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      showModal('error', 'ไม่สามารถบันทึกการลงทะเบียนได้: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check if van_round_id should be disabled
  const isVanRoundDisabled = formData.take_van_id === '3' || formData.take_van_id === '4';

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
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="form-section">
          <h2>{isEditMode ? 'แก้ไขการลงทะเบียน' : 'เพิ่มการลงทะเบียนใหม่'}</h2>
          
          <form onSubmit={handleSubmit} className="employee-form">
            {/* Division Selection */}
            <div className="form-group">
              <label>สายงาน:</label>
              <select
                value={selectedDivision}
                onChange={handleDivisionChange}
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

            {/* Department Selection */}
            <div className="form-group">
              <label>สำนัก:</label>
              <select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                disabled={!selectedDivision}
                required
              >
                <option value="">เลือกสำนัก</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.dept_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Selection */}
            <div className="form-group">
              <label>ชื่อ-นามสกุล:</label>
              <select
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                disabled={!selectedDepartment}
                required
              >
                <option value="">เลือกพนักงาน</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.emp_name}
                  </option>
                ))}
              </select>
              {formData.emp_id && (
                <small className="form-hint">เลือกพนักงานแล้ว: {formData.emp_name} (รหัส: {formData.emp_id})</small>
              )}
            </div>

            <div className="form-group">
              <label>เบอร์โทรศัพท์มือถือ:</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="ป้อนเบอร์โทรศัพท์"
              />
            </div>

            <div className="form-group">
              <label>ประสงค์เข้าร่วมงาน:</label>
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
              <label>ประสงค์ขึ้นรถตู้ของสำนักงาน:</label>
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
              <label>รอบรถตู้สำนักงานเดินทางในช่วงเช้า:</label>
              <select
                name="van_round_id"
                value={formData.van_round_id}
                onChange={handleChange}
                disabled={isVanRoundDisabled}
                required={!isVanRoundDisabled}
                className={isVanRoundDisabled ? 'disabled-field' : ''}
              >
                {Object.entries(registerEnums.van_round_id).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
              {isVanRoundDisabled && (
                <small className="form-hint">
                  รอบรถตู้ไม่สามารถเลือกได้เมื่อเลือก "กลับอย่างเดียว" หรือ "ไม่ประสงค์ (เดินทางเอง)"
                </small>
              )}
            </div>

            <div className="form-group">
              <label>อาหาร:</label>
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

            <br/>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'กำลังบันทึก...' : (isEditMode ? 'อัพเดทการลงทะเบียน' : 'เพิ่มการลงทะเบียน')}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/attendance')}
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

export default AttendeeInput;