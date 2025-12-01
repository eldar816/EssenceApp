import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClientConfig } from '@/constants/ClientConfig';

interface NoteProps {
  top: string[];
  heart: string[];
  base: string[];
}

export default function NotePyramid({ top, heart, base }: NoteProps) {
  const NoteRow = ({ title, notes, color }: { title: string, notes: string[], color: string }) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: color }]}>{title}</Text>
      <View style={styles.notesContainer}>
        {notes.map((n, i) => (
          <View key={i} style={[styles.pill, { borderColor: color }]}>
            <Text style={[styles.noteText, { color: ClientConfig.colors.textDark }]}>{n}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.triangle} />
      <NoteRow title="TOP NOTES" notes={top} color="#FF9AA2" />
      <View style={styles.separator} />
      <NoteRow title="HEART NOTES" notes={heart} color="#FFB7B2" />
      <View style={styles.separator} />
      <NoteRow title="BASE NOTES" notes={base} color="#FFDAC1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    marginVertical: 20,
  },
  // THESE WERE MISSING IN YOUR FILE:
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF9AA2', // Top note color
    marginBottom: 10,
  },
  row: {
    alignItems: 'center',
    marginVertical: 8,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 2,
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: '#FFF',
  },
  noteText: {
    fontSize: 12,
    fontWeight: '500',
  },
  separator: {
    width: 2,
    height: 15,
    backgroundColor: '#DDD',
    marginVertical: 4,
  }
});