import React, { useState } from 'react';
import { Calendar, Users, Plus, Save, X, User } from 'lucide-react';

const ShiftManager = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState([]);
  const [userRole, setUserRole] = useState('staff');
  const [showModal, setShowModal] = useState(false);
  const [showStaffEdit, setShowStaffEdit] = useState(false);
  const [selectedShift, setSelectedShift] = useState({
    staffId: '1',
    date: '',
    timeType: 'morning',
    notes: ''
  });
  const [staff, setStaff] = useState([
    { id: '1', name: '田中 花子', color: '#3B82F6' },
    { id: '2', name: '佐藤 太郎', color: '#10B981' },
    { id: '3', name: '山田 美咲', color: '#F59E0B' },
    { id: '4', name: '鈴木 一郎', color: '#EF4444' },
    { id: '5', name: '高橋 美由紀', color: '#8B5CF6' },
    { id: '6', name: '渡辺 健太', color: '#EC4899' },
    { id: '7', name: '伊藤 さくら', color: '#06B6D4' },
    { id: '8', name: '中村 雄介', color: '#84CC16' }
  ]);

  const timeTypes = {
    morning: { label: '午前', start: '08:30', end: '12:30' },
    afternoon: { label: '午後', start: '13:00', end: '17:30' },
    fullday: { label: '終日', start: '08:30', end: '17:30' }
  };

  const holidays = {
    '2025-01-01': '元日',
    '2025-01-13': '成人の日',
    '2025-02-11': '建国記念の日',
    '2025-02-23': '天皇誕生日',
    '2025-03-20': '春分の日',
    '2025-04-29': '昭和の日',
    '2025-05-03': '憲法記念日',
    '2025-05-04': 'みどりの日',
    '2025-05-05': 'こどもの日',
    '2025-07-21': '海の日',
    '2025-08-11': '山の日',
    '2025-09-15': '敬老の日',
    '2025-09-23': '秋分の日',
    '2025-10-13': 'スポーツの日',
    '2025-11-03': '文化の日',
    '2025-11-23': '勤労感謝の日'
  };

  const getDeadline = (date) => {
    return new Date(date.getFullYear(), date.getMonth() - 1, 26);
  };

  const canSubmit = () => {
    const deadline = getDeadline(currentDate);
    return new Date() <= deadline || userRole === 'admin';
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDateInfo = (date) => {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();
    
    if (holidays[dateStr]) {
      return { type: 'holiday', name: holidays[dateStr], bgColor: 'bg-red-50', textColor: 'text-red-600' };
    } else if (dayOfWeek === 0) {
      return { type: 'sunday', name: '日曜日', bgColor: 'bg-red-50', textColor: 'text-red-600' };
    } else if (dayOfWeek === 6) {
      return { type: 'saturday', name: '土曜日', bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
    } else {
      return { type: 'weekday', name: '平日', bgColor: 'bg-white', textColor: 'text-gray-900' };
    }
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const days = [];

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }

    return days;
  };

  const getShiftsForDate = (date) => {
    const dateStr = formatDate(date);
    return shifts.filter(shift => shift.date === dateStr);
  };

  const getStaffName = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member ? member.name : '';
  };

  const getStaffColor = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member ? member.color : '#6B7280';
  };

  const handleQuickAdd = (date, timeType) => {
    if (!canSubmit()) {
      alert('希望提出期限が過ぎています');
      return;
    }

    const dateStr = formatDate(date);
    const existing = shifts.find(s => 
      s.date === dateStr && 
      s.staffId === selectedShift.staffId && 
      s.timeType === timeType
    );

    if (existing) {
      setShifts(shifts.filter(s => s.id !== existing.id));
    } else {
      const newShift = {
        id: Date.now(),
        staffId: selectedShift.staffId,
        date: dateStr,
        timeType: timeType,
        notes: `${timeTypes[timeType].label}勤務`,
        status: 'requested'
      };
      setShifts([...shifts, newShift]);
    }
  };

  const handleDetailAdd = () => {
    if (!selectedShift.date) {
      alert('日付を選択してください');
      return;
    }

    const newShift = {
      id: Date.now(),
      ...selectedShift,
      status: 'requested'
    };
    
    setShifts([...shifts, newShift]);
    setShowModal(false);
    setSelectedShift({
      staffId: '1',
      date: '',
      timeType: 'morning',
      notes: ''
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + direction,
      1
    ));
  };

  const days = getCalendarDays();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">受付シフト管理</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="staff">スタッフ</option>
                <option value="admin">管理者</option>
              </select>
            </div>
          </div>
        </div>

        {userRole === 'staff' && (
          <div className={`p-4 rounded-lg border mb-6 ${
            canSubmit() ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm text-blue-700 mr-2">スタッフ:</label>
                <select
                  value={selectedShift.staffId}
                  onChange={(e) => setSelectedShift({...selectedShift, staffId: e.target.value})}
                  className="px-2 py-1 border rounded text-sm"
                >
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-white rounded border">
              <p className="text-sm text-blue-800">
                <strong>選択中:</strong> {getStaffName(selectedShift.staffId)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                💡 カレンダーの午前・午後エリアをクリックして希望を追加/削除
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50">
          <p className="font-medium text-blue-800">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月分の希望提出期限: 
            {getDeadline(currentDate).toLocaleDateString('ja-JP')} まで
          </p>
          {!canSubmit() && userRole === 'staff' && (
            <p className="text-sm text-red-600 mt-1">
              ※ 期限を過ぎているため、希望の提出・変更はできません
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← 前月
          </button>
          
          <h2 className="text-xl font-semibold">
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </h2>
          
          <button
            onClick={() => navigateMonth(1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            次月 →
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span>平日</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
              <span className="text-blue-600">土曜日</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
              <span className="text-red-600">日曜日・祝日</span>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium flex items-center">
              <Users className="w-5 h-5 mr-2" />
              受付スタッフ
            </h3>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowStaffEdit(!showStaffEdit)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                {showStaffEdit ? '編集完了' : 'スタッフ名編集'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {staff.map(member => (
              <div key={member.id} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: member.color }}
                />
                {showStaffEdit && userRole === 'admin' ? (
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => {
                      const newStaff = staff.map(s => 
                        s.id === member.id ? { ...s, name: e.target.value } : s
                      );
                      setStaff(newStaff);
                    }}
                    className="text-sm font-medium px-2 py-1 border rounded"
                  />
                ) : (
                  <span className="text-sm font-medium">{member.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-medium bg-gray-100 text-gray-700">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            const dateInfo = getDateInfo(day.date);
            return (
              <div 
                key={index}
                className={`min-h-32 border ${day.isCurrentMonth ? dateInfo.bgColor : 'bg-gray-50'}`}
              >
                <div className={`text-sm font-medium p-2 ${day.isCurrentMonth ? dateInfo.textColor : 'text-gray-400'}`}>
                  <div className="flex items-center justify-between">
                    <span>{day.date.getDate()}</span>
                    {day.isCurrentMonth && dateInfo.type === 'holiday' && (
                      <span className="text-xs bg-red-600 text-white px-1 rounded">祝</span>
                    )}
                  </div>
                  {day.isCurrentMonth && dateInfo.type === 'holiday' && (
                    <div className="text-xs text-red-600 mt-1 leading-tight">
                      {dateInfo.name}
                    </div>
                  )}
                </div>
                
                <div 
                  className={`min-h-12 p-1 border-b border-gray-200 ${
                    day.isCurrentMonth && canSubmit() && userRole === 'staff'
                      ? 'cursor-pointer hover:bg-blue-100'
                      : ''
                  }`}
                  onClick={() => {
                    if (day.isCurrentMonth && canSubmit() && userRole === 'staff') {
                      handleQuickAdd(day.date, 'morning');
                    }
                  }}
                >
                  <div className="text-xs text-gray-500 mb-1">午前</div>
                  <div className="space-y-1">
                    {getShiftsForDate(day.date)
                      .filter(shift => shift.timeType === 'morning' || shift.timeType === 'fullday')
                      .map(shift => (
                      <div 
                        key={shift.id}
                        className="text-xs p-1 rounded border-2"
                        style={{ 
                          backgroundColor: 'white',
                          borderColor: getStaffColor(shift.staffId)
                        }}
                      >
                        <div className="font-medium">{getStaffName(shift.staffId)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div 
                  className={`min-h-12 p-1 ${
                    day.isCurrentMonth && canSubmit() && userRole === 'staff'
                      ? 'cursor-pointer hover:bg-blue-100'
                      : ''
                  }`}
                  onClick={() => {
                    if (day.isCurrentMonth && canSubmit() && userRole === 'staff') {
                      handleQuickAdd(day.date, 'afternoon');
                    }
                  }}
                >
                  <div className="text-xs text-gray-500 mb-1">午後</div>
                  <div className="space-y-1">
                    {getShiftsForDate(day.date)
                      .filter(shift => shift.timeType === 'afternoon' || shift.timeType === 'fullday')
                      .map(shift => (
                      <div 
                        key={shift.id}
                        className="text-xs p-1 rounded border-2"
                        style={{ 
                          backgroundColor: 'white',
                          borderColor: getStaffColor(shift.staffId)
                        }}
                      >
                        <div className="font-medium">{getStaffName(shift.staffId)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">希望提出</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">スタッフ</label>
                  <select
                    value={selectedShift.staffId}
                    onChange={(e) => setSelectedShift({...selectedShift, staffId: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    {staff.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">日付</label>
                  <input
                    type="date"
                    value={selectedShift.date}
                    onChange={(e) => setSelectedShift({...selectedShift, date: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">時間帯</label>
                  <select
                    value={selectedShift.timeType}
                    onChange={(e) => setSelectedShift({...selectedShift, timeType: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    {Object.entries(timeTypes).map(([key, type]) => (
                      <option key={key} value={key}>
                        {type.label} ({type.start}-{type.end})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">備考</label>
                  <textarea
                    value={selectedShift.notes}
                    onChange={(e) => setSelectedShift({...selectedShift, notes: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows="2"
                    placeholder="特記事項があれば入力してください"
                  />
                </div>

                <button
                  onClick={handleDetailAdd}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftManager;