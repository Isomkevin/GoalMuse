import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../context/AppStateContext';
import { copyToPersistentStorage, isLocalFileUri } from '../lib/goalImageStorage';
import { AppBar } from '../components/AppBar';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

type ParamList = { EditGoal: { goalId: string } };

export function EditGoalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'EditGoal'>>();
  const { goalId } = route.params;
  const { goals, updateGoal } = useAppState();
  const goal = goals.find((g) => g.id === goalId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [imageUri, setImageUri] = useState('');

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || '');
      setTargetDate(goal.targetDate || '');
      setImageUri(goal.imageUri || '');
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
    });
    goBackOrToGoalsList();
  };

  /** Get URI from picker result (supports current and legacy result shapes). */
  const getUriFromResult = (result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null): string | null => {
    if (!result || result.canceled) return null;
    if ('errorCode' in result) return null;
    const assets = (result as ImagePicker.ImagePickerSuccessResult).assets;
    const uri = assets?.[0]?.uri ?? (result as { uri?: string }).uri;
    return uri && typeof uri === 'string' ? uri : null;
  };

  /** Defer state update to avoid crash when native picker/camera activity is still closing (Android). */
  const applyImageUri = useCallback((uri: string) => {
    const timer = setTimeout(() => setImageUri(uri), 150);
    return () => clearTimeout(timer);
  }, []);

  /** Copy local picker URI to app storage so it survives restart; then apply. */
  const applyPickerResult = useCallback(
    async (uri: string | null) => {
      if (!uri) return;
      try {
        const persistentUri = isLocalFileUri(uri)
          ? await copyToPersistentStorage(uri, `goal-${goalId}-${Date.now()}.jpg`)
          : uri;
        applyImageUri(persistentUri);
      } catch (e) {
        applyImageUri(uri);
      }
    },
    [goalId, applyImageUri]
  );

  /** On Android, activity can be killed when opening camera/gallery; recover result when screen regains focus. */
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

  /**
   * Image input integrates into the goal edit flow: pick/capture sets local state,
   * preview shows the selected image, and handleSave persists imageUri to the goal.
   */
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
      const message = e instanceof Error ? e.message : 'Could not open photo library.';
      Alert.alert('Photo library', message);
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
      const message = e instanceof Error ? e.message : 'Could not open camera.';
      Alert.alert('Camera', message);
    }
  };

  const clearImage = () => setImageUri('');

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
      <AppBar title="Edit goal" showBack onBack={goBackOrToGoalsList} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Goal</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Speak at a global event"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Goal image (optional)</Text>
          <View style={styles.imagePreviewWrap}>
            {imageUri ? (
              <>
                <Image
                  key={imageUri}
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                  onError={() => setImageUri('')}
                />
                <Pressable style={styles.removeImageBtn} onPress={clearImage}>
                  <Icon name="close" size={20} color={colors.white} />
                </Pressable>
              </>
            ) : (
              <Image
                source={require('../../assets/placeholder.png')}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}
          </View>
          {imageUri ? (
            <Text style={styles.imageHint}>Tap buttons below to replace</Text>
          ) : null}
          <View style={styles.imageButtonRow}>
            <Pressable style={styles.imageBtn} onPress={pickImageFromGallery}>
              <Icon name="image" size={24} color={colors.primary} />
              <Text style={styles.imageBtnText}>Choose from gallery</Text>
            </Pressable>
            <Pressable style={styles.imageBtn} onPress={takePhoto}>
              <Icon name="camera_alt" size={24} color={colors.primary} />
              <Text style={styles.imageBtnText}>Take photo</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What does success look like?"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Target date (optional)</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={targetDate}
              onChangeText={setTargetDate}
            />
            <View style={styles.calendarIcon}>
              <Icon name="calendar_today" size={24} color={colors.textMuted} />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save goal</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 128,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dateInput: {
    flex: 1,
    borderWidth: 0,
  },
  calendarIcon: {
    paddingRight: 16,
  },
  imagePreviewWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    maxHeight: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
    paddingLeft: 4,
  },
  imageButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  imageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.backgroundLight,
  },
  saveBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
