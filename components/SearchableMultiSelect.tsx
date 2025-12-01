import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { ClientConfig } from '@/constants/ClientConfig';
import { Plus, X, Check } from 'lucide-react-native';

interface Props {
  label: string;
  options: string[]; // Available predefined options
  selected: string[]; // Currently selected items
  onSelectionChange: (items: string[]) => void;
  onAddNew?: (newItem: string) => void; // Optional handler to add to global DB
  placeholder?: string;
  single?: boolean; // If true, acts as single select (like for Vendor)
}

export default function SearchableMultiSelect({ label, options, selected, onSelectionChange, onAddNew, placeholder, single }: Props) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Filter options based on search
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(query.toLowerCase()) && 
    !selected.includes(opt) // Don't show already selected in the list
  );

  const handleSelect = (item: string) => {
    if (single) {
      onSelectionChange([item]);
      setQuery('');
      setIsFocused(false);
    } else {
      onSelectionChange([...selected, item]);
      setQuery('');
    }
  };

  const handleRemove = (item: string) => {
    onSelectionChange(selected.filter(i => i !== item));
  };

  const handleCreate = () => {
    if (query.trim().length > 0) {
      if (onAddNew) {
        onAddNew(query.trim()); // Add to global DB
      }
      // Select it immediately
      handleSelect(query.trim());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Selected Chips */}
      <View style={styles.chipContainer}>
        {selected.map(item => (
          <View key={item} style={styles.selectedChip}>
            <Text style={styles.selectedChipText}>{item}</Text>
            <TouchableOpacity onPress={() => handleRemove(item)}>
              <X size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Input Field */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={selected.length > 0 && single ? "" : (placeholder || `Search ${label}...`)}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleCreate} style={styles.addBtn}>
            <Plus size={16} color="#FFF" />
            <Text style={styles.addBtnText}>Add "{query}"</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown Options */}
      {isFocused && query.length === 0 && (
        <View style={styles.dropdown}>
          <Text style={styles.helperText}>Recent / Popular:</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight: 150}}>
            {options.slice(0, 10).map(opt => (
              <TouchableOpacity key={opt} style={styles.optionItem} onPress={() => handleSelect(opt)}>
                <Text>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Results */}
      {query.length > 0 && filteredOptions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight: 150}}>
            {filteredOptions.map(opt => (
              <TouchableOpacity key={opt} style={styles.optionItem} onPress={() => handleSelect(opt)}>
                <Text>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 15, zIndex: 1 }, // zIndex needed for dropdown
  label: { marginBottom: 8, fontWeight: 'bold', color: '#555', fontSize: 14 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClientConfig.colors.secondary,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4
  },
  selectedChipText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  addBtn: {
    position: 'absolute',
    right: 5,
    backgroundColor: ClientConfig.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 4
  },
  addBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  dropdown: {
    position: 'absolute',
    top: 80, // Adjust based on input height
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  helperText: {
    padding: 8,
    fontSize: 10,
    color: '#999',
    backgroundColor: '#FAFAFA'
  }
});