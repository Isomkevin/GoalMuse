import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../context/AppStateContext';
import { copyToPersistentStorage, isLocalFileUri } from '../lib/boardCoverStorage';
import { AppBar } from '../components/AppBar';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

type ParamList = { EditBoard: { boardId: string } };

function getUriFromResult(
  result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null
): string | null {
  if (!result || result.canceled) return null;
  if ('errorCode' in result) return null;
  const assets = (result as ImagePicker.ImagePickerSuccessResult).assets;
  const uri = assets?.[0]?.uri ?? (result as { uri?: string }).uri;
  return uri && typeof uri === 'string' ? uri : null;
}

export function EditBoardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'EditBoard'>>();
  const { boardId } = route.params;
  const { boards, updateBoard, deleteBoard } = useAppState();
  const board = boards.find((b) => b.id === boardId);
  const [title, setTitle] = useState('');
  const [coverImageUri, setCoverImageUri] = useState('');

  useEffect(() => {
    if (board) {
      setTitle(board.title);
      setCoverImageUri(board.coverImageUri || '');
    }
  }, [board]);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleSave = () => {
    if (!board || !title.trim()) return;
    updateBoard(boardId, {
      title: title.trim(),
      coverImageUri: coverImageUri.trim() || undefined,
    });
    goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete board?',
      `"${board?.title}" and all its goals will be removed. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBoard(boardId);
            goBack();
          },
        },
      ]
    );
  };

  const applyImageUri = useCallback((uri: string) => {
    const timer = setTimeout(() => setCoverImageUri(uri), 150);
    return () => clearTimeout(timer);
  }, []);

  const applyPickerResult = useCallback(
    async (uri: string | null) => {
      if (!uri) return;
      try {
        const persistentUri = isLocalFileUri(uri)
          ? await copyToPersistentStorage(uri, `board-${boardId}-${Date.now()}.jpg`)
          : uri;
        applyImageUri(persistentUri);
      } catch {
        applyImageUri(uri);
      }
    },
    [boardId, applyImageUri]
  );

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photos to choose a cover image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
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
        Alert.alert('Permission needed', 'Allow camera access to take a cover photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      const uri = getUriFromResult(result);
      if (uri) await applyPickerResult(uri);
    } catch (e) {
      Alert.alert('Camera', e instanceof Error ? e.message : 'Could not open camera.');
    }
  };

  const handleCoverPress = () => {
    if (coverImageUri) {
      Alert.alert('Cover image', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change image', onPress: showImageSourcePicker },
        { text: 'Remove image', style: 'destructive', onPress: () => setCoverImageUri('') },
      ]);
    } else {
      showImageSourcePicker();
    }
  };

  const showImageSourcePicker = () => {
    Alert.alert('Add cover image', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose from gallery', onPress: pickImageFromGallery },
      { text: 'Take photo', onPress: takePhoto },
    ]);
  };

  if (!board) {
    return (
      <View style={styles.container}>
        <AppBar title="Edit board" showBack onBack={goBack} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Board not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar
        title="Edit board"
        showBack
        onBack={goBack}
        leftAction={
          <Pressable onPress={goBack} style={styles.closeBtn} hitSlop={12}>
            <Icon name="close" size={24} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Board name"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { marginTop: 24 }]}>Cover image</Text>
        <Pressable style={styles.coverCard} onPress={handleCoverPress}>
          {coverImageUri ? (
            <>
              <Image source={{ uri: coverImageUri }} style={styles.coverImage} resizeMode="cover" />
              <View style={styles.coverOverlay}>
                <Icon name="edit" size={24} color={colors.white} />
                <Text style={styles.coverOverlayText}>Tap to change</Text>
              </View>
            </>
          ) : (
            <View style={styles.coverPlaceholder}>
              <Icon name="image" size={48} color={colors.gray400} />
              <Text style={styles.coverPlaceholderText}>Add a cover image</Text>
              <Text style={styles.coverPlaceholderSub}>Makes your board stand out</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save board</Text>
          <Icon name="check" size={22} color={colors.white} style={styles.saveBtnIcon} />
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.deleteWrap}>
          <Text style={styles.deleteLink}>Delete board</Text>
        </Pressable>
      </View>
    </View>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    fontSize: 16,
    color: colors.text,
  },
  coverCard: {
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverOverlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginTop: 8,
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  coverPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 12,
  },
  coverPlaceholderSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
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
  deleteWrap: { alignItems: 'center', marginTop: 16 },
  deleteLink: { fontSize: 14, fontWeight: '600', color: colors.red },
});
