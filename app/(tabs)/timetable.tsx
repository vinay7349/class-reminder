import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

export default function TimetableScreen() {
    const { role, loading } = useUser();
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [subject, setSubject] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [classroom, setClassroom] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const user = auth.currentUser;

    const handleAddEntry = async () => {
        if (!subject || !teacherName || !classroom || !startTime || !endTime) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "timetables"), {
                subject,
                teacherName,
                classroom,
                startTime,
                endTime,
                date,
                status: 'Pending',
                createdAt: new Date().toISOString(),
                createdBy: user?.uid
            });
            Alert.alert("Success", "Timetable entry added successfully!");
            // Reset form
            setSubject('');
            setTeacherName('');
            setClassroom('');
            setStartTime('');
            setEndTime('');
        } catch (error) {
            console.error("Error adding entry:", error);
            Alert.alert("Error", "Failed to add entry");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (role !== 'Admin') {
        return (
            <View style={styles.center}>
                <Ionicons name="lock-closed-outline" size={64} color="#CCC" />
                <Text style={styles.noAccessText}>Only Admins can manage the timetable.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Add Timetable Entry</Text>
            <Text style={styles.subtitle}>Create a new class schedule for students and teachers.</Text>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Subject Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Computer Science"
                        value={subject}
                        onChangeText={setSubject}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teacher Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Dr. Roberts"
                        value={teacherName}
                        onChangeText={setTeacherName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Classroom / Hall</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Lab 404"
                        value={classroom}
                        onChangeText={setClassroom}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Start Time</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10:00 AM"
                            value={startTime}
                            onChangeText={setStartTime}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>End Time</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="11:00 AM"
                            value={endTime}
                            onChangeText={setEndTime}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2024-05-20"
                        value={date}
                        onChangeText={setDate}
                    />
                </View>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddEntry}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Create Entry</Text>
                    )}
                </TouchableOpacity>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        marginBottom: 32,
    },
    form: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F3F4F6',
        padding: 14,
        borderRadius: 10,
        fontSize: 16,
        color: '#1A1A1A',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    noAccessText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
});
