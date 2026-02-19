import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface UserContextType {
    user: User | null;
    role: string | null;
    sectionId: string | null;
    sectionName: string | null;
    loading: boolean;
    roleLoading: boolean;
    refreshRole: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    role: null,
    sectionId: null,
    sectionName: null,
    loading: true,
    roleLoading: false,
    refreshRole: async () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [sectionId, setSectionId] = useState<string | null>(null);
    const [sectionName, setSectionName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [roleLoading, setRoleLoading] = useState(false);

    const fetchRole = async (uid: string) => {
        setRoleLoading(true);
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setRole(data.role);
                setSectionId(data.sectionId || null);
                setSectionName(data.sectionName || null);
            } else {
                setRole(null);
                setSectionId(null);
                setSectionName(null);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setRole(null);
            setSectionId(null);
            setSectionName(null);
        } finally {
            setRoleLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch role in background, don't block the main loading state
                fetchRole(currentUser.uid);
            } else {
                setRole(null);
                setSectionId(null);
                setSectionName(null);
                setRoleLoading(false);
            }
            // Crucial: Set loading to false as soon as we know the auth state
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const refreshRole = async () => {
        if (user) await fetchRole(user.uid);
    };

    return (
        <UserContext.Provider value={{
            user,
            role,
            sectionId,
            sectionName,
            loading,
            roleLoading,
            refreshRole
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
