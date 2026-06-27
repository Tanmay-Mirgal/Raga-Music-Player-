import { useClerk, useOAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert, Image, ActivityIndicator, StatusBar } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { client, setActive, loaded } = useClerk();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const onGoogleSignInPress = React.useCallback(async () => {
    try {
      setGoogleLoading(true);
      const redirectUrl = Linking.createURL('/', { scheme: 'mobile' });
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      Alert.alert('OAuth Error', err.message || 'Google Authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [startOAuthFlow, router]);

  const onSignInPress = React.useCallback(async () => {
    if (!loaded) return;
    setLoading(true);

    try {
      const signInAttempt = await client.signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else {
        Alert.alert('Sign In Info', 'Authentication requires additional steps.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }, [loaded, emailAddress, password, router, setActive, client]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.headerContainer}>
        <View style={styles.logoWrapper}>
          <Image 
            source={require('../../assets/images/riffy_logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Riffy</Text>
        <Text style={styles.subtitle}>Soundscape, unlocked.</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Email or Username</Text>
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter your email..."
          placeholderTextColor="#7A7A7A"
          onChangeText={(val) => setEmailAddress(val)}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          style={[styles.input, emailFocused && styles.inputFocused]}
        />
        
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          value={password}
          placeholder="Enter your password..."
          placeholderTextColor="#7A7A7A"
          secureTextEntry={true}
          onChangeText={(val) => setPassword(val)}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          style={[styles.input, passwordFocused && styles.inputFocused]}
        />
        
        <TouchableOpacity 
          style={styles.signInButton} 
          onPress={onSignInPress}
          disabled={loading || googleLoading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.signInButtonText}>Log In</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={onGoogleSignInPress}
          disabled={loading || googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.googleButtonContent}>
              <Ionicons name="logo-google" size={18} color="#FFFFFF" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>New to Riffy?</Text>
        <Link href="/sign-up" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Create account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    backgroundColor: '#121212', // Solid Spotify dark theme
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 42,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#B3B3B3',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#282828',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 4,
    marginBottom: 20,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#1DB954', // Spotify green border on focus
  },
  signInButton: {
    backgroundColor: '#1DB954', // Spotify Green
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  signInButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#282828',
  },
  dividerText: {
    color: '#B3B3B3',
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7A7A7A',
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  footerText: {
    color: '#B3B3B3',
    fontSize: 13,
  },
  link: {
    color: '#1DB954', // Spotify Green
    fontWeight: 'bold',
    fontSize: 13,
  },
});
