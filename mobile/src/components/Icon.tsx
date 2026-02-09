import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { colors } from '../theme/colors';

// Map design (Material Symbols) names to MaterialCommunityIcons names (string for flexibility)
const symbolToIcon: Record<string, string> = {
  auto_awesome: 'auto-fix',
  mail: 'email-outline',
  lock: 'lock-outline',
  visibility: 'eye-outline',
  visibility_off: 'eye-off-outline',
  settings: 'cog-outline',
  add_circle: 'plus-circle-outline',
  add: 'plus',
  grid_view: 'view-grid-outline',
  track_changes: 'chart-timeline-variant',
  bar_chart: 'chart-bar',
  person: 'account-outline',
  image: 'image-outline',
  edit_note: 'note-edit-outline',
  arrow_back_ios: 'chevron-left',
  arrow_back: 'arrow-left',
  search: 'magnify',
  more_horiz: 'dots-horizontal',
  more_vert: 'dots-vertical',
  calendar_today: 'calendar',
  home: 'view-dashboard-outline',
  analytics: 'chart-line',
  explore: 'compass-outline',
  lightbulb: 'lightbulb-outline',
  chevron_right: 'chevron-right',
  notifications: 'bell-outline',
  star: 'star-outline',
  logout: 'logout',
  edit: 'pencil-outline',
  info: 'information-outline',
  explore_off: 'map-marker-off-outline',
  account_circle: 'account-circle-outline',
  check: 'check',
  light_mode: 'white-balance-sunny',
  dark_mode: 'weather-night',
  volume_up: 'volume-high',
  mic: 'microphone',
  close: 'close',
  pause_circle: 'pause-circle-outline',
  help_outline: 'help-circle-outline',
  play_arrow: 'play',
  hearing: 'ear-hearing',
  pause: 'pause',
  arrow_drop_down: 'chevron-down',
  arrow_forward: 'chevron-right',
  camera_alt: 'camera-outline',
  // Board list / themes
  target: 'bullseye-arrow',
  briefcase: 'briefcase-outline',
  schedule: 'clock-outline',
  insights: 'chart-line',
  layers: 'layers',
  tune: 'tune-variant',
};

interface IconProps {
  name: keyof typeof symbolToIcon | string;
  size?: number;
  color?: string;
  style?: object;
}

export function Icon({ name, size = 24, color = colors.text, style }: IconProps) {
  const mapped = symbolToIcon[name as keyof typeof symbolToIcon] ?? name;
  return (
    <MaterialCommunityIcons
      name={(mapped as any) || 'circle-outline'}
      size={size}
      color={color}
      style={style}
    />
  );
}
