import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share, Dimensions, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ImageViewing from 'react-native-image-viewing';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

interface PostCardProps {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar?: string;
    farmType?: string | null;
  };
  time: string;
  content: string;
  tags?: string[];
  images?: string[];
  likes?: number;
  comments?: number;
  views?: number;
  postType?: 'REGULAR' | 'FOR_SALE' | 'LOOKING_FOR';
  price?: number | null;
  priceUnit?: string | null;
  quantity?: number | null;
  quantityUnit?: string | null;
  location?: string | null;
  isLiked?: boolean;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onAuthorPress?: () => void;
  onDeletePress?: () => void;
  onMessagePress?: () => void;
  onPress?: () => void;
}

const FARM_TYPE_EMOJI: Record<string, string> = {
  'Subsistence Farmer': '🌾',
  'Hobby Farmer': '🏡',
  'Smallholder': '🌱',
  'Contract Farmer': '📋',
  'Livestock Producer': '🐄',
  'Arable Farmer': '🌽',
  'Horticulturalist': '🍅',
  'Aquaculture Farmer': '🐟',
};

const PostCard: React.FC<PostCardProps> = ({ 
  id, 
  author, 
  time, 
  content, 
  tags,
  images, 
  likes = 0, 
  comments = 0, 
  views = 0,
  postType = 'REGULAR',
  price,
  priceUnit,
  quantity,
  quantityUnit,
  location,
  isLiked = false,
  onLikePress,
  onCommentPress,
  onAuthorPress,
  onDeletePress,
  onMessagePress,
  onPress 
}) => {
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const handleShare = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        message: `${author.name} shared an update on Terra: "${content}"`,
        url: images?.[0], // Optional: only works on iOS for local images, or if it's a web URL
      });
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  const showMoreMenu = () => {
    Haptics.selectionAsync();
    const buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Share', onPress: handleShare },
      { text: 'Cancel', style: 'cancel' },
    ];

    if (onDeletePress) {
      buttons.unshift({ 
        text: 'Delete Post', 
        style: 'destructive' as const, 
        onPress: () => {
          Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this update? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDeletePress },
            ]
          );
        }
      });
    }

    Alert.alert('Post Options', undefined, buttons);
  };

  return (
    <View style={[styles.container, { borderBottomColor: themeColors.border }]}>
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
              style={[styles.avatar, { borderColor: themeColors.border, borderWidth: 0.5 }]} 
            />
            <View style={styles.authorText}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {author.farmType && (
                  <Text style={styles.farmBadge}>{FARM_TYPE_EMOJI[author.farmType] || '🌱'}</Text>
                )}
                <Text style={[styles.authorName, { color: themeColors.text }]}>{author.name}</Text>
              </View>
              <Text style={[styles.timeText, { color: themeColors.subtext }]}>{time}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={showMoreMenu}>
            <Ionicons name="ellipsis-horizontal" size={20} color={themeColors.subtext} />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <Text style={[styles.content, { color: themeColors.text }]}>{content}</Text>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, i) => (
              <View key={i} style={[styles.tagChip, { backgroundColor: themeColors.card, borderColor: themeColors.tint + '44' }]}>
                <Text style={[styles.tagText, { color: themeColors.tint }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {/* Marketplace Details */}
        {postType !== 'REGULAR' && (
          <View style={[styles.marketContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.marketHeader}>
              <View style={[styles.marketBadge, { backgroundColor: postType === 'FOR_SALE' ? '#10b98122' : '#3b82f622' }]}>
                <Text style={[styles.marketBadgeText, { color: postType === 'FOR_SALE' ? '#10b981' : '#3b82f6' }]}>
                  {postType === 'FOR_SALE' ? 'For Sale' : 'Looking For'}
                </Text>
              </View>
              {price != null && (
                <Text style={[styles.priceText, { color: themeColors.text }]}>
                  ₦{price.toLocaleString()} <Text style={styles.unitText}>/ {priceUnit || 'unit'}</Text>
                </Text>
              )}
            </View>
            
            <View style={styles.marketDetails}>
              {quantity != null && (
                <View style={styles.marketDetailItem}>
                  <Ionicons name="cube-outline" size={16} color={themeColors.subtext} />
                  <Text style={[styles.marketDetailText, { color: themeColors.subtext }]}>{quantity} {quantityUnit || 'units'}</Text>
                </View>
              )}
              {location && (
                <View style={styles.marketDetailItem}>
                  <Ionicons name="location-outline" size={16} color={themeColors.subtext} />
                  <Text style={[styles.marketDetailText, { color: themeColors.subtext }]}>{location}</Text>
                </View>
              )}
            </View>

            {/* Message Button */}
            {onMessagePress && (
              <TouchableOpacity 
                style={[styles.messageButton, { backgroundColor: themeColors.tint }]} 
                onPress={onMessagePress}
              >
                <Ionicons name="chatbubbles" size={16} color="#fff" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Post Images Gallery - Moved outside the main TouchableOpacity to prevent gesture conflicts */}
      {images && images.length > 0 && (
        <View style={styles.imageGalleryContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
            nestedScrollEnabled={true}
          >
            {images.map((img, idx) => (
              <TouchableOpacity 
                key={idx} 
                activeOpacity={0.9}
                onPress={() => {
                  setCurrentImageIndex(idx);
                  setViewerVisible(true);
                }}
              >
                <Image 
                  source={{ uri: img }} 
                  style={[styles.postImage, { width: Dimensions.get('window').width - 32, backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.paginationDot}>
              <Text style={styles.paginationText}>{currentImageIndex + 1}/{images.length}</Text>
            </View>
          )}
        </View>
      )}

      {/* Fullscreen Image Viewer */}
      <ImageViewing
        images={images?.map(uri => ({ uri })) || []}
        imageIndex={currentImageIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />

      {/* Interaction Bar */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.interactionButton} 
          onPress={onCommentPress || onPress}
        >
          <Ionicons name="chatbubble-outline" size={18} color={themeColors.subtext} />
          <Text style={[styles.interactionText, { color: themeColors.subtext }]}>{comments || ""}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.interactionButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onLikePress?.();
          }}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={18} 
            color={isLiked ? "#f91880" : themeColors.subtext} 
          />
          <Text style={[styles.interactionText, { color: isLiked ? '#f91880' : themeColors.subtext }]}>{likes || ""}</Text>
        </TouchableOpacity>

        <View style={styles.interactionButton}>
          <Ionicons name="stats-chart-outline" size={16} color={themeColors.subtext} />
          <Text style={[styles.interactionText, { color: themeColors.subtext }]}>{views || ""}</Text>
        </View>

        <TouchableOpacity 
          style={styles.interactionButton} 
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={18} color={themeColors.subtext} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorText: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Roboto',
  },
  timeText: {
    fontSize: 12,
    marginTop: 1,
    fontFamily: 'Roboto',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: 'Roboto',
  },
  postImage: {
    height: 320,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  imageGalleryContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imageGallery: {
    borderRadius: 16,
  },
  paginationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paginationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingRight: 40, // Space icons like Twitter/X
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
    fontSize: 12,
    fontWeight: '400',
  },
  farmBadge: {
    fontSize: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  marketContainer: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  marketBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 12,
    fontWeight: 'normal',
    opacity: 0.7,
  },
  marketDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  marketDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  marketDetailText: {
    fontSize: 13,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PostCard;
