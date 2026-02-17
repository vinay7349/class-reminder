import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimetableItem {
    id: string;
    subject: string;
    teacherName: string;
    classroom: string;
    startTime: string;
    endTime: string;
    status: 'Pending' | 'Coming' | 'Not Coming';
}

interface TimetableCardProps {
    item: TimetableItem;
    onConfirm?: (id: string, status: 'Coming' | 'Not Coming') => void;
    showActions?: boolean;
}

export default function TimetableCard({ item, onConfirm, showActions }: TimetableCardProps) {
    const getStatusColor = () => {
        switch (item.status) {
            case 'Coming': return '#34C759';
            case 'Not Coming': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.subjectContainer}>
                    <Text style={styles.subjectText}>{item.subject}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>
                <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
            </View>

            <View style={styles.details}>
                <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.teacherName}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.classroom}</Text>
                </View>
            </View>

            {showActions && item.status === 'Pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => onConfirm?.(item.id, 'Coming')}
                    >
                        <Text style={styles.buttonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => onConfirm?.(item.id, 'Not Coming')}
                    >
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    subjectContainer: {
        flex: 1,
    },
    subjectText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    timeText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    details: {
        flexDirection: 'row',
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
    },
    actions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 16,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#34C759',
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});
