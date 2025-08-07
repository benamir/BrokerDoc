import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Upload, 
  MessageSquare, 
  Search,
  Plus,
  Send,
  Paperclip,
  Settings,
  BarChart3,
  FolderOpen
} from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center space-x-2 p-4 border-b border-gray-200">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">BrokerDoc</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat Assistant
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Document Library
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
            <Link href="/profile">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 cursor-pointer hover:opacity-80",
                  userButtonPopoverCard: "bg-white shadow-lg border border-gray-200",
                  userButtonPopoverActionButton: "hover:bg-gray-50 text-gray-700",
                  userButtonPopoverActionButtonIcon: "text-gray-500",
                }
              }}
              showName={false}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.unsafeMetadata?.brokerageName || user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Click avatar to access account menu
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Document Assistant</h2>
              <p className="text-gray-600">Ask questions about your real estate documents</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Welcome Message */}
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Welcome to BrokerDoc! 👋</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  I'm your AI assistant for real estate documents. I can help you:
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    Analyze contracts and identify key terms
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    Extract important information from documents
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    Flag potential risks or issues
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    Answer questions about your uploaded files
                  </li>
                </ul>
                <p className="text-sm text-gray-500 mt-4">
                  Upload a document or ask me a question to get started!
                </p>
              </CardContent>
            </Card>

            {/* Sample Messages */}
            <div className="max-w-2xl ml-auto">
              <Card className="bg-blue-600 text-white">
                <CardContent className="p-4">
                  <p>Can you analyze the purchase agreement I uploaded yesterday?</p>
                </CardContent>
              </Card>
            </div>

            <Card className="max-w-2xl">
              <CardContent className="p-4">
                <p className="text-gray-800">
                  I'd be happy to analyze your purchase agreement! I found several key points:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Purchase price: $450,000</li>
                  <li>• Closing date: March 15, 2024</li>
                  <li>• Contingencies: Inspection and financing</li>
                  <li>• ⚠️ Notice: Inspection period is only 7 days (shorter than typical)</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Textarea 
                  placeholder="Ask a question about your documents or describe what you need help with..."
                  className="min-h-[60px] pr-12 resize-none"
                />
                <Button size="sm" className="absolute bottom-2 right-2">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}