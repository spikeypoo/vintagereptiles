"use client";

import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  AddressElement,
  useCheckout,
} from '@stripe/react-stripe-js';
import { ArrowRight, Check, Clock, Mail, Package, Truck, CreditCard } from "lucide-react";

const validateEmail = async (email, checkout) => {
  const updateResult = await checkout.updateEmail(email);
  const isValid = updateResult.type !== "error";
  return { isValid, message: !isValid ? updateResult.error.message : null };
};

const formatPrice = (amount, currency = 'USD') => {
  const validCurrency = currency || 'USD';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency.toUpperCase(),
    }).format(amount / 100);
  } catch(error) {
    return `${(amount / 100).toFixed(2)}`;
  }
};

const CheckoutStep = ({ 
  step, 
  currentStep, 
  title, 
  icon, 
  isCompleted, 
  children,
  onEdit
}) => {
  const isActive = step === currentStep;
  const isPreviouslyCompleted = isCompleted && step < currentStep;
  
  return (
    <div className={`mb-8 transition-all duration-300 ${step <= currentStep ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
      <div className="flex items-center mb-4 relative">
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full mr-3
          ${isActive ? 'bg-[#cb18db] text-white' : 
            isPreviouslyCompleted ? 'bg-green-500 text-white' : 'bg-[#2a2728] text-gray-300'}
          transition-colors duration-300
        `}>
          {isPreviouslyCompleted ? (
            <Check className="w-5 h-5" />
          ) : (
            React.cloneElement(icon, { className: "w-5 h-5" })
          )}
        </div>
        <h3 className={`text-xl font-semibold 
          ${isActive ? 'text-white' : isPreviouslyCompleted ? 'text-green-400' : 'text-gray-400'}`}>
          {title}
        </h3>
        
        {isPreviouslyCompleted && (
          <button 
            onClick={() => onEdit(step)}
            className="ml-auto text-[#cb18db] hover:text-[#d334e7] text-sm font-medium flex items-center"
          >
            Edit
          </button>
        )}
      </div>
      
      <div className={`
        overflow-hidden transition-all duration-500 ease-in-out ml-12
        ${isActive ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        {children}
      </div>
    </div>
  );
};

const EmailStep = ({ email, setEmail, error, setError, onComplete }) => {
  const checkout = useCheckout();

  const handleBlur = async () => {
    if (!email) return;
    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setError(message);
      return;
    }
  };

  const handleChange = (e) => {
    setError(null);
    setEmail(e.target.value);
  };

  const handleContinue = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }
    
    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setError(message);
      return;
    }
    
    onComplete();
  };

  return (
    <div className="bg-[#1d1b1b] rounded-lg p-6 mb-4 shadow-lg border border-gray-800">
      <div className="mb-6">
        <label className="block text-white text-lg mb-2 font-medium">
          Email
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com"
            className="w-full px-4 py-3 mt-2 rounded-md bg-[#2a2728] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#cb18db] focus:border-transparent transition duration-200"
          />
        </label>
        {error && (
          <div id="email-errors" className="text-red-400 mt-2 text-sm">
            {error}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={handleContinue}
          className="bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white font-bold py-3 px-6 rounded-md hover:from-[#d334e7] hover:to-[#b321c9] focus:outline-none focus:ring-2 focus:ring-[#cb18db] transition duration-200 flex items-center"
        >
          Continue <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const BillingAddressStep = ({ onComplete }) => {
  return (
    <div className="bg-[#1d1b1b] rounded-lg p-6 mb-4 shadow-lg border border-gray-800">
      <div className="bg-[#2a2728] rounded-md p-4">
        <AddressElement
          options={{ mode: 'billing' }}
          className="stripe-element"
        />
      </div>
      
      <div className="flex justify-end mt-6">
        <button 
          onClick={onComplete}
          className="bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white font-bold py-3 px-6 rounded-md hover:from-[#d334e7] hover:to-[#b321c9] focus:outline-none focus:ring-2 focus:ring-[#cb18db] transition duration-200 flex items-center"
        >
          Continue <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ShippingAddressStep = ({ onComplete }) => {
  return (
    <div className="bg-[#1d1b1b] rounded-lg p-6 mb-4 shadow-lg border border-gray-800">
      <div className="bg-[#2a2728] rounded-md p-4">
        <AddressElement
          options={{ mode: 'shipping' }}
          className="stripe-element"
        />
      </div>
      
      <div className="flex justify-end mt-6">
        <button 
          onClick={onComplete}
          className="bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white font-bold py-3 px-6 rounded-md hover:from-[#d334e7] hover:to-[#b321c9] focus:outline-none focus:ring-2 focus:ring-[#cb18db] transition duration-200 flex items-center"
        >
          Continue <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ShippingMethodsStep = ({ onComplete }) => {
  const checkout = useCheckout();
  const [selectedOption, setSelectedOption] = useState(
    checkout?.shippingOptions?.length > 0 ? checkout.shippingOptions[0].id : null
  );

  const handleSelectOption = async (optId) => {
    setSelectedOption(optId);
    await checkout.updateShippingOption(optId);
  };

  // Example estimated delivery times - you'd have real data here
  const getEstimatedDelivery = (optName) => {
    if (optName.toLowerCase().includes('express')) return "1-2 Business Days";
    if (optName.toLowerCase().includes('standard')) return "3-5 Business Days";
    return "5-7 Business Days";
  };

  if (!checkout?.shippingOptions?.length) {
    return null;
  }

  return (
    <div className="bg-[#1d1b1b] rounded-lg p-6 mb-4 shadow-lg border border-gray-800">
      <div className="grid gap-4">
        {checkout.shippingOptions.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const estimatedDelivery = getEstimatedDelivery(opt.displayName);
          
          return (
            <div 
              key={opt.id} 
              onClick={() => handleSelectOption(opt.id)}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-[#cb18db] bg-gradient-to-r from-[#2a1f2c] to-[#231b24] shadow-lg' 
                  : 'border-gray-700 bg-[#2a2728] hover:border-[#cb18db]'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mr-4
                    ${isSelected ? 'bg-[#cb18db]' : 'bg-gray-700'}
                  `}>
                    {opt.displayName.toLowerCase().includes('express') ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ) : (
                      <Truck className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">{opt.displayName}</h4>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-400 text-sm">{estimatedDelivery}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-white font-bold text-xl mr-4">
                    {opt.amount === `CA$0.00` ? "FREE" : opt.amount}
                  </div>
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${isSelected 
                      ? 'border-[#cb18db] bg-[#cb18db]' 
                      : 'border-gray-500'}
                  `}>
                    {isSelected && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end mt-6">
        <button 
          onClick={onComplete}
          className="bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white font-bold py-3 px-6 rounded-md hover:from-[#d334e7] hover:to-[#b321c9] focus:outline-none focus:ring-2 focus:ring-[#cb18db] transition duration-200 flex items-center"
        >
          Continue <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const PaymentStep = ({ isLoading, handleSubmit, message, total }) => {
  return (
    <div className="bg-[#1d1b1b] rounded-lg p-6 mb-4 shadow-lg border border-gray-800">
      <div className="bg-[#2a2728] rounded-md p-4 mb-6">
        <PaymentElement
          id="payment-element"
          className="stripe-element"
          options={{ layout: { type: 'tabs', defaultCollapsed: false } }}
        />
      </div>
      
      {message && (
        <div
          id="payment-message"
          className={`p-4 rounded-md mb-6 ${
            message.includes('error')
              ? 'bg-red-900/40 text-red-300'
              : 'bg-green-900/40 text-green-300'
          }`}
        >
          {message}
        </div>
      )}
      
      <button
        disabled={isLoading}
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white font-bold py-4 px-6 rounded-md hover:from-[#d334e7] hover:to-[#b321c9] focus:outline-none focus:ring-2 focus:ring-[#cb18db] disabled:opacity-70 transition duration-200 text-lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </div>
        ) : (
          `Pay ${total} now`
        )}
      </button>
    </div>
  );
};

const CheckoutForm = () => {
  const checkout = useCheckout();
  const { session } = checkout;

  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
  });
  
  // Get formatted total amount
  const total = checkout?.total?.total?.amount;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setEmailError(message);
      setMessage(message);
      setIsLoading(false);
      return;
    }

    const confirmResult = await checkout.confirm();
    if (confirmResult.type === 'error') {
      setMessage(confirmResult.error.message);
    }

    setIsLoading(false);
  };
  
  const completeStep = (step) => {
    setStepsCompleted({...stepsCompleted, [step]: true});
    setCurrentStep(step + 1);
  };
  
  const handleEditStep = (step) => {
    setCurrentStep(step);
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-4">
      <div className="bg-[#161414] rounded-xl shadow-xl border border-gray-800 overflow-hidden">
        {/* Checkout header */}
        <div className="bg-gradient-to-r from-[#2a1f2c] to-[#231b24] p-6 border-b border-gray-800">
          <h2 className="text-3xl font-bold text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#cb18db] to-[#a012b8]">Complete Your Purchase</span>
          </h2>
        </div>

        <div className="p-6 md:p-8">
          {/* Main checkout steps */}
          <div className="max-w-3xl mx-auto">
            <CheckoutStep 
              step={1} 
              currentStep={currentStep} 
              title="Your Email" 
              icon={<Mail />} 
              isCompleted={stepsCompleted[1]}
              onEdit={handleEditStep}
            >
              <EmailStep 
                email={email} 
                setEmail={setEmail} 
                error={emailError} 
                setError={setEmailError}
                onComplete={() => completeStep(1)}
              />
            </CheckoutStep>

            <CheckoutStep 
              step={2} 
              currentStep={currentStep} 
              title="Billing Address" 
              icon={<CreditCard />}
              isCompleted={stepsCompleted[2]}
              onEdit={handleEditStep}
            >
              <BillingAddressStep onComplete={() => completeStep(2)} />
            </CheckoutStep>
            
            <CheckoutStep 
              step={3} 
              currentStep={currentStep} 
              title="Shipping Address" 
              icon={<Package />}
              isCompleted={stepsCompleted[3]}
              onEdit={handleEditStep}
            >
              <ShippingAddressStep onComplete={() => completeStep(3)} />
            </CheckoutStep>
            
            {checkout?.shippingOptions?.length > 0 && (
              <CheckoutStep 
                step={4} 
                currentStep={currentStep} 
                title="Shipping Method" 
                icon={<Truck />}
                isCompleted={stepsCompleted[4]}
                onEdit={handleEditStep}
              >
                <ShippingMethodsStep onComplete={() => completeStep(4)} />
              </CheckoutStep>
            )}
            
            <CheckoutStep 
              step={checkout?.shippingOptions?.length > 0 ? 5 : 4} 
              currentStep={currentStep} 
              title="Payment" 
              icon={<CreditCard />}
              isCompleted={false}
              onEdit={handleEditStep}
            >
              <PaymentStep 
                isLoading={isLoading} 
                handleSubmit={handleSubmit} 
                message={message}
                total={total}
              />
            </CheckoutStep>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;