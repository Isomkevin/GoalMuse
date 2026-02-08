export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type BoardsStackParamList = {
  BoardsList: undefined;
  BoardDetail: { boardId: string };
  AddGoalFromBoard: { boardId: string };
};

export type GoalsStackParamList = {
  GoalsList: undefined;
  AddGoal: { boardId?: string };
  EditGoal: { goalId: string };
  TasksJournal: undefined;
};

export type StatsStackParamList = { StatsHome: undefined; Voice: undefined; VoiceActive: { flow?: string } };
export type ProfileStackParamList = {
  Account: undefined;
  PersonalInformation: undefined;
  SecurityPassword: undefined;
  Notifications: undefined;
  SubscriptionPlan: undefined;
};

export type RootTabParamList = {
  Boards: undefined;
  Goals: undefined;
  Insights: undefined;
  Profile: undefined;
};
