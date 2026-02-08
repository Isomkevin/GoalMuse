import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DatePickerModal } from '../components/DatePickerModal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../context/AppStateContext';
import { AppBar } from '../components/AppBar';
import { GoalForm, GOAL_CATEGORIES } from '../components/GoalForm';
import { Icon } from '../components/Icon';
import { copyToPersistentStorage, isLocalFileUri } from '../lib/goalImageStorage';
import { colors } from '../theme/colors';

type ParamList = { AddGoal: { boardId?: string }; AddGoalFromBoard: { boardId: string } };

function getUriFromResult(result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null): string | null {
  if (!result || 'errorCode' in result) return null;
  const r = result as ImagePicker.ImagePickerSuccessResult;
  if (r.canceled) return null;
  const uri = r.assets?.[0]?.uri;
  return uri && typeof uri === 'string' ? uri : null;
}

export function AddGoalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'AddGoal' | 'AddGoalFromBoard'>>();
  const boardId = route.params?.boardId;
  const { addGoal } = useAppState();
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<string>(GOAL_CATEGORIES[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    addGoal({
      boardId: boardId || 'b1',
      title: title.trim(),
      imageUri: imageUri.trim() || undefined,
      description: description.trim() || undefined,
      targetDate: targetDate.trim() || undefined,
      priority: category.trim() || undefined,
      completed: false,
    });
    navigation.goBack();
  };

  const datePickerValue = (() => {
    const d = targetDate ? new Date(targetDate) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  })();
  const handleDateConfirm = (date: Date) => {
    setTargetDate(date.toISOString().slice(0, 10));
    setShowDatePicker(false);
  };

  const applyImageUri = useCallback((uri: string) => {
    const timer = setTimeout(() => setImageUri(uri), 150);
    return () => clearTimeout(timer);
  }, []);

  const applyPickerResult = useCallback(async (uri: string | null) => {
    if (!uri) return;
    try {
      const persistentUri = isLocalFileUri(uri)
        ? await copyToPersistentStorage(uri, `goal-new-${Date.now()}.jpg`)
        : uri;
      applyImageUri(persistentUri);
    } catch {
      applyImageUri(uri);
    }
  }, [applyImageUri]);

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photos to choose a goal image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: Platform.OS !== 'android',
        aspect: [1, 1],
        quality: 0.5,
      });
      const uri = getUriFromResult(result);
      if (uri) await applyPickerResult(uri);
    } catch (e) {
      Alert.alert('Photo library', e instanceof Error ? e.message : 'Could not open photo library.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to take a goal photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: Platform.OS !== 'android',
        aspect: [1, 1],
        quality: 0.5,
      });
      const uri = getUriFromResult(result);
      if (uri) await applyPickerResult(uri);
    } catch (e) {
      Alert.alert('Camera', e instanceof Error ? e.message : 'Could not open camera.');
    }
  };

  const handleImagePress = () => {
    if (imageUri) {
      Alert.alert('Goal image', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change image', onPress: () => showImageSourcePicker() },
        { text: 'Remove image', style: 'destructive', onPress: () => setImageUri('') },
      ]);
    } else {
      showImageSourcePicker();
    }
  };

  const showImageSourcePicker = () => {
    Alert.alert('Add image', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose from gallery', onPress: pickImageFromGallery },
      { text: 'Take photo', onPress: takePhoto },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppBar
        title="New goal"
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={12}>
            <Icon name="close" size={24} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <GoalForm
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          targetDate={targetDate}
          onTargetDateChange={setTargetDate}
          onTargetDatePress={() => setShowDatePicker(true)}
          category={category}
          onCategoryChange={setCategory}
          imageUri={imageUri}
          onImagePress={handleImagePress}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save goal</Text>
          <Icon name="check" size={22} color={colors.white} style={styles.saveBtnIcon} />
        </Pressable>
        <Text style={styles.footerHint}>You can edit this goal at any time.</Text>
      </View>
      <DatePickerModal
        visible={showDatePicker}
        value={datePickerValue}
        onConfirm={handleDateConfirm}
        onDismiss={() => setShowDatePicker(false)}
        mode="date"
        title="Target date"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 24 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  saveBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  saveBtnIcon: {},
  footerHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});
