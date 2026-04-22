import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PostCardProps {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  time: string;
  content: string;
  image?: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onAuthorPress?: () => void;
  onPress?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  id, 
  author, 
  time, 
  content, 
  image, 
  likes = 0, 
  comments = 0, 
  isLiked = false,
  onLikePress,
  onCommentPress,
  onAuthorPress,
  onPress 
}) => {

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${author.name} shared an update on Terra: "${content}"`,
        url: image, // Optional: only works on iOS for local images, or if it's a web URL
      });
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Author Info */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.authorHeader} 
            onPress={onAuthorPress}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: author.avatar || 'https://api.dicebear.com/7.x/identicon/png?seed=' + author.name }} 
              style={styles.avatar} 
            />
            <View style={styles.authorText}>
              <Text style={styles.authorName}>{author.name}</Text>
              <Text style={styles.timeText}>{time}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <Text style={styles.content}>{content}</Text>

        {/* Post Image */}
        {image && (
          <Image source={{ uri: image }} style={styles.postImage} resizeMode="cover" />
        )}
      </TouchableOpacity>

      {/* Interaction Bar */}
      <View style={styles.footer}>
        <View style={styles.interactionGroup}>
          <TouchableOpacity 
            style={styles.interactionButton} 
            onPress={onLikePress}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={22} 
              color={isLiked ? "#ff4b4b" : "#94a3b8"} 
            />
            <Text style={[styles.interactionText, isLiked && { color: '#ff4b4b' }]}>{likes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.interactionButton} 
            onPress={onCommentPress || onPress}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#94a3b8" />
            <Text style={styles.interactionText}>{comments}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.interactionButton} 
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d34',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#38383d',
  },
  authorText: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 1,
    fontFamily: 'Roboto',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: 'Roboto',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#1e2126',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  interactionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
  },
  interactionText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default PostCard;
