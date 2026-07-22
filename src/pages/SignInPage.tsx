import { SignIn } from "@clerk/clerk-react"

export function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="mb-8 text-center">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  )
}
