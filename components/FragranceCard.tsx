// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClientConfig } from '@/constants/ClientConfig';
import { useRouter } from 'expo-router';
import { Heart, CheckCircle } from 'lucide-react-native';

interface CardProps {
  id: string;
  name: string;
  vendor: string;
  notes: any;
  isTopPick?: boolean;
  // NEW PROPS
  onPress?: () => void; // Allows overriding default navigation
  selected?: boolean;   // For comparison mode
  isFavorite?: boolean;
  onToggleHeart?: () => void;
}

export default function FragranceCard({ id, name, vendor, notes, isTopPick, onPress, selected, isFavorite, onToggleHeart }: CardProps) {
  const router = useRouter();

  const noteList = Array.isArray(notes) 
    ? notes.slice(0, 3) 
    : (notes && notes.top && notes.heart) 
      ? [...notes.top, ...notes.heart].slice(0, 3)
      : [];

  const handlePress = () => {
    if (onPress) {
      onPress(); // Custom action (e.g. select for comparison)
    } else {
      if (!id) return;
      router.push(`/product/${id}`); // Default action
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.container, selected && styles.selectedContainer]}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{flex: 1}}>
            <Text style={styles.cardTitle}>{name}</Text>
            <Text style={styles.cardVendor}>{vendor}</Text>
          </View>
          {isTopPick && !selected && (
            <View style={styles.topPickBadge}>
              <Text style={styles.topPickText}>Top Pick</Text>
            </View>
          )}
          {selected && (
             <CheckCircle size={24} color={ClientConfig.colors.secondary} fill={ClientConfig.colors.primary} />
          )}
        </View>
        
        <View style={styles.tagContainer}>
          {noteList.map((note, index) => (
            <View key={`${note}-${index}`} style={styles.tag}>
              <Text style={styles.tagText}>{note}</Text>
            </View>
          ))}
        </View>

        {/* WISHLIST HEART BUTTON */}
        <TouchableOpacity 
          style={styles.heartBtn}
          onPress={(e) => {
            e.stopPropagation(); // Prevent card click
            if(onToggleHeart) onToggleHeart();
          }}
        >
          <Heart size={20} color={isFavorite ? 'red' : '#AAA'} fill={isFavorite ? 'red' : 'transparent'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: ClientConfig.borderRadius,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: ClientConfig.colors.secondary,
    transform: [{scale: 0.98}]
  },
  card: {
    backgroundColor: ClientConfig.colors.accent,
    borderRadius: ClientConfig.borderRadius,
    padding: 20,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ClientConfig.colors.primary,
  },
  cardVendor: {
    fontSize: 14,
    color: ClientConfig.colors.textDark,
    opacity: 0.7,
  },
  topPickBadge: {
    backgroundColor: ClientConfig.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  topPickText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: ClientConfig.colors.primary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5
  },
  tag: {
    backgroundColor: ClientConfig.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: ClientConfig.colors.accent,
    fontSize: 12,
  },
  heartBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 5
  }
});