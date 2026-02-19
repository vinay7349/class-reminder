import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AdminPanel() {
    const [sections, setSections] = useState<{ id: string, name: string }[]>([]);
    const [newSectionName, setNewSectionName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Bulk Upload State
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkJson, setBulkJson] = useState('');
    const [bulkSectionId, setBulkSectionId] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch sections
            const secSnap = await getDocs(collection(db, "sections"));
            setSections(secSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

            // Fetch users
            const userSnap = await getDocs(collection(db, "users"));
            setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // Fetch history
            const logsSnap = await getDocs(query(collection(db, "history"), orderBy("timestamp", "desc"), limit(20)));
            setHistory(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSection = async () => {
        if (!newSectionName.trim()) return;
        setCreating(true);
        try {
            const docRef = await addDoc(collection(db, "sections"), {
                name: newSectionName.trim(),
                createdAt: serverTimestamp()
            });
            setSections([...sections, { id: docRef.id, name: newSectionName.trim() }]);
            setNewSectionName('');
            Alert.alert("Success", "Section created successfully!");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to create section");
        } finally {
            setCreating(false);
        }
    };

    const handleBulkUpload = async () => {
        if (!bulkJson.trim() || !bulkSectionId) {
            Alert.alert("Error", "Please provide JSON data and select a section");
            return;
        }

        setUploading(true);
        try {
            const data = JSON.parse(bulkJson);
            if (!Array.isArray(data)) throw new Error("JSON must be an array of schedule items");

            const batch = writeBatch(db);
            const sectionName = sections.find(s => s.id === bulkSectionId)?.name || 'Unknown';

            data.forEach((item: any) => {
                const newDocRef = doc(collection(db, "timetables"));
                batch.set(newDocRef, {
                    ...item,
                    sectionId: bulkSectionId,
                    sectionName: sectionName,
                    createdAt: new Date().toISOString(),
                    status: 'Pending'
                });
            });

            await batch.commit();

            // Log the action
            await addDoc(collection(db, "history"), {
                action: `Bulk uploaded ${data.length} schedule items for ${sectionName}`,
                user: 'Admin',
                timestamp: serverTimestamp()
            });

            Alert.alert("Success", `Uploaded ${data.length} schedule entries!`);
            setShowBulkModal(false);
            setBulkJson('');
        } catch (error: any) {
            console.error(error);
            Alert.alert("Upload Error", error.message || "Invalid JSON format");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading Admin Controls...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.title}>Admin Panel</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Manage Sections</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. CSE - 3rd Year"
                        value={newSectionName}
                        onChangeText={setNewSectionName}
                    />
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={handleCreateSection}
                        disabled={creating}
                    >
                        {creating ? <ActivityIndicator color="#FFF" /> : <Ionicons name="add" size={24} color="#FFF" />}
                    </TouchableOpacity>
                </View>
                <View style={styles.sectionsList}>
                    {sections.map(s => (
                        <View key={s.id} style={styles.sectionItem}>
                            <Text style={styles.sectionItemText}>{s.name}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Weekly Planning</Text>
                <Text style={styles.helperText}>Configure a full week's schedule for a specific section.</Text>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => setShowBulkModal(true)}
                >
                    <Ionicons name="calendar-outline" size={32} color="#007AFF" />
                    <View>
                        <Text style={styles.cardTitle}>Bulk Upload Schedule</Text>
                        <Text style={styles.cardSubtitle}>Set Monday to Friday at once</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </View>

            <Modal visible={showBulkModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Weekly Bulk Upload</Text>
                        <Text style={styles.helperText}>Select Section:</Text>
                        <View style={styles.sectionsList}>
                            {sections.map(s => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.sectionItem, bulkSectionId === s.id && { backgroundColor: '#007AFF', borderColor: '#007AFF' }]}
                                    onPress={() => setBulkSectionId(s.id)}
                                >
                                    <Text style={[styles.sectionItemText, bulkSectionId === s.id && { color: '#FFF' }]}>{s.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.input, { height: 180, textAlignVertical: 'top', marginTop: 16 }]}
                            placeholder='[{"subject": "Maths", "startTime": "09:00 AM", "endTime": "10:00 AM", "teacherName": "Dr. Smith", "classroom": "Room 101"}]'
                            multiline
                            value={bulkJson}
                            onChangeText={setBulkJson}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBulkModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: '#34C759' }]}
                                onPress={handleBulkUpload}
                                disabled={uploading}
                            >
                                {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendBtnText}>Commit Upload</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>User Management</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{users.length}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#34C759' }]}>{users.filter(u => u.role === 'Teacher').length}</Text>
                        <Text style={styles.statLabel}>Teachers</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#AF52DE' }]}>{users.filter(u => u.role === 'CR').length}</Text>
                        <Text style={styles.statLabel}>CRs</Text>
                    </View>
                </View>
                <View style={styles.userList}>
                    {users.slice(0, 5).map(u => (
                        <View key={u.id} style={styles.userItem}>
                            <View>
                                <Text style={styles.userName}>{u.name}</Text>
                                <Text style={styles.userSubText}>{u.role} • {u.sectionName || 'N/A'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#CCC" />
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity Log</Text>
                {history.length === 0 ? (
                    <Text style={styles.emptyText}>No activity recorded yet.</Text>
                ) : (
                    history.map(item => (
                        <View key={item.id} style={styles.logItem}>
                            <View style={styles.logDot} />
                            <View>
                                <Text style={styles.logText}>{item.action}</Text>
                                <Text style={styles.logSubText}>{item.user} • {item.timestamp?.toDate().toLocaleTimeString()}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        padding: 24,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    addBtn: {
        backgroundColor: '#007AFF',
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sectionItem: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    sectionItemText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    actionCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    statLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    userList: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        overflow: 'hidden',
    },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F9FA',
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    userSubText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    },
    logItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    logDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
        marginTop: 6,
    },
    logText: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    logSubText: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    sendBtn: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#666',
        fontWeight: '700',
    },
    sendBtnText: {
        color: '#FFF',
        fontWeight: '700',
    },
});
