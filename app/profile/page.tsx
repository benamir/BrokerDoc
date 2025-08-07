import { UserProfile } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">BrokerDoc</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Account Settings
            </h2>
            <p className="text-gray-600">
              Manage your account information and preferences
            </p>
          </div>

          {/* Custom styled Clerk UserProfile component */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <UserProfile 
              appearance={{
                elements: {
                  card: "shadow-none border-0 rounded-none",
                  navbar: "bg-gray-50 border-r border-gray-200",
                  navbarButton: "text-gray-700 hover:bg-gray-100 rounded-md transition-colors",
                  navbarButtonIcon: "text-gray-500",
                  pageScrollBox: "p-6",
                  formButtonPrimary: 
                    "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors",
                  formFieldInput: 
                    "border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  formFieldLabel: "text-gray-700 font-medium",
                  alertText: "text-gray-600",
                  headerTitle: "text-2xl font-bold text-gray-900",
                  headerSubtitle: "text-gray-600",
                }
              }}
              routing="path"
              path="/profile"
            />
          </div>
        </div>
      </main>
    </div>
  );
}