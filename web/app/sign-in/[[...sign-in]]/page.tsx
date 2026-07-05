import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#090909] flex">
      {/* Left Column: Premium Marketing Panel (Hidden on screens below lg) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#0c0c0c] via-[#121212] to-[#0a2312] border-r border-white/5 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Top: Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <img src="/icon.png" alt="Raga Logo" className="w-10 h-10 object-contain" />
          <span className="text-white font-black text-3xl tracking-wide font-logo">Raga</span>
        </div>

        {/* Middle: Value Proposition */}
        <div className="space-y-6 max-w-md relative z-10 my-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/25 text-[#1DB954] text-xs font-semibold">
            <span>✨</span> Personal Music Assistant
          </div>
          
          <h2 className="text-white font-black text-4xl lg:text-5xl leading-tight tracking-tight">
            Your soundscape,<br />
            <span className="bg-gradient-to-r from-white via-white to-[#1DB954] bg-clip-text text-transparent">perfectly tailored.</span>
          </h2>
          
          <p className="text-[#B3B3B3] text-base leading-relaxed">
            Experience personalized recommendations, interactive queuing, and synced lyrics. Raga brings your music taste into a premium, ad-free web player.
          </p>

          <ul className="space-y-3 pt-2">
            {[
              'Personalized AI Smart Mix',
              'Infinite playlists & custom queues',
              'Real-time interactive lyrics sync'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-white/80 font-medium">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954] text-[10px] font-bold">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Footer Info */}
        <div className="text-white/40 text-xs font-semibold tracking-wider uppercase relative z-10 flex items-center gap-4">
          <span>Ad-Free</span>
          <span>•</span>
          <span>Cloud Synced</span>
          <span>•</span>
          <span>100% Free</span>
        </div>
      </div>

      {/* Right Column: Centered Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-[#090909]">
        {/* Subtle radial glow behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-[#1DB954]/5 blur-[80px] rounded-full pointer-events-none" />
        
        <SignIn
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: '#181818',
              colorPrimary: '#1DB954',
              borderRadius: '8px',
            },
            elements: {
              card: 'shadow-2xl border border-white/5 relative z-10 w-full max-w-[400px]',
              headerTitle: '!text-white font-bold',
              headerSubtitle: '!text-[#B3B3B3]',
              formButtonPrimary: '!bg-[#1DB954] hover:!bg-[#1ed760] !text-black font-bold',
              footerActionLink: '!text-[#1DB954] hover:!text-[#1ed760]',
              socialButtonsBlockButton: '!bg-[#282828] !border-[#3E3E3E] !text-white hover:!bg-[#333]',
              socialButtonsBlockButtonText: '!text-white font-semibold',
              dividerLine: '!bg-[#282828]',
              dividerText: '!text-[#B3B3B3]',
              formFieldLabel: '!text-white font-medium',
              formFieldInput: '!bg-[#282828] !border-[#3E3E3E] !text-white',
              identityPreviewText: '!text-white',
              footerActionText: '!text-[#B3B3B3]',
              formFieldLabelRow: '!text-white',
            },
          } as any}
        />
      </div>
    </div>
  );
}
