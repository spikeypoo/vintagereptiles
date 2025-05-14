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
            placeholder="Enter Email"
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

// BillingAddressStep Component with "Same as shipping" checkbox
// Complete BillingAddressStep with styled checkbox
const BillingAddressStep = ({ onComplete, shippingAddressData }) => {
    const [sameAsShipping, setSameAsShipping] = useState(false);
    const checkout = useCheckout();
    
    useEffect(() => {
      const updateBillingAddress = async () => {
        if (sameAsShipping && shippingAddressData) {
          try {
            // Apply shipping address to billing using Stripe's API
            // This approach depends on your specific implementation of Stripe Checkout
            // You might need to adjust based on your checkout object structure
            await checkout.updateAddress({
              type: 'billing',
              address: {
                ...shippingAddressData.address
              },
              name: shippingAddressData.name
            });
          } catch (error) {
            console.error("Error copying shipping address to billing:", error);
          }
        }
      };
      
      updateBillingAddress();
    }, [sameAsShipping, shippingAddressData, checkout]);
  
    return (
      <div className="bg-[#1d1b1b] rounded-lg p-6 mb-4 shadow-lg border border-gray-800">
        <div className="mb-6">
          <label className="flex items-center text-white cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={sameAsShipping}
                onChange={(e) => setSameAsShipping(e.target.checked)}
                className="sr-only"
              />
              <div className={`
                w-6 h-6 flex-shrink-0 rounded-md mr-3 border-2 transition-all duration-200
                ${sameAsShipping 
                  ? 'bg-gradient-to-r from-[#cb18db] to-[#a012b8] border-transparent' 
                  : 'bg-[#2a2728] border-gray-600 group-hover:border-[#cb18db]'}
              `}>
                {sameAsShipping && (
                  <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-lg">Billing address is same as shipping address</span>
          </label>
        </div>
        
        {!sameAsShipping ? (
          <div className="bg-[#2a2728] rounded-md p-4 transition-all duration-300 opacity-100 max-h-[500px] overflow-hidden">
            <AddressElement
              options={{ mode: 'billing' }}
              className="stripe-element"
            />
          </div>
        ) : (
          <div className="px-4 py-3 bg-[#2a1f2c] rounded-md border border-[#cb18db]/30 transition-all duration-300">
            <p className="text-gray-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#cb18db] mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Using your shipping address for billing
            </p>
          </div>
        )}
        
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

  const updateShippingOptions = async (shippingDetails) => {
    const res = await fetch("/api/calculate-shipping-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkout_session_id: checkout.id,
        shipping_details: shippingDetails,
      }),
    });
    const json = await res.json();
    if (json.type === "error") {
      throw new Error(json.message);
    }
    // success: Stripe session has been updated server-side
  };

  export function ShippingAddressStep({ onComplete }) {
    // 👇 pull runServerUpdate directly from the hook
    const { runServerUpdate, getShippingAddressElement, id: sessionId } = useCheckout();
    const [error, setError] = useState(null);
  
    const handleSave = async () => {
      setError(null);
  
      // 1) Grab the AddressElement instance
      const addressElement = getShippingAddressElement();
      if (!addressElement) {
        setError("Could not access the address form");
        return;
      }
  
      // 2) Read its value & check completeness
      const { value, complete } = await addressElement.getValue();
      if (!complete) {
        setError("Please complete your shipping address");
        return;
      }
  
      try {
        // 3) Wrap your API POST in runServerUpdate
        await runServerUpdate(async () => {
          const res = await fetch("/api/calculate-shipping-options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              checkout_session_id: sessionId,
              shipping_details: value,
            }),
          });
          const json = await res.json();
          if (json.type === "error") {
            throw new Error(json.message);
          }
          // your server has now updated stripe.checkout.sessions with new rates
        });
  
        // 4) success! move to the next step
        onComplete();
      } catch (e) {
        setError(e.message);
      }
    };
  
    return (
      <div className="bg-[#1d1b1b] p-6 rounded-lg">
        <AddressElement options={{ mode: "shipping" }} />
        {error && <p className="text-red-400 mt-2">{error}</p>}
        <button
          onClick={handleSave}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white rounded"
        >
          Continue
        </button>
      </div>
    );
  }


const ShippingMethodsStep = ({ onComplete, updateShipping }) => {
    const checkout = useCheckout();
    const [selectedOption, setSelectedOption] = useState(null);
    const [initialized, setInitialized] = useState(false);
  
    // Initialize selected option and shipping cost just once
    useEffect(() => {
      if (!initialized && checkout?.shippingOptions?.length > 0) {
        const defaultOption = checkout.shippingOptions[0];
        
        setInitialized(true);
      }
    }, [checkout?.shippingOptions, initialized, updateShipping]);
  
    const handleSelectOption = async (optId) => {
      if (optId === selectedOption) return; // Prevent unnecessary updates
      
      setSelectedOption(optId);
      try {
        await checkout.updateShippingOption(optId);
        
        // Update shipping cost in order summary
        const selectedShippingOption = checkout.shippingOptions.find(opt => opt.id === optId);
        if (selectedShippingOption) {
          const cost = parseFloat(selectedShippingOption.amount.replace(/[^0-9.]/g, '')) || 0;
          updateShipping(cost);
        }
      } catch (error) {
        console.error("Error updating shipping option:", error);
      }
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start">
                    <div className={`
                      w-12 h-12 min-w-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0
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
                    <div className="flex-1 pr-4">
                      <h4 className="text-white font-semibold text-lg break-words">{opt.displayName}</h4>
                      <div className="flex items-center mt-1">
                        <Clock className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                        <span className="text-gray-400 text-sm">{estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mt-4 md:mt-0 ml-16 md:ml-4 flex-shrink-0">
                    <div className="text-white font-bold text-xl mr-4 whitespace-nowrap">
                      {opt.amount === `CA$0.00` ? "FREE" : opt.amount}
                    </div>
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
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

const CheckoutForm = ({ updateShipping }) => {
    const checkout = useCheckout();
    const { session } = checkout;
  
    // 1) Track which step we’re on, plus whether each’s done
    const [currentStep, setCurrentStep] = useState(1);
    const [stepsCompleted, setStepsCompleted] = useState({
      1: false,
      2: false,
      3: false,
      4: false,
    });
  
    // 2) Store the raw shippingDetails so we can send them to our API
    const [shippingDetails, setShippingDetails] = useState(null);
  
    // 3) Helper to POST to our Next.js API route
    const fetchShippingOptions = async (details) => {
      try {
        const res = await fetch('/api/calculate-shipping-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkout_session_id: checkout.id,
            shipping_details: shippingDetails,
          }),
        });
        const data = await res.json();
        if (data.type === 'error') {
          console.error('Shipping error:', data.message);
        }
        // Stripe React Checkout SDK will refresh checkout.shippingOptions for you
      } catch (err) {
        console.error('Failed to fetch shipping options', err);
      }
    };
  
    // mark a step complete and move on
    const completeStep = (step) => {
      setStepsCompleted((pc) => ({ ...pc, [step]: true }));
      setCurrentStep(step + 1);
    };
    const handleEditStep = (step) => setCurrentStep(step);
  
    // 4) When the shipping address step is done, capture details & call our API
    const onShippingAddressComplete = async () => {
      // the AddressElement writes into checkout.shippingDetails
      const details = checkout.shippingDetails;
      setShippingDetails(details);
  
      await fetchShippingOptions(details);
      completeStep(2);
    };
  
    return (
      <div className="max-w-4xl w-full mx-auto px-4">
        <div className="bg-[#161414] rounded-xl shadow-xl border border-gray-800 overflow-hidden">
          {/* … header … */}
          <div className="p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
              {/* 1: Email */}
              <CheckoutStep
                step={1}
                currentStep={currentStep}
                title="Your Email"
                icon={<Mail />}
                isCompleted={stepsCompleted[1]}
                onEdit={handleEditStep}
              >
                <EmailStep
                  email={checkout.email || ""}
                  setEmail={(e) => checkout.updateEmail(e)}
                  error={null}
                  setError={() => {}}
                  onComplete={() => completeStep(1)}
                />
              </CheckoutStep>
  
              {/* 2: Shipping Address */}
              <CheckoutStep
                step={2}
                currentStep={currentStep}
                title="Shipping Address"
                icon={<Package />}
                isCompleted={stepsCompleted[2]}
                onEdit={handleEditStep}
              >
                <ShippingAddressStep
                  onComplete={onShippingAddressComplete}
                  setShippingDetails={setShippingDetails}
                />
              </CheckoutStep>
  
              {/* 3: Billing Address */}
              <CheckoutStep
                step={3}
                currentStep={currentStep}
                title="Billing Address"
                icon={<CreditCard />}
                isCompleted={stepsCompleted[3]}
                onEdit={handleEditStep}
              >
                <BillingAddressStep
                  onComplete={() => completeStep(3)}
                  shippingAddressData={shippingDetails}
                />
              </CheckoutStep>
  
              {/* 4: Shipping Methods (only shows after our API has run) */}
              {checkout.shippingOptions?.length > 0 && (
                <CheckoutStep
                  step={4}
                  currentStep={currentStep}
                  title="Shipping Method"
                  icon={<Truck />}
                  isCompleted={stepsCompleted[4]}
                  onEdit={handleEditStep}
                >
                  <ShippingMethodsStep
                    onComplete={() => completeStep(4)}
                    updateShipping={updateShipping}
                  />
                </CheckoutStep>
              )}
  
              {/* final: Payment */}
              <CheckoutStep
                step={checkout.shippingOptions?.length > 0 ? 5 : 4}
                currentStep={currentStep}
                title="Payment"
                icon={<CreditCard />}
                isCompleted={false}
                onEdit={handleEditStep}
              >
                <PaymentStep
                  isLoading={false}
                  handleSubmit={() => checkout.confirm()}
                  message={null}
                  total={checkout.total?.total?.amount}
                />
              </CheckoutStep>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default CheckoutForm;