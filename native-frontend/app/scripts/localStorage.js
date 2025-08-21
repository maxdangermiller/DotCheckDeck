import AsyncStorage from '@react-native-async-storage/async-storage';

const setItem = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
        console.log('Data stored successfully');
    } catch (error) {
        console.error('Error storing data', error);
    }
};

const getItem = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key);
    if (value !== null) {
        console.log('Retrieved value', value);
        return value;
    }
    } catch (error) {
        console.error('Error retrieving data', error);
    }
};

const removeValue = async (key) => {
  try {
    await AsyncStorage.removeItem(key)
  } catch(e) {
    // remove error
  }

  console.log('Done.')
};

export default {
    setItem,
    getItem,
    removeValue
};