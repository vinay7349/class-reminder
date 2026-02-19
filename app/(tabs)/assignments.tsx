import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    sectionId: string;
    createdBy: string;
    creatorName: string;
    timestamp: any;
}

export default function AssignmentsScreen() {
    const { user, role, sectionId } = useUser();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [sending, setSending] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        const q = query(collection(db, "assignments"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));

            // Filter by section
            if (sectionId && (role === 'Student' || role === 'CR')) {
                docs = docs.filter(a => a.sectionId === sectionId);
            }

            setAssignments(docs);
            setLoading(false);
        });

        return unsubscribe;
    }, [sectionId, role]);

    const handleCreateAssignment = async () => {
        if (!title.trim() || !description.trim() || !dueDate.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setSending(true);
        try {
            await addDoc(collection(db, "assignments"), {
                title: title.trim(),
                description: description.trim(),
                dueDate: dueDate.trim(),
                sectionId: sectionId,
                createdBy: user?.uid,
                creatorName: user?.displayName || 'Authorized User',
                timestamp: serverTimestamp(),
            });
            setShowModal(false);
            setTitle('');
            setDescription('');
            setDueDate('');
            Alert.alert("Success", "Assignment posted successfully!");
        } catch (error) {
            console.error("Error creating assignment:", error);
            Alert.alert("Error", "Failed to post assignment");
        } finally {
            setSending(false);
        }
    };

    const handleDeleteAssignment = async (id: string) => {
        Alert.alert("Delete", "Are you sure you want to delete this assignment?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, "assignments", id));
                    } catch (error) {
                        console.error("Error deleting assignment:", error);
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Assignments</Text>
                    <Text style={styles.subtitle}>Tasks for your section</Text>
                </View>
                {(role === 'Teacher' || role === 'CR') && (
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={assignments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            {(role === 'Teacher' || (role === 'CR' && item.createdBy === user?.uid)) && (
                                <TouchableOpacity onPress={() => handleDeleteAssignment(item.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.cardDescription}>{item.description}</Text>
                        <View style={styles.cardFooter}>
                            <View style={styles.footerItem}>
                                <Ionicons name="calendar-outline" size={14} color="#007AFF" />
                                <Text style={styles.footerText}>Due: {item.dueDate}</Text>
                            </View>
                            <View style={styles.footerItem}>
                                <Ionicons name="person-outline" size={14} color="#666" />
                                <Text style={styles.footerText}>{item.creatorName}</Text>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>No assignments yet.</Text>
                    </View>
                }
            />

            <Modal visible={showModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Assignment</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            placeholder="Description"
                            multiline
                            numberOfLines={4}
                            value={description}
                            onChangeText={setDescription}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Due Date (e.g. 25th May)"
                            value={dueDate}
                            onChangeText={setDueDate}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sendBtn}
                                onPress={handleCreateAssignment}
                                disabled={sending}
                            >
                                {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendBtnText}>Post Task</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: 60,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#007AFF',
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
    },
    cardDescription: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        color: '#999',
        fontSize: 16,
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    sendBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#007AFF',
    },
    cancelBtnText: {
        color: '#666',
        fontWeight: '600',
    },
    sendBtnText: {
        color: '#FFF',
        fontWeight: '700',
    },
});
