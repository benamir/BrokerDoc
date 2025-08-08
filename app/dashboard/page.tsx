import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  MessageSquare, 
  Settings,
  BarChart3,
  FolderOpen
} from "lucide-react";
import Link from "next/link";
import { ChatInterface } from '@/components/chat/chat-interface';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { DashboardContent } from './dashboard-content';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if user has completed onboarding
  const hasCompletedOnboarding = user.unsafeMetadata?.onboardingCompleted;
  if (!hasCompletedOnboarding) {
    redirect('/onboarding');
  }

  // Extract only the plain data we need from the user object
  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddresses: user.emailAddresses.map(email => ({
      id: email.id,
      emailAddress: email.emailAddress,
    })),
    unsafeMetadata: user.unsafeMetadata ? JSON.parse(JSON.stringify(user.unsafeMetadata)) : {},
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <DashboardContent user={userData} />
    </div>
  );
}