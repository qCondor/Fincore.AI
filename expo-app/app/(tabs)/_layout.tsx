import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

function ScanIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#2F80ED' : '#999';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3a2 2 0 012-2h3a2 2 0 012 2v3zM8 19a2 2 0 01-2 2H3a2 2 0 01-2-2v-3a2 2 0 012-2h3a2 2 0 012 2v3zM23 8a2 2 0 01-2 2h-3a2 2 0 01-2-2V5a2 2 0 012-2h3a2 2 0 012 2v3zM8 8a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2h3a2 2 0 012 2v3z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FaithIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#2F80ED' : '#999';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#2F80ED' : '#999';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20c0-4 4-6 8-6s8 2 8 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feels Like',
          tabBarIcon: ({ focused }) => <ScanIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="faith"
        options={{
          title: 'Faith',
          tabBarIcon: ({ focused }) => <FaithIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
