import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import NavbarAdmin from '../components/NavbarAdmin';
import Modal from '../components/Modal';
import { registerEnums } from '../utils/enum_config';

const AttendeeInput = ({ user, onLogout }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const searchRef = useRef(null);
  
  const [formData, setFormData] = useState({
    emp_name: '',
    emp_id: '',
    phone_number: '',
    is_attend: '1',
    take_van_id: '1',
    van_round_id: '1',
    take_food: '1'
  });
  
  // State for hierarchical selection
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputError, setInputError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '' });

  const isVanRoundDisabled = formData.take_van_id === '3' || formData.take_van_id === '4';

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

  // Filter employees whenever search term or employees list changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees([]);
    } else {
      const filtered = employees.filter(emp =>
        emp.emp_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
    setHighlightedIndex(-1);
  }, [searchTerm, employees]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch divisions on component mount
  const fetchDivisions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/registers/divisions`);
      setDivisions(response.data);
    } catch (error) {
      console.error('Error fetching divisions:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูลสายงานได้');
    }
  };

  // Fetch departments based on selected division
  const fetchDepartments = async (divId) => {
    try {
      const response = await axios.get(`${API_URL}/api/registers/departments?div_id=${divId}`);
      setDepartments(response.data);
      setSelectedDepartment('');
      setEmployees([]);
      setFilteredEmployees([]);
      setFormData(prev => ({
        ...prev,
        emp_name: '',
        emp_id: ''
      }));
      setSearchTerm('');
      setInputError('');
    } catch (error) {
      console.error('Error fetching departments:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูลสำนักได้');
    }
  };

  // Fetch employees based on selected department
  const fetchEmployees = async (deptId) => {
    try {
      const response = await axios.get(`${API_URL}/api/registers/employees?dept_id=${deptId}`);
      const employeesData = response.data;
      setEmployees(employeesData);
      setFilteredEmployees([]);
      
      // If we're in edit mode and have an emp_id, verify the employee exists in this department
      if (isEditMode && formData.emp_id) {
        const selectedEmployee = employeesData.find(emp => emp.id.toString() === formData.emp_id.toString());
        if (selectedEmployee) {
          setFormData(prev => ({
            ...prev,
            emp_name: selectedEmployee.emp_name,
            emp_id: selectedEmployee.id.toString()
          }));
          setSearchTerm(selectedEmployee.emp_name);
          setInputError('');
        }
      } else {
        setFormData(prev => ({
          ...prev,
          emp_name: '',
          emp_id: ''
        }));
        setSearchTerm('');
      }
      setInputError('');
    } catch (error) {
      console.error('Error fetching employees:', error);
      showModal('error', 'ไม่สามารถโหลดข้อมูลพนักงานได้');
    }
  };

  const fetchRegisterData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/registers/single/${id}`);
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
          const employeeInfo = await axios.get(`${API_URL}/api/registers/employee-info/${register.emp_id}`);
          const { division_id, department_id } = employeeInfo.data;
          
          setSelectedDivision(division_id?.toString() || '');
          if (division_id) {
            await fetchDepartments(division_id);
            setSelectedDepartment(department_id?.toString() || '');
            if (department_id) {
              await fetchEmployees(department_id);
              // Set the search term to the employee name
              setSearchTerm(register.emp_name);
              
              // Important: Set the form data again after employees are loaded
              // This ensures the employee is properly selected
              setFormData(prev => ({
                ...prev,
                emp_name: register.emp_name,
                emp_id: register.emp_id
              }));
            }
          }
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
    setEmployees([]);
    setFilteredEmployees([]);
    setSearchTerm('');
    setInputError('');
    
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
    setSearchTerm('');
    setInputError('');
    
    if (departmentId) {
      fetchEmployees(departmentId);
    } else {
      setEmployees([]);
      setFilteredEmployees([]);
    }

    // Clear employee selection
    setFormData(prev => ({
      ...prev,
      emp_name: '',
      emp_id: ''
    }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    setInputError('');
    
    // Clear selected employee when typing
    if (value !== formData.emp_name) {
      setFormData(prev => ({
        ...prev,
        emp_name: value,
        emp_id: ''
      }));
    }

    // When input becomes empty while focused, show all employees
    if (value === '' && selectedDepartment) {
      setFilteredEmployees(employees);
    }
  };

  // Handle employee selection from suggestions
  const handleEmployeeSelect = (employee) => {
    setFormData(prev => ({
      ...prev,
      emp_name: employee.emp_name,
      emp_id: employee.id.toString()
    }));
    setSearchTerm(employee.emp_name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setInputError('');
  };

  // Validate if the entered text matches an employee in the list
  const validateEmployeeInput = () => {
    // If already have a valid emp_id and the name matches, no need to validate
    if (formData.emp_id && formData.emp_name === searchTerm) {
      return true;
    }

    // Try to find exact match in employees list
    const exactMatch = employees.find(emp => 
      emp.emp_name.toLowerCase() === searchTerm.trim().toLowerCase()
    );

    if (exactMatch) {
      // Auto-select the exact match
      setFormData(prev => ({
        ...prev,
        emp_name: exactMatch.emp_name,
        emp_id: exactMatch.id.toString()
      }));
      setSearchTerm(exactMatch.emp_name);
      setInputError('');
      return true;
    }

    // Try to find if the search term matches any employee name (case insensitive)
    const partialMatches = employees.filter(emp =>
      emp.emp_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (partialMatches.length === 1) {
      // If only one match, auto-select it
      const match = partialMatches[0];
      setFormData(prev => ({
        ...prev,
        emp_name: match.emp_name,
        emp_id: match.id.toString()
      }));
      setSearchTerm(match.emp_name);
      setInputError('');
      return true;
    } else if (partialMatches.length > 1) {
      // Multiple matches - show error to select from dropdown
      setInputError('พบพนักงานหลายคน กรุณาเลือกจากรายการ');
      return false;
    } else {
      // No matches found
      setInputError('ไม่พบพนักงานในสำนัก กรุณาตรวจสอบชื่ออีกครั้ง');
      return false;
    }
  };

  // Handle input blur - validate when user leaves the field
  const handleInputBlur = () => {
    // Small delay to allow click on suggestion to register first
    setTimeout(() => {
      if (!showSuggestions && searchTerm && !formData.emp_id) {
        validateEmployeeInput();
      }
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredEmployees.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredEmployees.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleEmployeeSelect(filteredEmployees[highlightedIndex]);
        } else {
          // If no item highlighted, try to validate the input
          validateEmployeeInput();
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (selectedDepartment && employees.length > 0) {
      setShowSuggestions(true);

      if (searchTerm === '') {
        setFilteredEmployees(employees);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation before submit
    if (!formData.emp_id) {
      // Try to validate one more time
      const isValid = validateEmployeeInput();
      if (!isValid) {
        showModal('error', 'กรุณาเลือกพนักงานจากรายการ หรือตรวจสอบชื่อให้ถูกต้อง');
        return;
      }
    }

    // Double-check that we have a valid emp_id after validation
    if (!formData.emp_id) {
      showModal('error', 'กรุณาเลือกพนักงานจากรายการ');
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
        await axios.put(`${API_URL}/api/registers/${id}`, submitData, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        showModal('success', 'อัพเดทการลงทะเบียนเรียบร้อยแล้ว');
      } else {
        await axios.post(`${API_URL}/api/registers`, submitData);
        showModal('success', 'เพิ่มการลงทะเบียนเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      showModal('error', 'ไม่สามารถบันทึกการลงทะเบียนได้: ' + (error.response?.data?.error || error.message));
      if (error.response?.status === 403) {
        handleLogout();
      }
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

  // Function to highlight matching text in suggestions
  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={index} className="highlight">{part}</span> : 
        part
    );
  };

  if (pageLoading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="app">
      <NavbarAdmin user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="form-section app-main-form">
          <h2>{isEditMode ? 'แก้ไขการลงทะเบียน' : 'เพิ่มการลงทะเบียนใหม่'}</h2>
          
          <form onSubmit={handleSubmit} className="employee-form">
            {/* Division Selection */}
            <div className="form-group">
              <label>สายงาน</label>
              <select
                value={selectedDivision}
                className="form-input"
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
              <label>สำนัก</label>
              <select
                value={selectedDepartment}
                className="form-input"
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

            {/* Employee Search with Google-like suggestions */}
            <div className="form-group" ref={searchRef}>
              <label>ชื่อ-นามสกุล</label>
              <div className="search-container">
                <input
                  type="text"
                  className={`form-input ${inputError ? 'input-error' : ''}`}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedDepartment ? "พิมพ์ชื่อเพื่อค้นหา..." : "กรุณาเลือกสำนักก่อน"}
                  disabled={!selectedDepartment}
                  autoComplete="off"
                />
                
                {/* Error message */}
                {inputError && (
                  <div className="input-error-message">
                    {inputError}
                  </div>
                )}
                
                {/* Google-like suggestions dropdown */}
                {showSuggestions && selectedDepartment && (
                  <div className="suggestions-dropdown">
                    {filteredEmployees.length > 0 ? (
                      <ul className="suggestions-list">
                        {filteredEmployees.map((employee, index) => (
                          <li
                            key={employee.id}
                            className={`suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                            onClick={() => handleEmployeeSelect(employee)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                          >
                            <div className="employee-name">
                              {highlightMatch(employee.emp_name, searchTerm)}
                            </div>
                            <div className="employee-id">รหัสในฐานข้อมูล: {employee.id}</div>
                          </li>
                        ))}
                      </ul>
                    ) : searchTerm ? (
                      <div className="no-suggestions">
                        <div className="no-results-icon">🔍</div>
                        <div>ไม่พบพนักงาน "{searchTerm}"</div>
                        <div className="no-results-hint">ลองค้นหาด้วยชื่ออื่น</div>
                      </div>
                    ) : (
                      <div className="suggestions-header">
                        <span>พิมพ์ชื่อเพื่อค้นหาพนักงาน ({employees.length} คน)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected employee indicator */}
              {/*formData.emp_id && !inputError && (
                <div className="selected-indicator">
                  <span className="selected-badge">
                    ✓ เลือก: {formData.emp_name} (รหัสในฐานข้อมูล: {formData.emp_id})
                  </span>
                </div>
              )*/}
            </div>

            <div className="form-group">
              <label>เบอร์โทรศัพท์มือถือ:</label>
              <input
                type="text"
                className="form-input"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="ป้อนเบอร์โทรศัพท์"
              />
            </div>

            <div className="form-group">
              <label>ประสงค์เข้าร่วมงาน:</label>
              <select
                className="form-input"
                name="is_attend"
                value={formData.is_attend}
                onChange={handleChange}
                required
              >
                {Object.entries(registerEnums.is_attend).reverse().map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>ประสงค์ขึ้นรถตู้ของสำนักงาน:</label>
              <select
                className="form-input"
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
                className="form-input"
                name="van_round_id"
                value={formData.van_round_id}
                onChange={handleChange}
                disabled={isVanRoundDisabled}
                required={!isVanRoundDisabled}
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
                className="form-input"
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