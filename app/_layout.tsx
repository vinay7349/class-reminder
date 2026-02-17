import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { UserProvider, useUser } from '../context/UserContext';

function RootLayoutNav() {
  const { user, loading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isLoginPage = (segments[0] as string) === 'login' || (segments[0] as string) === 'admin-login' || (segments[0] as string) === 'register';

    if (!user && inAuthGroup) {
      router.replace('/login');
    } else if (user && isLoginPage) {
      router.replace('/(tabs)');
    }
  }, [user, segments, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="register" options={{ gestureEnabled: true }} />
      <Stack.Screen name="admin-login" options={{ gestureEnabled: true }} />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <RootLayoutNav />
    </UserProvider>
  );
}
