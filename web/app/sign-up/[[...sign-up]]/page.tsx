import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <img src="/icon.png" alt="Raga Logo" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="text-white font-black text-3xl tracking-tight">Raga</h1>
          <p className="text-[#B3B3B3] text-sm">Soundscape, unlocked.</p>
        </div>
      </div>

      <SignUp
        appearance={{
          variables: {
            colorBackground: '#181818',
            colorPrimary: '#1DB954',
            borderRadius: '8px',
          },
          elements: {
            card: 'shadow-2xl border border-white/10',
            headerTitle: 'text-white font-bold',
            headerSubtitle: 'text-[#B3B3B3]',
            formButtonPrimary: 'bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold',
            footerActionLink: 'text-[#1DB954] hover:text-[#1ed760]',
            socialButtonsBlockButton: 'bg-[#282828] border-[#3E3E3E] text-white hover:bg-[#333]',
            dividerLine: 'bg-[#282828]',
            dividerText: 'text-[#B3B3B3]',
            formFieldLabel: 'text-white',
          },
        }}
      />
    </div>
  );
}
