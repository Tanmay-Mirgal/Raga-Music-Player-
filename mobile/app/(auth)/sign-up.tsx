import { useClerk } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert, Image, ActivityIndicator, StatusBar } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const { client, setActive, loaded } = useClerk();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);

  const onSignUpPress = async () => {
    if (!loaded) return;
    setLoading(true);

    try {
      await client.signUp.create({
        emailAddress,
        password,
      });

      await client.signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!loaded) return;
    setLoading(true);

    try {
      const signUpAttempt = await client.signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        Alert.alert('Verification Alert', 'Verification incomplete.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Error', err.errors?.[0]?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.subtitle}>Sign up to start listening.</Text>
      </View>

      {!pendingVerification ? (
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Email address</Text>
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
            placeholder="Create a password..."
            placeholderTextColor="#7A7A7A"
            secureTextEntry={true}
            onChangeText={(val) => setPassword(val)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            style={[styles.input, passwordFocused && styles.inputFocused]}
          />
          
          <TouchableOpacity 
            style={styles.signUpButton} 
            onPress={onSignUpPress}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Verification Code</Text>
          <Text style={styles.helperText}>We've sent a 6-digit code to {emailAddress}</Text>
          <TextInput
            value={code}
            placeholder="Enter verification code..."
            placeholderTextColor="#7A7A7A"
            onChangeText={(val) => setCode(val)}
            onFocus={() => setCodeFocused(true)}
            onBlur={() => setCodeFocused(false)}
            style={[styles.input, codeFocused && styles.inputFocused]}
            keyboardType="number-pad"
          />
          
          <TouchableOpacity 
            style={styles.signUpButton} 
            onPress={onVerifyPress}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.signUpButtonText}>Verify Account</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/sign-in" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Log in</Text>
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
    backgroundColor: '#121212',
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
  helperText: {
    color: '#B3B3B3',
    fontSize: 12,
    marginBottom: 12,
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
    borderColor: '#1DB954',
  },
  signUpButton: {
    backgroundColor: '#1DB954',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#000000',
    fontSize: 15,
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
    color: '#1DB954',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
