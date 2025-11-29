/**
 * Utility functions để quản lý gymId
 * Lưu và lấy gymId từ localStorage
 */

/**
 * Lấy gymId từ localStorage
 * Nếu chưa có, trả về giá trị mặc định là 1
 * @returns {number} gymId
 */
export const getGymId = () => {
  const gymId = localStorage.getItem('gymId');
  if (gymId) {
    return parseInt(gymId, 10);
  }
  // Mặc định là 1 nếu chưa có
  // Trong tương lai, có thể lấy từ API khi đăng nhập
  return 1;
};

/**
 * Lưu gymId vào localStorage
 * @param {number} gymId 
 */
export const setGymId = (gymId) => {
  localStorage.setItem('gymId', gymId.toString());
};

