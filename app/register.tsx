import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';

const SECRET_ADMIN_CODE = "MASTER2024"; // The "Admin Password" you requested

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'Teacher' | 'CR' | 'Admin' | 'Student'>('Student');
    const [sectionId, setSectionId] = useState('');
    const [sectionName, setSectionName] = useState('');
    const [sections, setSections] = useState<{ id: string, name: string }[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<{ subject: string, sectionId: string, sectionName: string }[]>([]);
    const [newSubject, setNewSubject] = useState('');
    const [newSubjectSection, setNewSubjectSection] = useState('');
    const [adminCode, setAdminCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingSections, setFetchingSections] = useState(true);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "sections"));
                const sectionsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setSections(sectionsList);

                // If no sections exist, create a default one for now
                if (sectionsList.length === 0) {
                    const defaultSection = { name: "Default Section", id: "default-section" };
                    setSections([defaultSection]);
                }
            } catch (error) {
                console.error("Error fetching sections:", error);
                // Fallback
                setSections([{ id: 'default', name: 'General' }]);
            } finally {
                setFetchingSections(false);
            }
        };
        fetchSections();
    }, []);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (role === 'Admin' && adminCode !== SECRET_ADMIN_CODE) {
            Alert.alert("Forbidden", "Invalid Secret Admin Code");
            return;
        }

        if ((role === 'Student' || role === 'CR') && !sectionId) {
            Alert.alert("Error", "Please select your section");
            return;
        }

        if (role === 'Teacher' && teacherSubjects.length === 0) {
            Alert.alert("Error", "Please add at least one subject and section");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                name,
                email: email.trim(),
                role,
                sectionId: (role === 'Student' || role === 'CR') ? sectionId : null,
                sectionName: (role === 'Student' || role === 'CR') ? sectionName : null,
                teacherSubjects: role === 'Teacher' ? teacherSubjects : [],
                createdAt: new Date().toISOString()
            });

            Alert.alert("Success", "Account created successfully!", [
                { text: "OK", onPress: () => router.replace('/login') }
            ]);
        } catch (error: any) {
            console.error(error);
            let message = error.message;
            if (error.code === 'auth/configuration-not-found') {
                message = "Email/Password authentication is not enabled in your Firebase Console. Please go to Authentication -> Sign-in method and enable it.";
            } else if (error.code === 'auth/email-already-in-use') {
                message = "This email is already registered.";
            } else if (error.code === 'auth/invalid-email') {
                message = "Invalid email format.";
            } else if (error.code === 'auth/weak-password') {
                message = "Password should be at least 6 characters.";
            }
            Alert.alert("Registration Error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join your college network</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        placeholder="Full Name"
                        placeholderTextColor="#999"
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        placeholder="Email Address"
                        placeholderTextColor="#999"
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#999"
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Text style={styles.label}>Select Your Role</Text>
                    <View style={styles.roleContainer}>
                        {(['Student', 'CR', 'Teacher', 'Admin'] as const).map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[styles.roleButton, role === r && styles.roleButtonActive]}
                                onPress={() => setRole(r)}
                            >
                                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {role !== 'Admin' && role !== 'Teacher' && (
                        <View style={styles.sectionPicker}>
                            <Text style={styles.label}>Select Your Section</Text>
                            {fetchingSections ? (
                                <ActivityIndicator size="small" color="#007AFF" />
                            ) : (
                                <View style={styles.chipsContainer}>
                                    {sections.map((s) => (
                                        <TouchableOpacity
                                            key={s.id}
                                            style={[styles.chip, sectionId === s.id && styles.chipActive]}
                                            onPress={() => {
                                                setSectionId(s.id);
                                                setSectionName(s.name);
                                            }}
                                        >
                                            <Text style={[styles.chipText, sectionId === s.id && styles.chipTextActive]}>{s.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {role === 'Teacher' && (
                        <View style={styles.teacherSection}>
                            <Text style={styles.label}>Your Subjects & Sections</Text>
                            <View style={styles.addSubjectRow}>
                                <TextInput
                                    placeholder="Subject (e.g. Maths)"
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    value={newSubject}
                                    onChangeText={setNewSubject}
                                />
                                <TouchableOpacity
                                    style={styles.addBtn}
                                    onPress={() => {
                                        if (newSubject && newSubjectSection) {
                                            const section = sections.find(s => s.id === newSubjectSection);
                                            setTeacherSubjects([...teacherSubjects, {
                                                subject: newSubject,
                                                sectionId: newSubjectSection,
                                                sectionName: section?.name || 'Unknown'
                                            }]);
                                            setNewSubject('');
                                            setNewSubjectSection('');
                                        }
                                    }}
                                >
                                    <Ionicons name="add" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.chipsContainer}>
                                {sections.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.chip, newSubjectSection === s.id && styles.chipActive]}
                                        onPress={() => setNewSubjectSection(s.id)}
                                    >
                                        <Text style={[styles.chipText, newSubjectSection === s.id && styles.chipTextActive]}>{s.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {teacherSubjects.map((ts, index) => (
                                <View key={index} style={styles.subjectItem}>
                                    <Text style={styles.subjectItemText}>{ts.subject} - {ts.sectionName}</Text>
                                    <TouchableOpacity onPress={() => setTeacherSubjects(teacherSubjects.filter((_, i) => i !== index))}>
                                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {role === 'Admin' && (
                        <View style={styles.adminSection}>
                            <Text style={styles.adminLabel}>Secret Admin Code</Text>
                            <TextInput
                                placeholder="Enter Code"
                                placeholderTextColor="#999"
                                style={[styles.input, styles.adminInput]}
                                secureTextEntry
                                value={adminCode}
                                onChangeText={setAdminCode}
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
    },
    backButton: {
        marginBottom: 20,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 12,
        fontSize: 16,
        color: '#1A1A1A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginTop: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    roleButton: {
        flex: 1,
        backgroundColor: '#E9ECEF',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: '#007AFF',
    },
    roleText: {
        color: '#666',
        fontWeight: '600',
    },
    roleTextActive: {
        color: '#FFFFFF',
    },
    adminSection: {
        marginTop: 8,
        padding: 16,
        backgroundColor: '#FFF0F0',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFC1C1',
    },
    adminLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D00',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    adminInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FFC1C1',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionPicker: {
        marginTop: 8,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        backgroundColor: '#E9ECEF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chipActive: {
        backgroundColor: '#007AFF',
    },
    chipText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#FFF',
    },
    teacherSection: {
        marginTop: 8,
        gap: 12,
    },
    addSubjectRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    addBtn: {
        backgroundColor: '#34C759',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    subjectItemText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
});
