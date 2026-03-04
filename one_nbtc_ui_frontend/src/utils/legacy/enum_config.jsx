// Configuration for enum values
export const registerEnums = {
  is_attend: {
    1: 'ประสงค์เข้าร่วม',
    0: 'ไม่ประสงค์เข้าร่วม'
  },
  take_van_id: {
    1: 'ไป - กลับ',
    2: 'ไปอย่างเดียว',
    3: 'กลับอย่างเดียว',
    4: 'ไม่ประสงค์ (เดินทางเอง)'
  },
  van_round_id: {
    1: 'รถออก รอบที่1 เวลา 7.45 น.',
    2: 'รถออก รอบที่2 เวลา 8.00 น.',
    3: 'รถออก รอบที่3 เวลา 8.15 น.'
  },
  take_food: {
    1: 'รับประทานได้ปกติ',
    2: 'ฮาลาล'
  }
};

export const getEnumValue = (type, value) => {
  return registerEnums[type]?.[value] || value;
};