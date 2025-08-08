import { SignUp } from '@clerk/nextjs';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">BrokerDoc</h1>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
              Already have an account?
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Join BrokerDoc
            </h2>
            <p className="text-gray-600">
              Start streamlining your real estate business today
            </p>
          </div>

          {/* Custom styled Clerk SignUp component */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: 
                    "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors",
                  card: "shadow-none border-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: 
                    "border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md transition-colors",
                  formFieldInput: 
                    "border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  footerActionLink: "text-blue-600 hover:text-blue-800",
                  formFieldLabel: "text-gray-700 font-medium",
                }
              }}
              routing="hash"
              afterSignUpUrl="/onboarding"
              signInUrl="/sign-in"
            />
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-800">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}