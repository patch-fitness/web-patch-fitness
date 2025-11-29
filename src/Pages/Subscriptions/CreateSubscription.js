import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { getGymId } from '@/utils/gymUtils';

const CreateSubscription = () => {
  const navigate = useNavigate();
  const gymId = getGymId();

  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    membershipId: '',
    scheduleType: '', // '2-4-6' or '3-5-7'
    trainerId: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Data lists
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [availableTrainers, setAvailableTrainers] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState({
    members: false,
    memberships: false,
    trainers: false,
    submit: false
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [trainersFetched, setTrainersFetched] = useState(false);

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
    fetchMemberships();
  }, []);

  // Fetch available trainers when schedule type changes
  useEffect(() => {
    if (formData.scheduleType) {
      fetchAvailableTrainers(formData.scheduleType);
    } else {
      setAvailableTrainers([]);
      setTrainersFetched(false);
    }
  }, [formData.scheduleType]);

  const fetchMembers = async () => {
    setLoading(prev => ({ ...prev, members: true }));
    try {
      // Lấy tất cả members
      const membersResponse = await axios.get(`http://localhost:5000/api/members?gymId=${gymId}`);
      const allMembers = membersResponse.data || [];
      
      // Lấy tất cả subscriptions
      const subscriptionsResponse = await axios.get(`http://localhost:5000/api/subscriptions?gymId=${gymId}`);
      const allSubscriptions = subscriptionsResponse.data || [];
      
      // Lấy tất cả memberships
      const membershipsResponse = await axios.get(`http://localhost:5000/api/memberships?gymId=${gymId}`);
      const allMemberships = membershipsResponse.data || [];
      
      // Tạo Map membership có HLV
      const membershipHasTrainer = new Set(
        allMemberships
          .filter(m => m.has_trainer === true || m.has_trainer === 1)
          .map(m => m.id)
      );
      
      // Lấy member IDs có active subscription với membership có HLV
      const memberIdsWithTrainer = new Set(
        allSubscriptions
          .filter(sub => 
            sub.status === 'Active' && 
            membershipHasTrainer.has(sub.membershipId)
          )
          .map(sub => sub.memberId)
      );
      
      // CHỈ lấy members có gói tập với HLV
      const membersWithTrainer = allMembers.filter(member => 
        memberIdsWithTrainer.has(member.id)
      );
      
      setMembers(membersWithTrainer);
      
      if (membersWithTrainer.length === 0) {
        toast.info('Chưa có hội viên nào đăng ký gói có huấn luyện viên.');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hội viên:', error);
      toast.error('Không thể tải danh sách hội viên');
    } finally {
      setLoading(prev => ({ ...prev, members: false }));
    }
  };

  const fetchMemberships = async () => {
    setLoading(prev => ({ ...prev, memberships: true }));
    try {
      const response = await axios.get(`http://localhost:5000/api/memberships?gymId=${gymId}`);
      // CHỈ lấy các gói có huấn luyện viên
      const membershipsWithTrainer = (response.data || []).filter(m => m.has_trainer === true || m.has_trainer === 1);
      setMemberships(membershipsWithTrainer);
      
      if (membershipsWithTrainer.length === 0) {
        toast.info('Chưa có gói tập nào có huấn luyện viên. Vui lòng tạo gói VIP trước.');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách gói tập:', error);
      toast.error('Không thể tải danh sách gói tập');
    } finally {
      setLoading(prev => ({ ...prev, memberships: false }));
    }
  };

  const fetchAvailableTrainers = async (scheduleType) => {
    setLoading(prev => ({ ...prev, trainers: true }));
    setTrainersFetched(false);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/trainer-availability/available?gymId=${gymId}&scheduleType=${scheduleType}`
      );
      setAvailableTrainers(response.data.trainers || []);
      setTrainersFetched(true);
      
      // Show info toast
      if (response.data.availableTrainers === 0) {
        toast.info(`Không có HLV khả dụng cho lịch ${scheduleType}. Tất cả HLV đã được phân công cho lịch này.`);
      } else {
        toast.success(`Tìm thấy ${response.data.availableTrainers} HLV khả dụng cho lịch ${scheduleType}`);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách HLV khả dụng:', error);
      toast.error('Không thể tải danh sách HLV khả dụng');
      setAvailableTrainers([]);
    } finally {
      setLoading(prev => ({ ...prev, trainers: false }));
    }
  };

  const handleMemberSelect = (member) => {
    setFormData({ ...formData, memberId: member.id });
    setMemberSearch(member.name);
    setShowMemberDropdown(false);
  };

  const handleScheduleChange = (schedule) => {
    // Reset trainer selection when schedule changes
    setFormData({ 
      ...formData, 
      scheduleType: schedule,
      trainerId: '' // Clear previous trainer selection
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.memberId) {
      toast.error('Vui lòng chọn hội viên');
      return;
    }
    if (!formData.membershipId) {
      toast.error('Vui lòng chọn gói tập');
      return;
    }
    if (!formData.scheduleType) {
      toast.error('Vui lòng chọn lịch tập');
      return;
    }
    if (!formData.trainerId) {
      toast.error('Vui lòng chọn huấn luyện viên');
      return;
    }
    if (!formData.startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu');
      return;
    }

    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const selectedMembership = memberships.find(m => m.id === parseInt(formData.membershipId));
      
      if (!selectedMembership) {
        toast.error('Không tìm thấy gói tập đã chọn');
        setLoading(prev => ({ ...prev, submit: false }));
        return;
      }

      // Tính endDate dựa trên startDate và duration của membership
      const startDate = new Date(formData.startDate);
      const durationMonths = selectedMembership.duration_in_months || selectedMembership.months || 1;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);
      
      const subscriptionData = {
        memberId: parseInt(formData.memberId),
        membershipId: parseInt(formData.membershipId),
        trainerId: parseInt(formData.trainerId),
        pt_schedule: formData.scheduleType,
        startDate: formData.startDate,
        endDate: endDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        status: 'Active',
        gymId: parseInt(gymId)
      };

      const response = await axios.post('http://localhost:5000/api/subscriptions', subscriptionData);
      
      console.log('✓ Đã tạo gói tập thành công:', response.data);
      
      // Tự động tính lương PT sau khi tạo subscription thành công
      if (formData.trainerId) {
        try {
          const salaryResponse = await axios.post(
            `http://localhost:5000/api/finance/calculate-pt-salaries?gymId=${gymId}&period=this_month`
          );
          
          if (salaryResponse.data.expenses_created > 0) {
            const ptExpense = salaryResponse.data.results.find(r => r.trainer_id === parseInt(formData.trainerId));
            if (ptExpense && ptExpense.expense_created) {
              toast.success(
                `✅ Tạo gói tập thành công! Đã tự động tính lương PT: ${ptExpense.expense_amount.toLocaleString('vi-VN')} VND`,
                { autoClose: 5000 }
              );
            } else {
              toast.success('✅ Tạo gói tập thành công! Lịch PT đã được cập nhật.', { autoClose: 3000 });
            }
          } else {
            toast.success('✅ Tạo gói tập thành công! Lịch PT đã được cập nhật.', { autoClose: 3000 });
          }
        } catch (salaryError) {
          console.error('Lỗi khi tính lương PT:', salaryError);
          // Vẫn hiển thị success cho subscription, chỉ warn về salary
          toast.success('✅ Tạo gói tập thành công!', { autoClose: 3000 });
          toast.warn('⚠️ Không thể tự động tính lương PT. Vui lòng tính thủ công trong mục Tài chính.');
        }
      } else {
        toast.success('✅ Tạo gói tập thành công!', { autoClose: 3000 });
      }
      
      // Chuyển hướng đến trang chi tiết hội viên sau 2 giây
      setTimeout(() => {
        navigate(`/members/${formData.memberId}`);
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi tạo gói tập:', error);
      const errorMessage = error.response?.data?.message || 'Không thể tạo gói tập';
      toast.error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.mobileNo?.includes(memberSearch)
  );

  const selectedMember = members.find(m => m.id === formData.memberId);
  const selectedMembership = memberships.find(m => m.id === parseInt(formData.membershipId));
  const selectedTrainer = availableTrainers.find(t => t.id === parseInt(formData.trainerId));

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
      {/* Header */}
      <div className='max-w-4xl mx-auto mb-6'>
        <button
          onClick={() => navigate('/members')}
          className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4'
        >
          <ArrowBackIcon />
          <span>Quay lại danh sách hội viên</span>
        </button>
        
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h1 className='text-3xl font-bold text-gray-800 flex items-center gap-3'>
            <FitnessCenterIcon className='text-purple-600' fontSize='large' />
            Tạo Gói Tập Mới Cho Hội Viên (Gói VIP)
          </h1>
          <p className='text-gray-600 mt-2'>
            ✨ Phân công huấn luyện viên cá nhân theo lịch tập cho hội viên đã đăng ký gói VIP
          </p>
          <div className='mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800'>
            ℹ️ <strong>Lưu ý:</strong> Chỉ hội viên đã đăng ký gói có huấn luyện viên mới xuất hiện trong danh sách
          </div>
        </div>
      </div>

      {/* Form */}
      <div className='max-w-4xl mx-auto'>
        <form onSubmit={handleSubmit} className='bg-white rounded-xl shadow-lg p-8 space-y-6'>
          
          {/* 1. Chọn Hội viên */}
          <div>
            <label className='block text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2'>
              <PersonIcon className='text-blue-600' />
              Chọn Hội viên (Đã đăng ký gói VIP) <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <input
                type='text'
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setShowMemberDropdown(true);
                  if (!e.target.value) {
                    setFormData({ ...formData, memberId: '' });
                  }
                }}
                onFocus={() => setShowMemberDropdown(true)}
                className='w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg'
                placeholder='Tìm kiếm hội viên theo tên hoặc số điện thoại...'
              />
              
              {showMemberDropdown && filteredMembers.length > 0 && (
                <div className='absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto'>
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      className='p-4 hover:bg-purple-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors'
                    >
                      <div className='font-semibold text-lg'>{member.name}</div>
                      <div className='text-sm text-gray-600'>SĐT: {member.mobileNo}</div>
                      {member.address && (
                        <div className='text-sm text-gray-500'>{member.address}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedMember && (
              <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
                <div className='text-green-700 font-semibold'>✓ Đã chọn: {selectedMember.name}</div>
                <div className='text-green-600 text-sm'>SĐT: {selectedMember.mobileNo}</div>
              </div>
            )}
          </div>

          {/* 2. Chọn Gói tập */}
          <div>
            <label className='block text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2'>
              <FitnessCenterIcon className='text-purple-600' />
              Chọn Gói tập VIP (Có HLV) <span className='text-red-500'>*</span>
            </label>
            <select
              value={formData.membershipId}
              onChange={(e) => setFormData({ ...formData, membershipId: e.target.value })}
              className='w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg'
              disabled={loading.memberships}
            >
              <option value=''>-- Chọn gói tập --</option>
              {memberships.map((membership) => (
                <option key={membership.id} value={membership.id}>
                  {membership.title || membership.name} - {membership.duration_in_months || membership.months} tháng - {membership.price?.toLocaleString('vi-VN')} VND
                </option>
              ))}
            </select>
            
            {selectedMembership && (
              <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='font-semibold text-blue-700'>
                  {selectedMembership.title || selectedMembership.name}
                </div>
                <div className='text-blue-600 text-sm'>
                  Thời hạn: {selectedMembership.duration_in_months || selectedMembership.months} tháng - 
                  Giá: {selectedMembership.price?.toLocaleString('vi-VN')} VND
                </div>
              </div>
            )}
          </div>

          {/* 3. Chọn Lịch tập */}
          <div>
            <label className='block text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2'>
              <ScheduleIcon className='text-indigo-600' />
              Chọn Lịch tập <span className='text-red-500'>*</span>
            </label>
            <div className='text-sm text-gray-600 mb-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200'>
              ⚠️ <strong>Lưu ý:</strong> Mỗi HLV chỉ có thể nhận tối đa 1 hội viên cho mỗi loại lịch.
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <label 
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.scheduleType === '2-4-6' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type='radio'
                  name='schedule'
                  value='2-4-6'
                  checked={formData.scheduleType === '2-4-6'}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className='mr-3 w-5 h-5'
                />
                <div>
                  <div className='text-xl font-bold'>Lịch 2-4-6</div>
                  <div className='text-sm text-gray-600'>Thứ Hai - Thứ Tư - Thứ Sáu</div>
                </div>
              </label>
              
              <label 
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.scheduleType === '3-5-7' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type='radio'
                  name='schedule'
                  value='3-5-7'
                  checked={formData.scheduleType === '3-5-7'}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className='mr-3 w-5 h-5'
                />
                <div>
                  <div className='text-xl font-bold'>Lịch 3-5-7</div>
                  <div className='text-sm text-gray-600'>Thứ Ba - Thứ Năm - Chủ Nhật</div>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Chọn Huấn luyện viên - Only show after schedule is selected */}
          {formData.scheduleType && (
            <div>
              <label className='block text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                <PersonIcon className='text-green-600' />
                Chọn Huấn luyện viên <span className='text-red-500'>*</span>
              </label>
              
              {loading.trainers ? (
                <div className='p-4 text-center text-gray-600'>
                  Đang tải danh sách HLV khả dụng...
                </div>
              ) : availableTrainers.length === 0 && trainersFetched ? (
                <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
                  ⚠️ Không có HLV nào khả dụng cho lịch {formData.scheduleType}. 
                  Tất cả HLV đã được phân công đầy đủ cho lịch này.
                </div>
              ) : (
                <>
                  <select
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                    className='w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg'
                  >
                    <option value=''>-- Chọn huấn luyện viên --</option>
                    {availableTrainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name} - {trainer.degree || 'HLV'} 
                        {trainer.currentAssignments && ` (Đang huấn luyện: ${trainer.currentAssignments.total} hội viên)`}
                      </option>
                    ))}
                  </select>
                  
                  {selectedTrainer && (
                    <div className='mt-3 p-4 bg-green-50 border border-green-200 rounded-lg'>
                      <div className='font-semibold text-green-700 text-lg'>
                        ✓ Đã chọn: {selectedTrainer.name}
                      </div>
                      <div className='text-green-600 text-sm mt-1'>
                        {selectedTrainer.degree && <div>Chuyên môn: {selectedTrainer.degree}</div>}
                        {selectedTrainer.mobileNo && <div>SĐT: {selectedTrainer.mobileNo}</div>}
                        {selectedTrainer.currentAssignments && (
                          <div className='mt-2 text-xs'>
                            Hiện tại đang huấn luyện: {selectedTrainer.currentAssignments.total} hội viên
                            (Lịch 2-4-6: {selectedTrainer.currentAssignments.schedule_246}, 
                            Lịch 3-5-7: {selectedTrainer.currentAssignments.schedule_357})
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 5. Ngày bắt đầu */}
          <div>
            <label className='block text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2'>
              <CalendarTodayIcon className='text-orange-600' />
              Ngày bắt đầu <span className='text-red-500'>*</span>
            </label>
            <input
              type='date'
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className='w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg'
            />
          </div>

          {/* Submit Button */}
          <div className='pt-4'>
            {/* Validation message */}
            {!formData.memberId && (
              <div className='mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                ⚠️ Vui lòng chọn hội viên
              </div>
            )}
            {!formData.membershipId && formData.memberId && (
              <div className='mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                ⚠️ Vui lòng chọn gói tập VIP
              </div>
            )}
            {!formData.scheduleType && formData.membershipId && (
              <div className='mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                ⚠️ Vui lòng chọn lịch tập (2-4-6 hoặc 3-5-7)
              </div>
            )}
            {formData.scheduleType && availableTrainers.length === 0 && trainersFetched && (
              <div className='mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                ⚠️ Không có HLV khả dụng cho lịch {formData.scheduleType}. Vui lòng chọn lịch khác hoặc thêm HLV mới.
              </div>
            )}
            {!formData.trainerId && formData.scheduleType && availableTrainers.length > 0 && (
              <div className='mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm'>
                ⚠️ Vui lòng chọn huấn luyện viên
              </div>
            )}
            
            <button
              type='submit'
              disabled={
                loading.submit || 
                !formData.memberId || 
                !formData.membershipId || 
                !formData.scheduleType || 
                !formData.trainerId || 
                !formData.startDate ||
                (formData.scheduleType && availableTrainers.length === 0 && trainersFetched)
              }
              className={`w-full p-4 text-xl font-bold rounded-lg transition-all ${
                loading.submit || 
                !formData.memberId || 
                !formData.membershipId || 
                !formData.scheduleType || 
                !formData.trainerId || 
                !formData.startDate ||
                (formData.scheduleType && availableTrainers.length === 0 && trainersFetched)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {loading.submit ? 'Đang tạo gói tập...' : 'Tạo Gói Tập Mới'}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CreateSubscription;

