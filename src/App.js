import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Save, X, User, Settings, Trash2 } from 'lucide-react';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  where, 
  getDocs
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const FirebaseShiftManager = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState([]);
  const [userRole, setUserRole] = useState('staff');
  const [showModal, setShowModal] = useState(false);
  const [showStaffEdit, setShowStaffEdit] = useState(false);
  const [showHolidayEdit, setShowHolidayEdit] = useState(false);
  const [selectedShift, setSelectedShift] = useState({
    staffId: '1',
    date: '',
    timeType: 'morning',
    notes: ''
  });
  const [staff, setStaff] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaffId, setCurrentStaffId] = useState('1');
  const [customHolidays, setCustomHolidays] = useState({});
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [editedStaffNames, setEditedStaffNames] = useState({});
  const [deletedShifts, setDeletedShifts] = useState([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // デフォルトスタッフデータ
  const defaultStaff = [
    { id: '1', name: '半田 泉', color: '#3B82F6' },
    { id: '2', name: '新島 美由莉', color: '#10B981' },
    { id: '3', name: '戸澤 悠子', color: '#F59E0B' },
    { id: '4', name: '菊地 舞美', color: '#EF4444' },
    { id: '5', name: '尾形 彩夏', color: '#8B5CF6' },
    { id: '6', name: '丸尾 美々', color: '#EC4899' },
    { id: '7', name: '村上 悠樹', color: '#06B6D4' },
    { id: '8', name: '高島 美樹', color: '#84CC16' }
  ];

  // デフォルト祝日
  const defaultHolidays = {
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

  const allHolidays = { ...defaultHolidays, ...customHolidays };

  const timeTypes = {
    morning: { label: '午前', start: '08:30', end: '12:30' },
    afternoon: { label: '午後', start: '13:00', end: '17:30' },
    fullday: { label: '終日', start: '08:30', end: '17:30' }
  };

  // Firebase初期化とリアルタイム同期
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 認証状態の監視
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUser(user);
            setIsLoading(false);
          } else {
            // 匿名認証
            const userCredential = await signInAnonymously(auth);
            setUser(userCredential.user);
            setIsLoading(false);
          }
        });

        return unsubscribeAuth;
      } catch (error) {
        console.error('認証エラー:', error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // スタッフデータの初期化とリアルタイム同期
  useEffect(() => {
    if (!user) return;

    // スタッフデータの同期
    const unsubscribeStaff = onSnapshot(
      query(collection(db, 'staff'), orderBy('name')),
      (snapshot) => {
        if (snapshot.empty) {
          // 初回データ投入
          defaultStaff.forEach(async (member) => {
            await addDoc(collection(db, 'staff'), member);
          });
        } else {
          const staffData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setStaff(staffData);
        }
      },
      (error) => {
        console.error('スタッフデータ取得エラー:', error);
      }
    );

    // シフトデータの同期
    const unsubscribeShifts = onSnapshot(
      query(collection(db, 'shifts'), orderBy('date')),
      (snapshot) => {
        const shiftsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setShifts(shiftsData);
      },
      (error) => {
        console.error('シフトデータ取得エラー:', error);
      }
    );

    // カスタム休日の同期
    const unsubscribeHolidays = onSnapshot(
      collection(db, 'customHolidays'),
      (snapshot) => {
        const holidaysData = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          holidaysData[data.date] = data.name;
        });
        setCustomHolidays(holidaysData);
      },
      (error) => {
        console.error('休日データ取得エラー:', error);
      }
    );

    return () => {
      unsubscribeStaff();
      unsubscribeShifts();
      unsubscribeHolidays();
    };
  }, [user]);

  useEffect(() => {
    // スタッフデータが更新されたら、編集用stateも同期
    const names = {};
    staff.forEach(member => {
      names[member.id] = member.name;
    });
    setEditedStaffNames(names);
  }, [staff]);

  const getDeadline = (date) => {
    return new Date(date.getFullYear(), date.getMonth() - 1, 26);
  };

  const canSubmit = () => {
    const deadline = getDeadline(currentDate);
    return new Date() <= deadline || userRole === 'admin';
  };

  // 日付を「YYYY-MM-DD」形式で正規化（ローカルタイムゾーンの影響を受けない）
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDateInfo = (date) => {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();
    
    if (allHolidays[dateStr]) {
      return { type: 'holiday', name: allHolidays[dateStr], bgColor: 'bg-red-50', textColor: 'text-red-600' };
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
    const startDay = firstDay.getDay(); // 0:日曜, 1:月曜, ...
    const days = [];

    // 前月分の日付を正確に埋める
    if (startDay !== 0) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDay - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonthLastDay - i),
          isCurrentMonth: false
        });
      }
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

  // Firebase操作関数
  const addShiftToFirestore = async (shiftData) => {
    try {
      await addDoc(collection(db, 'shifts'), {
        ...shiftData,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      console.log('シフト追加成功');
    } catch (error) {
      console.error('シフト追加エラー:', error);
      alert('シフト追加に失敗しました');
    }
  };

  const removeShiftFromFirestore = async (shiftId) => {
    try {
      // 削除前にシフトデータを取得
      const shiftToDelete = shifts.find(shift => shift.id === shiftId);
      if (shiftToDelete) {
        setDeletedShifts(prev => [
          ...prev.filter(s => s.id !== shiftToDelete.id),
          {
            ...shiftToDelete,
            deletedAt: new Date().toISOString(),
            deletedBy: user.uid
          }
        ]);
      }
      await deleteDoc(doc(db, 'shifts', shiftId));
      console.log('シフト削除成功');
    } catch (error) {
      console.error('シフト削除エラー:', error);
      alert('シフト削除に失敗しました');
    }
  };

  const updateStaffInFirestore = async (staffId, newName) => {
    try {
      await updateDoc(doc(db, 'staff', staffId), { 
        name: newName,
        updatedAt: new Date().toISOString()
      });
      console.log('スタッフ更新成功');
    } catch (error) {
      console.error('スタッフ更新エラー:', error);
      alert('スタッフ更新に失敗しました');
    }
  };

  const addCustomHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('日付と休日名を入力してください');
      return;
    }

    try {
      await addDoc(collection(db, 'customHolidays'), {
        ...newHoliday,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      setNewHoliday({ date: '', name: '' });
      console.log('カスタム休日追加成功');
    } catch (error) {
      console.error('休日追加エラー:', error);
      alert('休日追加に失敗しました');
    }
  };

  const restoreShift = async (deletedShift) => {
    try {
      // すでに同じ日・スタッフ・時間帯のシフトが存在するかチェック
      const exists = shifts.some(
        s =>
          s.date === deletedShift.date &&
          s.staffId === deletedShift.staffId &&
          s.timeType === deletedShift.timeType
      );
      if (exists) {
        alert('同じスタッフ・日付・時間帯のシフトが既に存在します。復元できません。');
        return;
      }
      // 削除されたシフトを復元
      const { deletedAt, deletedBy, ...shiftData } = deletedShift;
      const docRef = await addDoc(collection(db, 'shifts'), {
        ...shiftData,
        restoredAt: new Date().toISOString(),
        restoredBy: user.uid
      });
      // 新しいIDでdeletedShiftsの該当データを更新
      setDeletedShifts(prev => prev.map(shift =>
        shift.id === deletedShift.id ? { ...shift, id: docRef.id } : shift
      ));
      // 削除履歴から削除
      setDeletedShifts(prev => prev.filter(shift => shift.id !== docRef.id));
      console.log('シフト復元成功');
    } catch (error) {
      console.error('シフト復元エラー:', error);
      alert('シフト復元に失敗しました');
    }
  };

  const removeCustomHoliday = async (date) => {
    try {
      // 該当する休日ドキュメントを検索して削除
      const q = query(collection(db, 'customHolidays'), where('date', '==', date));
      const snapshot = await getDocs(q);
      
      snapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      
      console.log('カスタム休日削除成功');
    } catch (error) {
      console.error('休日削除エラー:', error);
      alert('休日削除に失敗しました');
    }
  };

  const handleQuickAdd = async (date, timeType) => {
    // 管理者の場合は期限チェックをスキップ
    if (userRole === 'staff' && !canSubmit()) {
      alert('希望提出期限が過ぎています');
      return;
    }

    const dateStr = formatDate(date);
    const existing = shifts.find(s => 
      s.date === dateStr && 
      s.staffId === currentStaffId && 
      s.timeType === timeType
    );

    if (existing) {
      await removeShiftFromFirestore(existing.id);
    } else {
      const newShift = {
        staffId: currentStaffId,
        date: dateStr,
        timeType: timeType,
        notes: `${timeTypes[timeType].label}勤務`,
        status: 'requested'
      };
      await addShiftToFirestore(newShift);
    }
  };

  const handleDetailAdd = async () => {
    if (!selectedShift.date) {
      alert('日付を選択してください');
      return;
    }

    // 管理者の場合は期限チェックをスキップ
    if (userRole === 'staff' && !canSubmit()) {
      alert('希望提出期限が過ぎています');
      return;
    }

    const newShift = {
      ...selectedShift,
      status: 'requested'
    };
    
    await addShiftToFirestore(newShift);
    setShowModal(false);
    setSelectedShift({
      staffId: currentStaffId,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Firebase接続中...</div>
      </div>
    );
  }

  const days = getCalendarDays();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">シフト管理</h1>
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

            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => setShowHolidayEdit(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>休日管理</span>
                </button>
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>削除履歴 ({deletedShifts.length})</span>
                </button>
              </>
            )}
          </div>
        </div>



        {(userRole === 'staff' || userRole === 'admin') && (
          <div className={`p-4 rounded-lg border mb-6 ${
            userRole === 'admin' ? 'bg-green-50 border-green-200' : 
            canSubmit() ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm text-blue-700 mr-2">
                  {userRole === 'admin' ? '操作対象スタッフ:' : 'あなたのスタッフ名:'}
                </label>
                <select
                  value={currentStaffId}
                  onChange={(e) => setCurrentStaffId(e.target.value)}
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
                <strong>選択中:</strong> {getStaffName(currentStaffId)}
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
          {!canSubmit() && userRole === 'admin' && (
            <p className="text-sm text-green-600 mt-1">
              ✅ 管理者権限により、期限を過ぎてもシフトの追加・変更が可能です
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
              スタッフ
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
                    value={editedStaffNames[member.id] || ''}
                    onChange={(e) => setEditedStaffNames({ ...editedStaffNames, [member.id]: e.target.value })}
                    className="text-sm font-medium px-2 py-1 border rounded"
                    onBlur={(e) => {
                      if (member.name !== editedStaffNames[member.id]) {
                        updateStaffInFirestore(member.id, editedStaffNames[member.id]);
                      }
                    }}
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
                      <span className="text-xs bg-red-600 text-white px-1 rounded">
                        {customHolidays[formatDate(day.date)] ? 'カ' : '祝'}
                      </span>
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
                    day.isCurrentMonth && (userRole === 'admin' || (canSubmit() && userRole === 'staff'))
                      ? 'cursor-pointer hover:bg-blue-100'
                      : ''
                  }`}
                  onClick={() => {
                    if (day.isCurrentMonth && (userRole === 'admin' || (canSubmit() && userRole === 'staff'))) {
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
                        className="text-xs p-1 rounded border-2 relative group"
                        style={{ 
                          backgroundColor: 'white',
                          borderColor: getStaffColor(shift.staffId)
                        }}
                      >
                        <div className="font-medium">{getStaffName(shift.staffId)}</div>
                        {(userRole === 'admin' || (userRole === 'staff' && shift.staffId === currentStaffId && canSubmit())) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('このシフトを削除しますか？')) {
                                removeShiftFromFirestore(shift.id);
                              }
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                            title="削除"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div 
                  className={`min-h-12 p-1 ${
                    day.isCurrentMonth && (userRole === 'admin' || (canSubmit() && userRole === 'staff'))
                      ? 'cursor-pointer hover:bg-blue-100'
                      : ''
                  }`}
                  onClick={() => {
                    if (day.isCurrentMonth && (userRole === 'admin' || (canSubmit() && userRole === 'staff'))) {
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
                        className="text-xs p-1 rounded border-2 relative group"
                        style={{ 
                          backgroundColor: 'white',
                          borderColor: getStaffColor(shift.staffId)
                        }}
                      >
                        <div className="font-medium">{getStaffName(shift.staffId)}</div>
                        {(userRole === 'admin' || (userRole === 'staff' && shift.staffId === currentStaffId && canSubmit())) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('このシフトを削除しますか？')) {
                                removeShiftFromFirestore(shift.id);
                              }
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                            title="削除"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 休日管理モーダル */}
        {showHolidayEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">休日管理</h3>
                <button
                  onClick={() => setShowHolidayEdit(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">カスタム休日追加</h4>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="休日名（例：病院創立記念日）"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                    <button
                      onClick={addCustomHoliday}
                      className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                    >
                      追加
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">設定済みカスタム休日</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Object.entries(customHolidays).map(([date, name]) => (
                      <div key={date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="text-sm font-medium">{name}</div>
                          <div className="text-xs text-gray-500">{date}</div>
                        </div>
                        <button
                          onClick={() => removeCustomHoliday(date)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {Object.keys(customHolidays).length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">
                        カスタム休日はありません
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 削除履歴復元モーダル */}
        {showRestoreModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">削除履歴</h3>
                <button
                  onClick={() => setShowRestoreModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {deletedShifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    削除されたシフトはありません
                  </div>
                ) : (
                  deletedShifts.map((deletedShift) => (
                    <div key={deletedShift.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">
                          {getStaffName(deletedShift.staffId)} - {deletedShift.date}
                        </div>
                        <button
                          onClick={() => restoreShift(deletedShift)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          復元
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">
                        {timeTypes[deletedShift.timeType]?.label} - {deletedShift.notes}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        削除日時: {new Date(deletedShift.deletedAt).toLocaleString('ja-JP')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

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
                 className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
               >
                 保存（リアルタイム反映）
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   </div>
 );
};

export default FirebaseShiftManager;