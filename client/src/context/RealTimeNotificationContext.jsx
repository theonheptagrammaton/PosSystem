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
            // For notification center, we need all users of the tenant to call them
            // We use the existing users endpoint
            const res = await api.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users for notification:', err);
        }
    }, []);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        if (!user || !token) return;

        const newSocket = io(api.defaults.baseURL, {
            query: { tenantId: user.tenant_id }
        });

        newSocket.on('new_notification', (notification) => {
            // Check if notification is for this user, for all waiters, or if user is admin (sees all)
            const isForMe = notification.to_user_id === user.id;
            const isWaiterCall = notification.type === 'CALL_WAITER' && (user.role === 'waiter' || user.role === 'admin');
            const isAdmin = user.role === 'admin';

            if (isForMe || isWaiterCall || isAdmin) {
                setNotifications(prev => [notification, ...prev]);
                audioRef.current.play().catch(e => console.error('Audio play error:', e));
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
