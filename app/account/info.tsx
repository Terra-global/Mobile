import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function AccountInfoScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  // Form State
  const [username, setUsername] = React.useState(user?.username || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [country, setCountry] = React.useState(user?.country || '');
  const [bio, setBio] = React.useState(user?.bio || '');
  const [website, setWebsite] = React.useState(user?.website || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || '');
  
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

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalAvatarUrl = avatarUrl;
      
      // Upload avatar if it's a new local file
      if (avatarUrl && avatarUrl.startsWith('file://')) {
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', {
          uri: avatarUrl,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        });
        
        const uploadRes = await api.post('/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalAvatarUrl = uploadRes.data.url;
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
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#c1ff72" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account information</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
          {loading ? (
            <ActivityIndicator size="small" color="#c1ff72" />
          ) : (
            <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            activeOpacity={isEditing ? 0.7 : 1} 
            onPress={pickImage}
            style={styles.avatarContainer}
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
          <Text style={styles.avatarHint}>{isEditing ? 'Tap to change photo' : 'Profile Picture'}</Text>
        </View>

        <Text style={styles.introText}>
          Manage your public presence on Terra. Some information is read-only and can only be changed by contacting support.
        </Text>

        {/* Editable Fields */}
        <EditableItem 
          icon="person-outline" 
          label="Username" 
          value={username} 
          onChangeText={setUsername} 
          isEditing={isEditing} 
        />
        <EditableItem 
          icon="globe-outline" 
          label="Website" 
          value={website} 
          onChangeText={setWebsite} 
          isEditing={isEditing} 
          autoCapitalize="none" 
        />
        <EditableItem 
          icon="document-text-outline" 
          label="Bio" 
          value={bio} 
          onChangeText={setBio} 
          isEditing={isEditing} 
          multiline 
          placeholder="Tell us about yourself..." 
        />
        
        <View style={styles.sectionDivider} />

        {/* Read-only / Navigation Fields */}
        <TouchableOpacity 
          style={styles.item} 
          onPress={() => router.push('/account/farm-type' as any)}
        >
          <View style={styles.iconBox}>
            <Ionicons name="leaf-outline" size={22} color="#94a3b8" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.itemTitle}>Farm Type</Text>
            <Text style={styles.itemValue}>
              {currentFarmType?.name || 'select farm type'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#38383d" />
        </TouchableOpacity>

        <InfoItem icon="mail-outline" label="Email" value={user?.email} />
        <InfoItem icon="earth-outline" label="Country" value={user?.country || 'not provided'} />
        <InfoItem icon="calendar-outline" label="Account creation" value={new Date(user?.createdAt || Date.now()).toLocaleDateString()} />

        <View style={styles.sectionDivider} />
        
        <TouchableOpacity style={styles.item} onPress={() => router.push('/profile' as any)}>
          <View style={styles.iconBox}>
            <Ionicons name="eye-outline" size={22} color="#94a3b8" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.itemTitle}>Public Profile</Text>
            <Text style={styles.itemValue}>Preview how others see your profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#38383d" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function EditableItem({ icon, label, value, onChangeText, isEditing, ...props }: any) {
  return (
    <View style={styles.item}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#94a3b8" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.itemTitle}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={[styles.editInput, props.multiline && { height: 'auto', minHeight: 40 }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor="#64748b"
            {...props}
          />
        ) : (
          <Text style={styles.itemValue}>{value || 'not provided'}</Text>
        )}
      </View>
    </View>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <View style={styles.item}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#94a3b8" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.itemTitle}>{label}</Text>
        <Text style={styles.itemValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  editButtonText: { color: '#c1ff72', fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1 },
  introText: {
    color: '#94a3b8',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    lineHeight: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#1e2126',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#38383d',
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
    color: '#94a3b8',
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
  itemTitle: { color: '#94a3b8', fontSize: 12, marginBottom: 4, letterSpacing: 0.5 },
  itemValue: { color: '#fff', fontSize: 16 },
  editInput: { color: '#fff', fontSize: 16, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#38383d' },
  sectionDivider: { height: 1, backgroundColor: '#2a2d34', marginHorizontal: 16, marginVertical: 8 },
});
