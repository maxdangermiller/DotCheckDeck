import { Text, View,  StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import NavBar from './NavBar';

export default function Index() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} >
        <NavBar loggedIn={false} logout={() => {}} isAdminAuthorized={false}/>
        <Text style={styles.text}>ABOUT</Text>
        <Link href="/" style={styles.text}>Go HOME</Link>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(33, 37, 41, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});
