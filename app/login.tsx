import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";


export default function Login() {
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
      let message = "Login failed. Please check your credentials.";
      if (error.code === 'auth/configuration-not-found') {
        message = "Email/Password authentication is not enabled in your Firebase Console. Please go to Authentication -> Sign-in method and enable it.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "Invalid email or password";
      } else if (error.code === 'auth/invalid-email') {
        message = "Invalid email format";
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
        <View style={styles.header}>
          <Text style={styles.title}>College Reminder</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.inputContainer}>
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

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminLink}
            onPress={() => router.push('/admin-login' as any)}
          >
            <Text style={styles.adminLinkText}>Login as Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createAccountLink}
            onPress={() => router.push('/register' as any)}
          >
            <Text style={styles.createAccountText}>Don't have an account? <Text style={{ fontWeight: '800', color: '#007AFF' }}>Create one</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  inputContainer: {
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
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  adminLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  adminLinkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createAccountLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  createAccountText: {
    color: '#666',
    fontSize: 14,
  },
});
