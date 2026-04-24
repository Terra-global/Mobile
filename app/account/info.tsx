import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';

export default function AccountInfoScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const { showAlert } = useAlertStore();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  // Form State
  const [username, setUsername] = React.useState(user?.username || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [country, setCountry] = React.useState(user?.country || '');
  const [bio, setBio] = React.useState(user?.bio || '');
  const [website, setWebsite] = React.useState(user?.website || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || '');
  const [pickedAsset, setPickedAsset] = React.useState<any>(null); // stores full ImagePicker asset
  
  const [farmTypes, setFarmTypes] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchFarmTypes();
  }, []);

  const fetchFarmTypes = async () => {
    try {
      const res = await api.get('/users/farm-types');
      if (res.data.success) {
        setFarmTypes(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch farm types:', error);
    }
  };

  const currentFarmType = farmTypes.find(f => f.id === user?.farmTypeId);

  const pickImage = async () => {
    if (!isEditing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setPickedAsset(asset);      // save full asset for upload
      setAvatarUrl(asset.uri);    // show preview immediately
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalAvatarUrl = avatarUrl;
      
      // Upload avatar if a new image was picked from gallery
      if (pickedAsset) {
        const formData = new FormData();
        // Derive a safe extension from mimeType (e.g. image/jpeg → .jpg)
        const ext = (pickedAsset.mimeType || 'image/jpeg').split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const filename = `avatar.${ext}`;
        // @ts-ignore
        formData.append('file', {
          uri: pickedAsset.uri,
          name: filename,
          type: pickedAsset.mimeType || 'image/jpeg',
        });
        
        const uploadRes = await api.post('/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalAvatarUrl = uploadRes.data.data.url;
        console.log('🖼️ Upload response URL:', finalAvatarUrl); // DEBUG
        setAvatarUrl(finalAvatarUrl); // update preview to R2 URL
        setPickedAsset(null);         // clear picked asset
      }

      const updateData = { 
        username, 
        website, 
        bio,
        avatarUrl: finalAvatarUrl
      };

      await api.patch('/users/profile', updateData);
      updateUser(updateData);
      setIsEditing(false);
      showAlert('Profile updated!', 'success');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showAlert(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Account information</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
          {loading ? (
            <ActivityIndicator size="small" color={themeColors.tint} />
          ) : (
            <Text style={[styles.editButtonText, { color: themeColors.tint }]}>{isEditing ? 'Save' : 'Edit'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Picture Section */}
        <View style={[styles.avatarSection, { backgroundColor: themeColors.background }]}>
          <TouchableOpacity 
            activeOpacity={isEditing ? 0.7 : 1} 
            onPress={pickImage}
            style={[styles.avatarContainer, { backgroundColor: themeColors.card }]}
          >
            <Image 
              source={{ uri: avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + (username || 'User') }} 
              style={styles.avatar} 
            />
            {isEditing && (
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera" size={24} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: themeColors.subtext }]}>{isEditing ? 'Tap to change photo' : 'Profile Picture'}</Text>
        </View>

        <Text style={[styles.introText, { color: themeColors.subtext }]}>
          Manage your public presence on Terra. Some information is read-only and can only be changed by contacting support.
        </Text>

        {/* Editable Fields */}
        <EditableItem 
          icon="person-outline" 
          label="Username" 
          value={username} 
          onChangeText={setUsername} 
          isEditing={isEditing} 
          themeColors={themeColors}
        />
        <EditableItem 
          icon="globe-outline" 
          label="Website" 
          value={website} 
          onChangeText={setWebsite} 
          isEditing={isEditing} 
          autoCapitalize="none" 
          themeColors={themeColors}
        />
        <EditableItem 
          icon="document-text-outline" 
          label="Bio" 
          value={bio} 
          onChangeText={setBio} 
          isEditing={isEditing} 
          multiline 
          placeholder="Tell us about yourself..." 
          themeColors={themeColors}
        />
        
        <View style={[styles.sectionDivider, { backgroundColor: themeColors.border }]} />

        {/* Read-only / Navigation Fields */}
        <TouchableOpacity 
          style={styles.item} 
          onPress={() => router.push('/account/farm-type' as any)}
        >
          <View style={styles.iconBox}>
            <Ionicons name="leaf-outline" size={22} color={themeColors.subtext} />
          </View>
          <View style={styles.textBox}>
            <Text style={[styles.itemTitle, { color: themeColors.subtext }]}>Farm Type</Text>
            <Text style={[styles.itemValue, { color: themeColors.text }]}>
              {currentFarmType?.name || 'select farm type'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.border} />
        </TouchableOpacity>

        <InfoItem icon="mail-outline" label="Email" value={user?.email} themeColors={themeColors} />
        <InfoItem icon="earth-outline" label="Country" value={user?.country || 'not provided'} themeColors={themeColors} />
        <InfoItem icon="calendar-outline" label="Account creation" value={new Date(user?.createdAt || Date.now()).toLocaleDateString()} themeColors={themeColors} />

        <View style={[styles.sectionDivider, { backgroundColor: themeColors.border }]} />
        
        <TouchableOpacity style={styles.item} onPress={() => router.push('/profile' as any)}>
          <View style={styles.iconBox}>
            <Ionicons name="eye-outline" size={22} color={themeColors.subtext} />
          </View>
          <View style={styles.textBox}>
            <Text style={[styles.itemTitle, { color: themeColors.subtext }]}>Public Profile</Text>
            <Text style={[styles.itemValue, { color: themeColors.text }]}>Preview how others see your profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.border} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function EditableItem({ icon, label, value, onChangeText, isEditing, themeColors, ...props }: any) {
  return (
    <View style={styles.item}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={themeColors.subtext} />
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.itemTitle, { color: themeColors.subtext }]}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={[styles.editInput, { color: themeColors.text, borderBottomColor: themeColors.border }, props.multiline && { height: 'auto', minHeight: 40 }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor={themeColors.subtext}
            {...props}
          />
        ) : (
          <Text style={[styles.itemValue, { color: themeColors.text }]}>{value || 'not provided'}</Text>
        )}
      </View>
    </View>
  );
}

function InfoItem({ icon, label, value, themeColors }: any) {
  return (
    <View style={styles.item}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={themeColors.subtext} />
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.itemTitle, { color: themeColors.subtext }]}>{label}</Text>
        <Text style={[styles.itemValue, { color: themeColors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  editButtonText: { fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1 },
  introText: {
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    lineHeight: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconBox: { width: 40 },
  textBox: { flex: 1, paddingRight: 10 },
  itemTitle: { fontSize: 12, marginBottom: 4, letterSpacing: 0.5 },
  itemValue: { fontSize: 16 },
  editInput: { fontSize: 16, paddingVertical: 4, borderBottomWidth: 1 },
  sectionDivider: { height: 0.5, marginHorizontal: 16, marginVertical: 8 },
});
