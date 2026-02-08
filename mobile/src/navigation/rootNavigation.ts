import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateToEditGoal(goalId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Main', {
      screen: 'Goals',
      params: { screen: 'EditGoal', params: { goalId } },
    });
  }
}
