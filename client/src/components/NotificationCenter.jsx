import { useState } from 'react';
import { Bell, User, MessageSquare, X, Check, Clock } from 'lucide-react';
import { useRealTimeNotifications } from '../context/RealTimeNotificationContext';

export default function NotificationCenter() {
    const { notifications, users, sendNotification, updateNotificationStatus } = useRealTimeNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'users'

    const user = JSON.parse(localStorage.getItem('user'));

    const handleCallUser = (targetUser) => {
        sendNotification({
            to_user_id: targetUser.id,
            message: `${user.full_name || user.username} sizi çağırıyor.`,
            type: 'USER_CALL'
        });
        alert(`${targetUser.full_name || targetUser.username} kullanıcısına çağrı gönderildi.`);
    };

    const pendingCount = notifications.filter(n => n.status === 'PENDING').length;

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 bg-black text-white hover:bg-zinc-800 transition-colors border-2 border-white/20"
            >
                <Bell size={20} />
                {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {pendingCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-80 h-full sm:h-[500px] bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[100] flex flex-col">
                    <div className="flex justify-between items-center p-4 bg-black text-white">
                        <span className="text-xs font-black uppercase tracking-widest">BİLDİRİM MERKEZİ</span>
                        <button onClick={() => setIsOpen(false)}><X size={18} /></button>
                    </div>

                    <div className="flex border-b-2 border-black">
                        <button 
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-1 p-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'bg-zinc-100' : 'bg-white'}`}
                        >
                            <MessageSquare size={14} /> BİLDİRİMLER ({notifications.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 p-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-zinc-100' : 'bg-white'}`}
                        >
                            <User size={14} /> KİŞİLER
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'notifications' ? (
                            <div className="divide-y divide-zinc-100">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-400 text-[10px] font-bold uppercase italic">BİLDİRİM YOK</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 ${n.status === 'PENDING' ? 'bg-zinc-50' : 'bg-white'}`}>
                                            <div className="text-[10px] text-zinc-500 font-mono mb-1">
                                                {new Date(n.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-xs font-bold text-black uppercase mb-3 leading-tight">
                                                {n.type === 'CALL_WAITER' ? `MASA ${n.table_no.replace('MASA-', '')} GARSON ÇAĞIRIYOR` : n.message}
                                            </div>
                                            <div className="flex gap-2 font-mono">
                                                <button 
                                                    onClick={() => updateNotificationStatus(n.id, 'COMPLETED')}
                                                    className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white p-2 text-[9px] font-black uppercase hover:bg-green-700"
                                                >
                                                    <Check size={12} /> TAMAMLANDI
                                                </button>
                                                <button 
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 text-white p-2 text-[9px] font-black uppercase hover:bg-black"
                                                >
                                                    <Clock size={12} /> ERTELE
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {users.filter(u => u.id !== user.id).map(u => (
                                    <button 
                                        key={u.id}
                                        onClick={() => handleCallUser(u)}
                                        className="w-full text-left p-4 hover:bg-zinc-50 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-black text-xs uppercase">
                                            {u.username.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black uppercase">{u.full_name || u.username}</div>
                                            <div className="text-[9px] font-mono text-zinc-400 uppercase">{u.role}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
