import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

interface Message {
    id: string;
    content: string;
    senderName: string;
    senderRole: string;
    timestamp: any;
}

export default function MessagesScreen() {
    const { sectionId, loading: userLoading } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, "messages"),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as any[];

            // Filter by section or global messages
            if (sectionId) {
                data = data.filter(msg => !msg.sectionId || msg.sectionId === sectionId || msg.global === true);
            }

            setMessages(data);
            setLoading(false);
            setRefreshing(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
            setRefreshing(false);
        });

        return unsubscribe;
    }, [sectionId]);

    const onRefresh = () => {
        setRefreshing(true);
        // onSnapshot will automatically update, but we can set refreshing to true for UI feel
    };

    if (loading || userLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>Latest updates from CRs & Teachers</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.messageCard}>
                        <View style={styles.messageHeader}>
                            <View style={[styles.roleBadge, { backgroundColor: item.senderRole === 'Teacher' ? '#5856D6' : '#FF9500' }]}>
                                <Text style={styles.roleText}>{item.senderRole}</Text>
                            </View>
                            <Text style={styles.senderName}>{item.senderName}</Text>
                            <Text style={styles.timeText}>
                                {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </Text>
                        </View>
                        <Text style={styles.content}>{item.content}</Text>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>No messages yet.</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />
                }
            />
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
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    messageCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    roleText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    senderName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        flex: 1,
    },
    timeText: {
        fontSize: 12,
        color: '#999',
    },
    content: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
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
});
