'use client';

import { useState, useEffect } from 'react';
import { X, Rocket, Package, Link as LinkIcon, Share2, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if onboarding query param is present
    const onboarding = searchParams?.get('onboarding');
    const hasSeenOnboarding = localStorage.getItem('ninjapay_onboarding_completed');

    if (onboarding === 'true' || !hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, [searchParams]);

  const steps = [
    {
      icon: Rocket,
      title: 'Welcome to NinjaPay!',
      description: 'You\'re all set to start accepting encrypted payments on Solana. Let\'s walk through the key features to get you started.',
      action: 'Get Started',
    },
    {
      icon: Package,
      title: 'Create Your First Product',
      description: 'Products represent what you\'re selling. Add product details, set pricing in USDC or SOL, and customize descriptions.',
      action: 'Create Product',
      link: '/dashboard/products',
    },
    {
      icon: LinkIcon,
      title: 'Generate Payment Links',
      description: 'Turn your products into shareable payment links. Each link is encrypted with Arcium MPC for maximum privacy.',
      action: 'View Payment Links',
      link: '/dashboard/payment-links',
    },
    {
      icon: Share2,
      title: 'Share and Track',
      description: 'Share your payment links via any channel. Track views, conversions, and revenue in real-time from your dashboard.',
      action: 'Go to Dashboard',
      link: '/dashboard',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('ninjapay_onboarding_completed', 'true');

    // Remove onboarding query param from URL
    if (searchParams?.get('onboarding')) {
      router.push('/dashboard');
    }
  };

  const navigateToStep = () => {
    const step = steps[currentStep];
    if (step.link) {
      router.push(step.link);
      handleClose();
    } else {
      handleNext();
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-purple-600'
                  : index < currentStep
                  ? 'w-2 bg-purple-400'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Icon className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {currentStepData.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            {currentStepData.description}
          </p>
        </div>

        {/* Features checklist (for first step) */}
        {currentStep === 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="grid gap-3">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>Wallet connected and verified</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>Merchant account created</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>Ready to accept payments</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-purple-600 hover:text-purple-600 transition-all"
            >
              Back
            </button>
          )}
          <button
            onClick={navigateToStep}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-xl transition-all"
          >
            {currentStepData.action}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={handleClose}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
}
