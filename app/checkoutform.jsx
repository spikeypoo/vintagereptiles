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
    <div className={`mb-6 transition-all duration-300 ${step <= currentStep ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
      <div className="flex items-center mb-3 relative">
        <div className={`
          flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3
          ${isActive ? 'bg-[#cb18db] text-white' : 
            isPreviouslyCompleted ? 'bg-green-500 text-white' : 'bg-[#2a2728] text-gray-300'}
          transition-colors duration-300
        `}>
          {isPreviouslyCompleted ? (
            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            React.cloneElement(icon, { className: "w-4 h-4 sm:w-5 sm:h-5" })
          )}
        </div>
        <h3 className={`text-lg sm:text-xl font-semibold flex-grow
          ${isActive ? 'text-white' : isPreviouslyCompleted ? 'text-green-400' : 'text-gray-400'}`}>
          {title}
        </h3>
        
        {isPreviouslyCompleted && (
          <button 
            onClick={() => onEdit(step)}
            className="text-[#cb18db] hover:text-[#d334e7] text-xs sm:text-sm font-medium flex items-center"
          >
            Edit
          </button>
        )}
      </div>
      
      <div className={`
        overflow-hidden transition-all duration-500 ease-in-out ml-6 sm:ml-12
        ${isActive ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}
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
    <div className="bg-[#1d1b1b] rounded-lg p-4 sm:p-6 mb-4 shadow-lg border border-gray-800">
      <div className="mb-5">
        <label className="block text-white text-base sm:text-lg mb-2 font-medium">
          Email
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter Email"
            className="w-full px-3 py-2 sm:px-4 sm:py-3 mt-2 rounded-md bg-[#2a2728] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#cb18db] focus:border-transparent transition duration-200"
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
          className="bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-md hover:from-[#d334e7] hover:to-[#b321c9] focus:outline-none focus:ring-2 focus:ring-[#cb18db] transition duration-200 flex items-center text-sm sm:text-base"
        >
          Continue <ArrowRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};

// BillingAddressStep Component with "Same as shipping" checkbox
export const BillingAddressStep = ({ onComplete, shippingAddressData }) => {
  const [sameAsShipping, setSameAsShipping] = useState(false);
  const [billingComplete, setBillingComplete] = useState(false);
  const checkout = useCheckout();
  
  // copy shipping → billing when toggled
  useEffect(() => {
    if (sameAsShipping && shippingAddressData) {
      checkout.updateAddress({
        type: 'billing',
        address: { ...shippingAddressData.address },
        name: shippingAddressData.name,
      }).catch(console.error);
      setBillingComplete(true);
    }
  }, [sameAsShipping, shippingAddressData, checkout]);

  return (
    <div className="bg-[#1d1b1b] rounded-lg p-4 sm:p-6 mb-4 shadow-lg border border-gray-800">
      <label className="flex items-center text-white mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={sameAsShipping}
          onChange={e => setSameAsShipping(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 rounded-md border-2 flex items-center justify-center transition-all
          ${sameAsShipping
            ? 'bg-gradient-to-r from-[#cb18db] to-[#a012b8] border-transparent'
            : 'bg-[#2a2728] border-gray-600 hover:border-[#cb18db]'}`}>
          {sameAsShipping && (
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-sm sm:text-base">Billing address is same as shipping</span>
      </label>

      {!sameAsShipping && (
        <div className="bg-[#2a2728] rounded-md p-3 sm:p-4 mb-5">
          <AddressElement
            options={{ mode: 'billing' }}
            onChange={e => setBillingComplete(e.complete)}
          />
        </div>
      )}

      <button
        onClick={onComplete}
        disabled={!(sameAsShipping || billingComplete)}
        className={`px-4 py-2 sm:px-6 sm:py-3 rounded-md text-white font-bold flex items-center transition-all text-sm sm:text-base
          bg-gradient-to-r from-[#cb18db] to-[#a012b8]
          ${!(sameAsShipping || billingComplete)
            ? 'opacity-50 pointer-events-none'
            : 'hover:from-[#d334e7] hover:to-[#b321c9]'}`}
      >
        Continue <ArrowRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};

export function ShippingAddressStep({ onComplete, active }) {
  const { runServerUpdate, getShippingAddressElement, id: sessionId } = useCheckout();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Force reset loading state when component is visible
  useEffect(() => {
    if (active) {
      setIsLoading(false);
      setError(null);
    }
  }, [active]);

  const handleSave = async () => {
    setError(null);
    setIsLoading(true);

    const addressElement = getShippingAddressElement();
    if (!addressElement) {
      setError("Could not access the address form");
      setIsLoading(false);
      return;
    }

    const { value, complete } = await addressElement.getValue();
    if (!complete) {
      setError("Please complete your shipping address");
      setIsLoading(false);
      return;
    }

    try {
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
      });

      onComplete();
    } catch (e) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  const buttonText = isLoading ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing...
    </>
  ) : (
    <>
      Continue <ArrowRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
    </>
  );

  return (
    <div className="bg-[#1d1b1b] p-4 sm:p-6 rounded-lg">
      <AddressElement options={{ mode: "shipping" }} />
      {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
      <div className="flex justify-end mt-4">
        <button
          key={`shipping-btn-${isLoading}`}
          onClick={handleSave}
          disabled={isLoading}
          className={`px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white rounded-md flex items-center justify-center transition-all duration-200 text-sm sm:text-base ${
            isLoading ? 'opacity-90' : 'hover:from-[#d334e7] hover:to-[#b321c9]'
          }`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export const ShippingMethodsStep = ({ onComplete, updateShipping }) => {
  const checkout = useCheckout();
  const [selectedOption, setSelectedOption] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize selected option just once
  useEffect(() => {
    if (!initialized && checkout?.shippingOptions?.length > 0) {
      setInitialized(true);
    }
  }, [checkout?.shippingOptions, initialized]);

  const handleSelectOption = async (optId) => {
    if (optId === selectedOption) return;
    
    setSelectedOption(optId);
    await checkout.updateShippingOption(optId);
    
    const opt = checkout.shippingOptions.find(o => o.id === optId);
    const cost = opt
      ? parseFloat(opt.amount.replace(/[^0-9.]/g, ''))  
      : 0;
    updateShipping(cost);
  };

  const getEstimatedDelivery = (name) => {
    const n = name.toLowerCase();
    if (n.includes('express')) return '1-2 Business Days';
    if (n.includes('standard')) return '3-5 Business Days';
    return '2-3 Business Days';
  };

  if (!checkout?.shippingOptions) {
    return (
      <div className="bg-[#1d1b1b] rounded-lg p-5 sm:p-8 mb-4 shadow-lg border border-gray-800 text-center">
        <div className="animate-spin inline-block mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-t-[#cb18db] border-r-[#cb18db]/30 border-b-[#cb18db]/10 border-l-[#cb18db]/60"></div>
        </div>
        <p className="text-white font-medium text-sm sm:text-base">Finding the best shipping options...</p>
      </div>
    );
  }

  if (checkout.shippingOptions.length === 0) {
    return (
      <div className="bg-[#1d1b1b] rounded-lg p-4 sm:p-6 mb-4 shadow-lg border border-gray-800 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/20 rounded-full mb-3 sm:mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base sm:text-lg font-medium text-white mb-2">No Shipping Options Available</h3>
        <p className="text-gray-400 text-sm sm:text-base">We couldn't find shipping options for your address. Please check your address or contact support.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1d1b1b] rounded-lg p-4 sm:p-6 mb-4 shadow-lg border border-gray-800">
      <div className="grid gap-3 sm:gap-4">
        {checkout.shippingOptions.map(opt => {
          const isSelected = opt.id === selectedOption;
          const eta = getEstimatedDelivery(opt.displayName);

          return (
            <div
              key={opt.id}
              onClick={() => handleSelectOption(opt.id)}
              className={`
                p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'border-[#cb18db] bg-gradient-to-r from-[#2a1f2c] to-[#231b24] shadow-lg'
                  : 'border-gray-700 bg-[#2a2728] hover:border-[#cb18db]'}
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start">
                  <div className={`
                    w-10 h-10 min-w-10 sm:w-12 sm:h-12 sm:min-w-12 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0
                    ${isSelected ? 'bg-[#cb18db]' : 'bg-gray-700'}
                  `}>
                    {opt.displayName.toLowerCase().includes('express') ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ) : (
                      <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 pr-3 sm:pr-4">
                    <h4 className="text-white font-semibold text-base sm:text-lg break-words">{opt.displayName}</h4>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1" />
                      <span className="text-gray-400 text-xs sm:text-sm">{eta}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center mt-3 sm:mt-0 ml-0 sm:ml-4 justify-between sm:justify-normal">
                  <div className="text-white font-bold text-lg sm:text-xl mr-3 sm:mr-4 whitespace-nowrap">
                    {opt.amount === 'CA$0.00' ? 'FREE' : opt.amount}
                  </div>
                  <div className={`
                    w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'border-[#cb18db] bg-[#cb18db]' : 'border-gray-500'}
                  `}>
                    {isSelected && <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-5 sm:mt-6">
        <button
          onClick={onComplete}
          disabled={!selectedOption}
          className={`bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-md text-sm sm:text-base
            ${!selectedOption ? 'opacity-50 pointer-events-none' : 'hover:from-[#d334e7] hover:to-[#b321c9]'}
            focus:outline-none focus:ring-2 focus:ring-[#cb18db] transition duration-200 flex items-center`}
        >
          Continue <ArrowRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};

const PaymentStep = ({ isLoading, handleSubmit, message, total }) => {
  return (
    <div className="bg-[#1d1b1b] rounded-lg p-4 sm:p-6 mb-4 shadow-lg border border-gray-800">
      <div className="bg-[#2a2728] rounded-md p-3 sm:p-4 mb-5 sm:mb-6">
        <PaymentElement
          id="payment-element"
          className="stripe-element"
          options={{ layout: { type: 'tabs', defaultCollapsed: false } }}
        />
      </div>
      
      {message && (
        <div
          id="payment-message"
          className={`p-3 sm:p-4 rounded-md mb-5 sm:mb-6 text-sm sm:text-base ${
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
        className="w-full bg-gradient-to-r from-[#cb18db] to-[#a012b8] text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-md hover:from-[#d334e7] hover:to-[#b321c9] focus:outline-none focus:ring-2 focus:ring-[#cb18db] disabled:opacity-70 transition duration-200 text-base sm:text-lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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

  // 1) Track which step we're on, plus whether each's done
  const [currentStep, setCurrentStep] = useState(1);
  const [stepsCompleted, setStepsCompleted] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  // 2) Store the raw shippingDetails so we can send them to our API
  const [shippingDetails, setShippingDetails] = useState(null);
  
  // Track loading state for shipping options
  const [loadingShippingOptions, setLoadingShippingOptions] = useState(false);

  // mark a step complete and move on
  const completeStep = (step) => {
    setStepsCompleted((pc) => ({ ...pc, [step]: true }));
    setCurrentStep(step + 1);

    if (step === 2) {
      updateShipping(null);
    }

  };
  
  // Handle editing a previous step
  const handleEditStep = (step) => {
    // If going back to shipping address step, clear loading state
    if (step === 2) {
      setLoadingShippingOptions(false);
      updateShipping(null);
    }
    setCurrentStep(step);
  };

  // 4) When the shipping address step is done, capture details & call our API
  const onShippingAddressComplete = async () => {
    // the AddressElement writes into checkout.shippingDetails
    const details = checkout.shippingDetails;
    setShippingDetails(details);
    setLoadingShippingOptions(true); // Set loading state for shipping options
    
    // After some time, the shipping options will be loaded via the checkout hook
    // Let's automatically move to the next step
    completeStep(2);
  };

  // When shipping methods step is shown, automatically reset the loading state
  useEffect(() => {
    if (currentStep === 4 && checkout.shippingOptions) {
      setLoadingShippingOptions(false);
    }
  }, [currentStep, checkout.shippingOptions]);

  // Creating a key for the shipping address step to force re-render
  const shippingAddressKey = `shipping-address-${currentStep === 2 ? 'active' : 'inactive'}`;

  return (
    <div className="w-full mx-auto px-3 sm:px-4">
      <div className="bg-[#161414] rounded-xl shadow-xl border border-gray-800 overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="mx-auto">
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

            {/* 2: Shipping Address - with key to force re-render */}
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
                active={currentStep === 2}
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

            {/* 4: Shipping Methods */}
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

            {/* final: Payment */}
            <CheckoutStep
              step={5}
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