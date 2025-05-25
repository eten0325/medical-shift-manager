import React, { useState } from 'react';
import { Calendar, Plus, X, Save, Users, User } from 'lucide-react';

const ShiftManager = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState([]);
  const [userRole, setUserRole] = useState('staff');
  const [showModal, setShowModal] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [selectedShift, setSelectedShift] = useState({
    staffId: '1',
    date: '',
    timeType: 'morning',
    notes: ''
  });

  // スタッフデータ
  const staff = [
    { id: '1', name: '田中 花子', color: '#3B82F6' },
    { id: '2', name: '佐藤 太郎', color: '#10B981' },
    { id: '3', name: '山田 美咲', color: '#F59E0B' },
    { id: '4', name: '鈴木 一郎', color: '#EF4444' }
  ];

  // シフト時間設定
  const timeTypes = {
    morning: { label: '午前', start: '08:30', end: '12:30' },
    afternoon: { label: '午後', start: '13:00', end: '17:30' },
    fullday: { label: '終日', start: '08:30', end: '17:30' }
  };

  // 期限チェック
  const getDeadline = (date) => {
    return new Date(date.getFullYear(), date.getMonth() - 1, 26);
  };

  const isDeadlinePassed = () => {
    const deadline = getDeadline(currentDate);
    return new Date() > deadline;
  };

  const canSubmit = () => {
    return !isDeadlinePassed() || userRole === 'admin';
  };

  // 日付フォーマット
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // カレンダー日付生成
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const days = [];

    // 前月の日付
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false
      });
    }

    // 今月の日付
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }

    return days;
  };

  // 指定日のシフト取得
  const getShiftsForDate = (date) => {
    const dateStr = formatDate(date);
    return shifts.filter(shift => shift.date === dateStr);
  };

  // スタッフ名取得
  const getStaffName = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member ? member.name : '';
  };

  // スタッフ色取得
  const getStaffColor = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member ? member.color : '#6B7280';
  };

  // クイックモードでシフト追加
  const handleQuickAdd = (date) => {
    if (!canSubmit()) {
      alert('希望提出期限が過ぎています');
      return;
    }

    const dateStr = formatDate(date);
    const timeType = selectedShift.timeType;
    
    // 既存シフトをチェック
    const existing = shifts.find(s => 
      s.date === dateStr && 
      s.staffId === selectedShift.staffId && 
      s.timeType === timeType
    );

    if (existing) {
      // 削除
      setShifts(shifts.filter(s => s.id !== existing.id));
    } else {
      // 追加
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

  // 詳細モードでシフト追加
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

  // 月移動
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
        
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">受付シフト管理</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* ロール切り替え */}
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
            
            {/* 希望提出ボタン */}
            <button
              onClick={() => setShowModal(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                !canSubmit() && userRole === 'staff'
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              disabled={!canSubmit() && userRole === 'staff'}
            >
              <Plus className="w-4 h-4" />
              <span>希望提出</span>
            </button>
          </div>
        </div>

        {/* カレンダー直接選択 */}
        {userRole === 'staff' && (
          <div className={`p-4 rounded-lg border mb-6 ${
            canSubmit() ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-4 mb-3">
              <input
                type="checkbox"
                id="quickMode"
                checked={quickMode}
                disabled={!canSubmit()}
                onChange={(e) => setQuickMode(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="quickMode" className={`font-medium ${
                canSubmit() ? 'text-blue-800' : 'text-gray-500'
              }`}>
                カレンダーで直接選択
              </label>
            </div>

            {quickMode && canSubmit() && (
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
                
                <div>
                  <label className="text-sm text-blue-700 mr-2">時間帯:</label>
                  {Object.entries(timeTypes).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedShift({...selectedShift, timeType: key})}
                      className={`px-3 py-1 text-sm rounded mr-2 transition-colors ${
                        selectedShift.timeType === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quickMode && canSubmit() && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm text-blue-800">
                  <strong>設定:</strong> {getStaffName(selectedShift.staffId)} - 
                  {timeTypes[selectedShift.timeType].label} 
                  ({timeTypes[selectedShift.timeType].start}-{timeTypes[selectedShift.timeType].end})
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 カレンダーの日付をクリックして希望を追加/削除
                </p>
              </div>
            )}
          </div>
        )}

        {/* 期限表示 */}
        <div className="mb-6 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50">
          <p className="font-medium text-blue-800">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月分の希望提出期限: 
            {getDeadline(currentDate).toLocaleDateString('ja-JP')} まで
          </p>
          {isDeadlinePassed() && userRole === 'staff' && (
            <p className="text-sm text-red-600 mt-1">
              ※ 期限を過ぎているため、希望の提出・変更はできません
            </p>
          )}
        </div>

        {/* カレンダーナビゲーション */}
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

        {/* スタッフ一覧 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            受付スタッフ
          </h3>
          <div className="flex flex-wrap gap-3">
            {staff.map(member => (
              <div key={member.id} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-sm font-medium">{member.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* カレンダー */}
        <div className="grid grid-cols-7 gap-1">
          {/* 曜日ヘッダー */}
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-medium bg-gray-100 text-gray-700">
              {day}
            </div>
          ))}
          
          {/* 日付セル */}
          {days.map((day, index) => (
            <div 
              key={index}
              className={`min-h-32 p-2 border ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${
                quickMode && day.isCurrentMonth && canSubmit()
                  ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300'
                  : ''
              }`}
              onClick={() => {
                if (quickMode && day.isCurrentMonth && canSubmit()) {
                  handleQuickAdd(day.date);
                }
              }}
            >
              <div className={`text-sm font-medium mb-2 ${
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {getShiftsForDate(day.date).map(shift => (
                  <div 
                    key={shift.id}
                    className="text-xs p-1 rounded border"
                    style={{ 
                      backgroundColor: 'white',
                      borderColor: getStaffColor(shift.staffId),
                      borderWidth: '2px'
                    }}
                  >
                    <div className="font-medium">{getStaffName(shift.staffId)}</div>
                    <div>{timeTypes[shift.timeType].label}</div>
                    <div className="text-gray-500">
                      {timeTypes[shift.timeType].start}-{timeTypes[shift.timeType].end}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 詳細入力モーダル */}
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
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  <span>保存</span>
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