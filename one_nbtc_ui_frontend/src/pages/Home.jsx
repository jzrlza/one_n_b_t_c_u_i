import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import bannerImage from '../res/banner.jpg';

const Home = ({ user, onLogout }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const { id } = useParams();
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    emp_name: '',
    emp_id: '',
    table_number: ''
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
      setEmployees(response.data);
      setFilteredEmployees([]);
      setFormData(prev => ({
        ...prev,
        emp_name: '',
        emp_id: ''
      }));
      setSearchTerm('');
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
        table_number: register.table_number || ''
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
        table_number: formData.table_number
      };
      
      if (isEditMode) {
        await axios.put(`${API_URL}/api/registers/${id}`, submitData);
        showModal('success', 'อัพเดทการลงทะเบียนเรียบร้อยแล้ว');
      } else {
        await axios.post(`${API_URL}/api/registers`, submitData);
        showModal('success', 'Thank You! ลงทะเบียนสำเร็จ');
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

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/health`);
      setBackendHealth(response.data);
    } catch (error) {
      setBackendHealth({ status: 'ERROR', error: error.message });
    }
  };

  const handleModalClose = () => {
    closeModal();
    if (modal.type === 'success') {
      clearFormInput();
    }
  };

  const clearFormInput = () => {
    setFormData({
      emp_name: '',
      emp_id: '',
      table_number: ''
    });

    setSelectedDivision('');
    setSelectedDepartment('');
    setDepartments([]);
    setEmployees([]);
    setFilteredEmployees([]);
    setSearchTerm('');
    setInputError('');
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

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
    <div className="app app-home">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="app-main app-home">
        <section className="health-section">
          <img className="img-banner" src={bannerImage} 
            alt={
              `Register Now | กิจกรรม NBTC Learn and Grow | Uptrend, Level Up, Grow Together | by NBTC Academy`
            } 
          />
        </section>

        <section className="home-form">
          <h2 className="home-form-title">{isEditMode ? 'แก้ไขการลงทะเบียน' : 'ลงทะเบียน'}</h2>
          
          <form onSubmit={handleSubmit} className="employee-form">
            {/* Division Selection */}
            <div className="form-group">
              <label>สายงาน</label>
              <select
                className="select-form-item"
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
              <label>สำนัก</label>
              <select
                className="select-form-item"
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

            {/* Employee Search with Google-like suggestions */}
            <div className="form-group" ref={searchRef}>
              <label>ชื่อ-นามสกุล</label>
              <div className="search-container">
                <input
                  type="text"
                  className={`select-form-item ${inputError ? 'input-error' : ''}`}
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
                        <span>พิมพ์ชื่อเพื่อค้นหาพนักงาน<br/>({employees.length} คน)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected employee indicator */}
              {/*formData.emp_id && !inputError && (
                <div className="selected-indicator">
                  <span className="selected-badge">
                    เลือก: {formData.emp_name}
                  </span>
                </div>
              )*/}
            </div>

            <div className="form-group">
              <label>เบอร์โต๊ะ</label>
              <input
                className="select-form-item"
                type="text"
                name="table_number"
                value={formData.table_number}
                onChange={handleChange}
                placeholder="ป้อนเบอร์โต๊ะ"
              />
            </div>

            <br/>

            <div className="form-actions">
              <button type="submit" disabled={loading} 
              className="submit-btn submit-btn-home">
                {loading ? 'กำลังบันทึก...' : (isEditMode ? 'อัพเดท' : 'บันทึก')}
              </button>
            </div>
            <br/>
          </form>
        </section>
        <br/>
      </main>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={handleModalClose}
        title={modal.type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={handleModalClose} className="modal-btn primary">ปิด</button>
        </div>
      </Modal>
    </div>
  );
};

export default Home;