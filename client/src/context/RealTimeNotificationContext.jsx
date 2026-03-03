import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import api from '../api';
import zilSes from '../assets/zil.mp3';

const RealTimeNotificationContext = createContext();

export function RealTimeNotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const audioRef = useRef(new Audio(zilSes));

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users for notification:', err);
        }
    }, []);

    // Function to play sound reliably
    const playZil = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => {
                console.warn('Audio play failed (waiting for interaction):', e);
            });
        }
    }, []);

    // Unlock audio context on first interaction (silently, no sound)
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const businessRoles = ['admin', 'waiter', 'kitchen', 'cashier', 'pos'];
        if (!user || !businessRoles.includes(user.role)) return;

        const unlock = () => {
            if (audioRef.current) {
                audioRef.current.volume = 0;
                audioRef.current.play().then(() => {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current.volume = 1;
                }).catch(() => {});
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };
    }, []);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        if (!user || !token) return;

        const newSocket = io(api.defaults.baseURL, {
            query: { tenantId: user.tenant_id }
        });

        // 1. Listen for manual notifications (User to User, QR to Waiter)
        newSocket.on('new_notification', (notification) => {
            const isForMe = notification.to_user_id === user.id;
            const isWaiterCall = notification.type === 'CALL_WAITER' && (user.role === 'waiter' || user.role === 'admin');
            const isAdmin = user.role === 'admin';

            if (isForMe || isWaiterCall || isAdmin) {
                setNotifications(prev => [notification, ...prev]);
                playZil();
            }
        });

        // 2. Listen for new orders (Notify POS/Kitchen)
        newSocket.on('new_order', (data) => {
            // Play sound for approvals or new pending orders
            const isAdminOrKitchen = user.role === 'admin' || user.role === 'kitchen';
            if (isAdminOrKitchen && (data.status === 'WAITING_APPROVAL' || data.status === 'PENDING')) {
                playZil();
            }
        });

        // 3. Listen for order ready (Notify Waiter/POS)
        newSocket.on('order_ready', () => {
            const isWaiterOrAdmin = user.role === 'waiter' || user.role === 'admin';
            if (isWaiterOrAdmin) {
                playZil();
            }
        });

        setSocket(newSocket);
        fetchNotifications();
        fetchUsers();

        return () => newSocket.close();
    }, [fetchNotifications, fetchUsers]);

    const sendNotification = async (payload) => {
        try {
            await api.post('/api/notifications', payload);
        } catch (err) {
            console.error('Error sending notification:', err);
        }
    };

    const updateNotificationStatus = async (id, status) => {
        try {
            await api.put(`/api/notifications/${id}/status`, { status });
            if (status === 'COMPLETED') {
                setNotifications(prev => prev.filter(n => n.id !== id));
            } else {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, status } : n));
            }
        } catch (err) {
            console.error('Error updating notification status:', err);
        }
    };

    return (
        <RealTimeNotificationContext.Provider value={{ 
            notifications, 
            users, 
            sendNotification, 
            updateNotificationStatus,
            socket 
        }}>
            {children}
        </RealTimeNotificationContext.Provider>
    );
}

export function useRealTimeNotifications() {
    return useContext(RealTimeNotificationContext);
}
