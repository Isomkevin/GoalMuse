import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../context/AppStateContext';
import { copyToPersistentStorage, isLocalFileUri } from '../lib/goalImageStorage';
import { AppBar } from '../components/AppBar';
import { GoalForm, GOAL_CATEGORIES } from '../components/GoalForm';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

type ParamList = { EditGoal: { goalId: string } };

function getUriFromResult(result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null): string | null {
  if (!result || result.canceled) return null;
  if ('errorCode' in result) return null;
  const assets = (result as ImagePicker.ImagePickerSuccessResult).assets;
  const uri = assets?.[0]?.uri ?? (result as { uri?: string }).uri;
  return uri && typeof uri === 'string' ? uri : null;
}

export function EditGoalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'EditGoal'>>();
  const { goalId } = route.params;
  const { goals, updateGoal, deleteGoal } = useAppState();
  const goal = goals.find((g) => g.id === goalId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [category, setCategory] = useState<string>(GOAL_CATEGORIES[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || '');
      setTargetDate(goal.targetDate || '');
      setImageUri(goal.imageUri || '');
      setCategory(GOAL_CATEGORIES.includes(goal.priority as any) ? goal.priority! : (goal.priority || GOAL_CATEGORIES[0]));
    }
  }, [goal]);

  const goBackOrToGoalsList = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('GoalsList');
    }
  };

  const handleSave = () => {
    if (!goal || !title.trim()) return;
    updateGoal(goalId, {
      title: title.trim(),
      description: description.trim() || undefined,
      targetDate: targetDate.trim() || undefined,
      imageUri: imageUri.trim() || undefined,
      priority: category.trim() || undefined,
    });
    goBackOrToGoalsList();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete goal?',
      `"${goal?.title}" will be removed. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteGoal(goalId); goBackOrToGoalsList(); } },
      ]
    );
  };

  const applyImageUri = useCallback((uri: string) => {
    const timer = setTimeout(() => setImageUri(uri), 150);
    return () => clearTimeout(timer);
  }, []);

  const applyPickerResult = useCallback(
    async (uri: string | null) => {
      if (!uri) return;
      try {
        const persistentUri = isLocalFileUri(uri)
          ? await copyToPersistentStorage(uri, `goal-${goalId}-${Date.now()}.jpg`)
          : uri;
        applyImageUri(persistentUri);
      } catch {
        applyImageUri(uri);
      }
    },
    [goalId, applyImageUri]
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      let cancelled = false;
      ImagePicker.getPendingResultAsync().then(async (pending) => {
        if (cancelled) return;
        const uri = getUriFromResult(pending);
        if (uri) await applyPickerResult(uri);
      });
      return () => { cancelled = true; };
    }, [applyPickerResult])
  );

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
        { text: 'Change image', onPress: showImageSourcePicker },
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

  if (!goal) {
    return (
      <View style={styles.container}>
        <AppBar title="Edit goal" showBack onBack={goBackOrToGoalsList} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Goal not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppBar
        title="Edit goal"
        leftAction={
          <Pressable onPress={goBackOrToGoalsList} style={styles.closeBtn} hitSlop={12}>
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
        <Pressable onPress={handleDelete} style={styles.deleteWrap}>
          <Text style={styles.deleteLink}>Delete goal</Text>
        </Pressable>
      </View>
      <DatePickerModal
        visible={showDatePicker}
        value={(() => {
          const d = targetDate ? new Date(targetDate) : new Date();
          return isNaN(d.getTime()) ? new Date() : d;
        })()}
        onConfirm={(date) => {
          setTargetDate(date.toISOString().slice(0, 10));
          setShowDatePicker(false);
        }}
        onDismiss={() => setShowDatePicker(false)}
        mode="date"
        title="Target date"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { fontSize: 16, color: colors.textMuted },
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
  saveBtnText: { fontSize: 17, fontWeight: '700', color: colors.white },
  saveBtnIcon: {},
  footerHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  deleteWrap: { alignItems: 'center', marginTop: 16 },
  deleteLink: { fontSize: 14, fontWeight: '600', color: colors.red },
});
