import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface UserContextType {
    user: User | null;
    role: string | null;
    loading: boolean;
    refreshRole: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    role: null,
    loading: true,
    refreshRole: async () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRole = async (uid: string) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                setRole(userDoc.data().role);
            } else {
                setRole(null);
            }
        } catch (error) {
            console.error("Error fetching role:", error);
            setRole(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch role in background, don't block the main loading state if possible
                // But for initial load, we might want to wait if we're on a protected route
                await fetchRole(currentUser.uid);
            } else {
                setRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const refreshRole = async () => {
        if (user) await fetchRole(user.uid);
    };

    return (
        <UserContext.Provider value={{ user, role, loading, refreshRole }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
