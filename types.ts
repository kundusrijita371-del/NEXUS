export type Category = 'Maintenance' | 'Electrical' | 'Plumbing' | 'Security' | 'Custodial';
export type ReportStatus = 'Pending' | 'Solved';
export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: number;
  profileImage?: string;
  phone?: string;
  department?: string;
  year?: string;
  points?: number;
  badges?: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface IssueReport {
  id: string;
  timestamp: number;
  imageUrl: string;
  issue_detected: string;
  category: Category;
  severity_level: number;
  action_required: string;
  requires_immediate_action: boolean;
  safety_warning_for_student: string;
  status: ReportStatus;
  reportedById: string; // Linked to User.id for gamification
  userNotes?: string;   // For Voice Assistant input
}

export interface GeminiResponse {
  issue_detected: string;
  category: Category;
  severity_level: number;
  action_required: string;
  requires_immediate_action: boolean;
  safety_warning_for_student: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  timestamp: number;
  creator: string;
  totalVotes: number;
  hasVoted?: boolean;
}

export interface BookSuggestion {
  id: string;
  title: string;
  author: string;
  suggestedBy: string;
  suggestedById: string;
  timestamp: number;
  votes: number;
  status: 'Requested' | 'In-Review' | 'Purchased';
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: 'Meal' | 'Snack' | 'Drink';
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface AcademicResource {
  id: string;
  name: string;
  type: 'Note' | 'Syllabus' | 'Book';
  url: string;
}

export interface Department {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  headOfDept: string;
  resources: AcademicResource[];
}

export type ReelCategory = 'Resolved Issue' | 'Alert' | 'Awareness' | 'Achievement';

export interface ReelComment {
  id: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Reel {
  id: string;
  title: string;
  videoUrl: string;
  category: ReelCategory;
  likes: number;
  isLiked?: boolean;
  comments: ReelComment[];
  isEnabled: boolean;
  timestamp: number;
  adminName: string;
}
