import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-sm normal-case',
            // Hide sign up links and other signup elements
            alternativeMethodsBlockButton: 'hidden',
            footerAction: 'hidden',
            footerActionText: 'hidden',
            footer: 'hidden',
            // Focus on username/password form
            identifierInput: 'flex flex-col gap-y-1',
          }
        }}
        path="/sign-in"
        routing="path"
      />
    </div>
  );
}