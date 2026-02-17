import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Ionicons } from '@expo/vector-icons';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            // Success is handled by onAuthStateChanged in _layout.tsx
        } catch (error: any) {
            console.error(error);
            let message = "Admin login failed.";
            if (error.code === 'auth/configuration-not-found') {
                message = "Email/Password authentication is not enabled in your Firebase Console. Please go to Authentication -> Sign-in method and enable it.";
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                message = "Invalid admin credentials";
            }
            Alert.alert("Login Error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Admin Portal</Text>
                    <Text style={styles.subtitle}>Management Access Only</Text>
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Admin Email"
                            placeholderTextColor="#666"
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#666"
                            style={styles.input}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.buttonText}>Authorize Access</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 24,
        padding: 8,
    },
    header: {
        marginBottom: 48,
        alignItems: 'center',
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#007AFF',
        marginTop: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        gap: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 18,
        fontSize: 16,
        color: '#FFFFFF',
    },
    button: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '800',
    },
});
