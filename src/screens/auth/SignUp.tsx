import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;

interface SignUpScreenProps {
  navigation: SignUpScreenNavigationProp;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();

  const handleSignUp = async () => {
    
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter an email address');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter a password');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert('Success', 'Account created successfully. Please check your email to verify your account.');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error: any) {
      console.error('SignUp error:', error);
      Alert.alert('Sign Up Failed', error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
        <Text>Already have an account? Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
        <Text style={styles.buttonText}>Sign up with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn}>
        <Text style={styles.buttonText}>Sign up with Apple</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  socialButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  link: {
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default SignUpScreen;