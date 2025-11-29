import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getGymId } from '@/utils/gymUtils';

const TrainerScheduleOverview = () => {
  const navigate = useNavigate();
  const gymId = getGymId();
  
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/trainer-availability/overview?gymId=${gymId}`
      );
      setTrainers(response.data.trainers || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Lỗi khi tải thông tin lịch HLV:', error);
      toast.error('Không thể tải thông tin lịch HLV');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoExpire = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/trainer-availability/auto-expire');
      toast.success(`Đã tự động hết hạn ${response.data.expiredCount} gói tập`);
      // Refresh overview after expiring
      fetchOverview();
    } catch (error) {
      console.error('Lỗi khi tự động hết hạn gói tập:', error);
      toast.error('Không thể tự động hết hạn gói tập');
    }
  };

  const getStatusBadge = (occupied) => {
    if (occupied) {
      return (
        <span className='inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold'>
          <CancelIcon fontSize='small' />
          Đã phân công
        </span>
      );
    }
    return (
      <span className='inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold'>
        <CheckCircleIcon fontSize='small' />
        Khả dụng
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center'>
        <div className='text-2xl text-gray-600'>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
      {/* Header */}
      <div className='max-w-7xl mx-auto mb-6'>
        <button
          onClick={() => navigate('/trainers')}
          className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4'
        >
          <ArrowBackIcon />
          <span>Quay lại</span>
        </button>
        
        <div className='bg-white rounded-xl shadow-lg p-6 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-800 flex items-center gap-3'>
              <PersonIcon className='text-purple-600' fontSize='large' />
              Quản lý Lịch Huấn Luyện Viên
            </h1>
            <p className='text-gray-600 mt-2'>
              Tổng quan phân công HLV theo lịch tập 2-4-6 và 3-5-7
            </p>
            {lastUpdated && (
              <p className='text-sm text-gray-500 mt-1'>
                Cập nhật lúc: {lastUpdated.toLocaleTimeString('vi-VN')}
              </p>
            )}
          </div>
          <div className='flex gap-3'>
            <button
              onClick={fetchOverview}
              className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <RefreshIcon />
              Làm mới
            </button>
            <button
              onClick={handleAutoExpire}
              className='flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
            >
              Tự động hết hạn
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white p-4 rounded-lg shadow'>
          <div className='text-gray-600 text-sm'>Tổng số HLV</div>
          <div className='text-3xl font-bold text-purple-600'>{trainers.length}</div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow'>
          <div className='text-gray-600 text-sm'>HLV đã đầy (2 slots)</div>
          <div className='text-3xl font-bold text-red-600'>
            {trainers.filter(t => t.availableSlots === 0).length}
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow'>
          <div className='text-gray-600 text-sm'>HLV còn 1 slot</div>
          <div className='text-3xl font-bold text-orange-600'>
            {trainers.filter(t => t.availableSlots === 1).length}
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow'>
          <div className='text-gray-600 text-sm'>HLV hoàn toàn rảnh</div>
          <div className='text-3xl font-bold text-green-600'>
            {trainers.filter(t => t.availableSlots === 2).length}
          </div>
        </div>
      </div>

      {/* Trainers List */}
      <div className='max-w-7xl mx-auto space-y-4'>
        {trainers.map((trainer) => (
          <div key={trainer.id} className='bg-white rounded-xl shadow-lg overflow-hidden'>
            {/* Trainer Header */}
            <div className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-2xl font-bold'>{trainer.name}</h3>
                  <p className='text-purple-100'>{trainer.degree || 'Huấn luyện viên'}</p>
                  {trainer.mobileNo && (
                    <p className='text-purple-100 text-sm'>SĐT: {trainer.mobileNo}</p>
                  )}
                </div>
                <div className='text-right'>
                  <div className='text-3xl font-bold'>{trainer.totalActiveMembers}/2</div>
                  <div className='text-sm text-purple-100'>Hội viên đang huấn luyện</div>
                  <div className='text-sm text-purple-100 mt-1'>
                    Slots còn lại: {trainer.availableSlots}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedules */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4'>
              {/* Schedule 2-4-6 */}
              <div className='border-2 border-gray-200 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-lg font-bold text-gray-700'>Lịch 2-4-6</h4>
                  {getStatusBadge(trainer.schedule_246.occupied)}
                </div>
                
                {trainer.schedule_246.occupied && trainer.schedule_246.member ? (
                  <div className='bg-red-50 p-3 rounded-lg'>
                    <div className='font-semibold text-red-700'>
                      {trainer.schedule_246.member.name}
                    </div>
                    <div className='text-sm text-red-600 mt-1'>
                      Gói: {trainer.schedule_246.member.membership || 'Không có'}
                    </div>
                    <div className='text-sm text-red-600'>
                      Từ {formatDate(trainer.schedule_246.member.startDate)} 
                      {' → '}
                      đến {formatDate(trainer.schedule_246.member.endDate)}
                    </div>
                  </div>
                ) : (
                  <div className='bg-green-50 p-3 rounded-lg text-green-700 text-center'>
                    ✓ Sẵn sàng nhận hội viên mới
                  </div>
                )}
              </div>

              {/* Schedule 3-5-7 */}
              <div className='border-2 border-gray-200 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-lg font-bold text-gray-700'>Lịch 3-5-7</h4>
                  {getStatusBadge(trainer.schedule_357.occupied)}
                </div>
                
                {trainer.schedule_357.occupied && trainer.schedule_357.member ? (
                  <div className='bg-red-50 p-3 rounded-lg'>
                    <div className='font-semibold text-red-700'>
                      {trainer.schedule_357.member.name}
                    </div>
                    <div className='text-sm text-red-600 mt-1'>
                      Gói: {trainer.schedule_357.member.membership || 'Không có'}
                    </div>
                    <div className='text-sm text-red-600'>
                      Từ {formatDate(trainer.schedule_357.member.startDate)} 
                      {' → '}
                      đến {formatDate(trainer.schedule_357.member.endDate)}
                    </div>
                  </div>
                ) : (
                  <div className='bg-green-50 p-3 rounded-lg text-green-700 text-center'>
                    ✓ Sẵn sàng nhận hội viên mới
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {trainers.length === 0 && (
          <div className='bg-white rounded-xl shadow-lg p-8 text-center text-gray-600'>
            Chưa có huấn luyện viên nào trong hệ thống
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerScheduleOverview;

