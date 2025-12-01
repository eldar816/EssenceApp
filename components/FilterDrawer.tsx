import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { ClientConfig } from '@/constants/ClientConfig';

// Define the "Shape" of data this component accepts
interface FilterDrawerProps {
  options: {
    genders: string[];
    vendors: string[];
    occasions: string[];
    notes: string[];
  };
  activeFilters: any;
  onToggle: (category: string, item: string) => void;
  onClear: () => void;
}

export default function FilterDrawer({ options, activeFilters, onToggle, onClear }: FilterDrawerProps) {
  
  // A small internal component just for this file
  const FilterSection = ({ title, category, items }: { title: string, category: string, items: string[] }) => {
    if (!items || items.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
          {items.map(item => {
            const isActive = activeFilters[category].includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => onToggle(category, item)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item}
                </Text>
                {isActive && (
                  <Check size={14} color={ClientConfig.colors.primary} style={{marginLeft: 4}} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollArea}>
        <FilterSection title="Gender" category="gender" items={options.genders} />
        <FilterSection title="Brand" category="vendor" items={options.vendors} />
        <FilterSection title="Occasion" category="occasion" items={options.occasions} />
        <FilterSection title="Notes" category="notes" items={options.notes} />
        <View style={{height: 20}} />
      </ScrollView>
      
      <TouchableOpacity style={styles.clearButton} onPress={onClear}>
        <Text style={styles.clearText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ClientConfig.colors.accent,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -15,
    paddingTop: 20,
    maxHeight: 300, // Limit height so it doesn't take whole screen
  },
  scrollArea: {
    marginBottom: 10,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: ClientConfig.colors.primary,
    fontSize: 14,
  },
  chipContainer: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ClientConfig.colors.primary,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: ClientConfig.colors.secondary,
    borderColor: ClientConfig.colors.secondary,
  },
  chipText: {
    color: ClientConfig.colors.primary,
    fontSize: 13,
  },
  chipTextActive: {
    fontWeight: 'bold',
  },
  clearButton: {
    alignItems: 'center',
    padding: 10,
  },
  clearText: {
    color: ClientConfig.colors.primary,
    textDecorationLine: 'underline',
    fontSize: 12,
  },
});