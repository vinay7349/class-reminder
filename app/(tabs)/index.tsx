import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import TimetableCard from '../../components/TimetableCard';
import { useUser } from '../../context/UserContext';

export default function Dashboard() {
  const { user, role, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        content: message.trim(),
        senderName: user?.displayName || 'Authorized User',
        senderId: user?.uid,
        senderRole: role,
        timestamp: serverTimestamp(),
      });
      setMessage('');
      setShowModal(false);
      Alert.alert("Success", "Message broadcasted to all students!");
    } catch (error) {
      console.error("Error broadcasting message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Fetch timetable entries
    const q = query(collection(db, "timetables"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTimetable(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleConfirmStatus = async (id: string, status: 'Coming' | 'Not Coming') => {
    try {
      await updateDoc(doc(db, "timetables", id), { status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading || userLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const filteredTimetable = role === 'Teacher'
    ? timetable.filter(item => item.teacherName === user?.displayName || item.teacherId === user?.uid)
    : timetable;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {role}</Text>
          <Text style={styles.subGreeting}>Welcome back to your dashboard</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(role === 'CR' || role === 'Teacher') && (
            <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.logoutButton, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="megaphone-outline" size={24} color="#0288D1" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Broadcast Message</Text>
            <Text style={styles.modalSubtitle}>This will be sent to all students and staff.</Text>

            <TextInput
              style={styles.messageInput}
              placeholder="Type your announcement here..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.sendBtn]}
                onPress={handleBroadcast}
                disabled={sending || !message.trim()}
              >
                {sending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.sendBtnText}>Send Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {role === 'Admin' ? 'All Classes' : role === 'Teacher' ? 'Your Schedule' : 'Today\'s Classes'}
        </Text>
      </View>

      <FlatList
        data={filteredTimetable}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TimetableCard
            item={item}
            showActions={role === 'Teacher'}
            onConfirm={handleConfirmStatus}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No classes scheduled for today.</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
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
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
  messageInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  sendBtn: {
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
