// Thai date formatting
export const formatThaiDate = (dateString) => {
  const date = new Date(dateString);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Convert to Buddhist era
  
  return `${day} ${month} ${year}`;
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const thaiDate = formatThaiDate(dateString);
  const time = date.toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${thaiDate} ${time}`;
};