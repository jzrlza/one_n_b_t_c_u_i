import React from 'react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar-public">
      <div className="nav-brand-public">ONE-NBTC Registration</div>
      <div className="nav-user-public">
        กรอกข้อมูลเพื่อลงทะเบียน
      </div>
    </nav>
  );
};

export default Navbar;